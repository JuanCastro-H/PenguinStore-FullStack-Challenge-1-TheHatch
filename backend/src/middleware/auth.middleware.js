
const crypto = require("crypto");

const Session = require("../models/Session");

const { verifyToken } = require("../services/jwt.service");
const { hashToken } = require("../services/session.service");


// =============================================
// VERIFICAR TOKEN + SESION
// =============================================

const verifySession = async (token, req, authMethod) => {

    // --- Verificar JWT ---

    const decoded = verifyToken(token);


    // --- Comprobar Que El JWT Contenga Los Datos Necesarios ---

    if (
        !decoded ||
        typeof decoded.sub !== "string" ||
        typeof decoded.sessionId !== "string"
    ) {
        throw new Error("INVALID_TOKEN");
    }


    // --- Buscar Session En MongoDB ---

    const session = await Session.findById(decoded.sessionId)
        .populate({
            path: "user",
            populate: {
                path: "role"
            }
        });


    // --- Comprobar Que Existe ---

    if (!session) {
        throw new Error("SESSION_NOT_FOUND");
    }


    // --- Comprobar Si Fue Revocada ---

    if (session.revokedAt) {
        throw new Error("SESSION_REVOKED");
    }


    // --- Comprobar Expiracion ---

    if (session.expiresAt <= new Date()) {
        throw new Error("SESSION_EXPIRED");
    }


    // --- Obtener Usuario ---

    const user = session.user;


    // --- Comprobar Que El Usuario Existe ---

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }


    // --- Comprobar Actividad De La Cuenta ---

    if (!user.isActive) {
        throw new Error("ACCOUNT_INACTIVE");
    }


    // --- Comprobar Que El Usuario Tiene Un Rol ---

    if (!user.role) {
        throw new Error("USER_ROLE_NOT_FOUND");
    }


    // --- Comprobar Que El JWT Pertenece Al Usuario ---

    if (user._id.toString() !== decoded.sub) {
        throw new Error("INVALID_TOKEN");
    }


    // --- Obtener Hash Del Token ---

    const tokenHash = hashToken(token);
    const storedHash = session.sessionTokenHash;


    // --- Comprobar Formato Del Hash ---

    if (
        typeof storedHash !== "string" ||
        !/^[a-f0-9]{64}$/i.test(storedHash)
    ) {
        throw new Error("INVALID_SESSION_TOKEN");
    }


    // --- Comparar Hash Del Token ---

    const storedBuffer = Buffer.from(storedHash, "hex");
    const receivedBuffer = Buffer.from(tokenHash, "hex");

    if (
        storedBuffer.length !== receivedBuffer.length ||
        !crypto.timingSafeEqual(storedBuffer, receivedBuffer)
    ) {
        throw new Error("INVALID_SESSION_TOKEN");
    }


    // --- Guardar Usuario Autenticado ---

    req.user = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role.name,
        sessionId: session._id.toString()
    };

    req.session = session;

    req.authMethod = authMethod;

};



// =============================================
// MANEJAR ERRORES DE AUTENTICACION
// =============================================

const handleAuthError = (req, res, status, message, redirect = false) => {

    // --- Errores De JWT ---

    if (
        error.name === "TokenExpiredError" ||
        error.name === "JsonWebTokenError" ||
        error.name === "NotBeforeError"
    ) {

        if (redirect) {
            
            res.clearCookie("accessToken", {

                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/"
            
            });

            return res.redirect(303, "/admin/login");
        }

        return res.status(401).json({ message: "Invalid or expired token "});
    }


    // --- Cuenta Inactiva ---

    if (error.message === "ACCOUNT_INACTIVE") {

        if (redirect) {
            
            res.clearCookie("accessToken", {

                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/"

            });

            return res.redirect(303, "/admin/login");
        }

        return res.status(403).json({ message: "Account inactive" });
    }


    // --- Rol No Encontrado ---

    if (error.message === "USER_ROLE_NOT_FOUND") {

        if (redirect) {

            res.clearCookie("accessToken", {

                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/"

            });

            return res.redirect(303, "/admin/login");
        }

        return res.status(403).json({ message: "User role not found" });
    }

    // --- Errores De Sesion ---

    if (
        error.message === "SESSION_NOT_FOUND" ||
        error.message === "SESSION_REVOKED" ||
        error.message === "SESSION_EXPIRED" ||
        error.message === "INVALID_TOKEN" ||
        error.message === "INVALID_SESSION_TOKEN" ||
        error.message === "USER_NOT_FOUND"
    ) {

        if (redirect) {
            
            res.clearCookie("accessToken", {

                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/"
            
            });

            return res.redirect(303, "/admin/login");
        }

        return res.status(401).json({ message: "Invalid or inactive session "});

    }


    // --- Errores Desconocidos ---

    return next(error);


}




// =============================================
// MIDDLEWARE DE AUTENTICACIÓN
// =============================================

const authenticateToken = (options = {}) => async (req, res, next) => {

    const redirect = options.redirect === true;

    // --- Indentificar Peticiones Del Panel HTML ---

    req.authRedirect = redirect;


    // --- Comprobar Configuracion De Seguridad ---

    if (!process.env.JWT_SECRET) {
        return next(new Error("JWT_SECRET no esta configurado"));
    }


    // --- Obtener Authorization ---

    const authHeader = req.headers.authorization;


    // ---------------------------------
    // OPCION 1 - JWT BEARER
    // ---------------------------------

    if (authHeader) {

        // --- Separar "Bearer" Del Token ---

        const [type, token, ...extra] = authHeader.split(" ");


        // --- Comprobar Formato Bearer ---

        if (type !== "Bearer" || !token || extra.length > 0) {

            if (redirect) {
                return res.redirect(303, "/admin/login");
            }

            return res.status(401).json({
                message: "Invalid authorization format"
            });
        }


        // --- Verificar JWT + Session ---

        try {

            await verifySession(token, req, "bearer");


            // --- Continuar Con La Peticion ---

            return next();

        } catch (error) {

            // --- Enviar Error Al Sistema De Manejo De Errores ---
            return handleAuthError(error, req, res, next, redirect);

        }
    }


    // -----------------------------
    // OPCION 2 - COOKIE
    // -----------------------------

    // --- Obtener JWT De La Cookie ---

    const token = req.cookies?.accessToken;


    // --- Manejar Error Si No Se Obtiene ---

    if (!token) {

        if (redirect) {
            return res.redirect(303, "/admin/login");
        }

        return res.status(401).json({
            message: "Authentication required"
        });
    }


    try {

        // --- Verificar JWT + Session ---

        await verifySession(token, req, "cookie");


        // --- Continuar Con El Flujo ---

        return next();

    } catch (error) {

        // --- Evniar Errores Al Sistema De Manejo De Errores ---
        return handleAuthError(error, req, res, next, redirect);
    
    }

};



// =============================================
// EXPORTAR MIDDLEWARE
// =============================================

module.exports = {
    authenticateToken
};
