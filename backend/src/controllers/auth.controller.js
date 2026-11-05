// --- Importar Servicios ---
const {
    registerUser,
    loginUser,
    logoutUser
} = require("../services/auth.service");


// =============================================
// CONFIGURACIÓN DE COOKIES
// =============================================

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
};

const csrfCookieOptions = {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
};


// =============================================
// REGISTRAR USUARIO
// =============================================

const register = async (req, res, next) => {

    try {

        // --- Obtener Datos Del Usuario ---

        const { email, password } = req.body;


        // --- Registrar Usuario ---

        const user = await registerUser({
            email,
            password
        });


        // --- Devolver Resultado ---

        return res.status(201).json({
            message: "User registered successfully",
            user
        });

    } catch (error) {

        if (error.message === "USER_ALREADY_EXISTS") {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        if (error.message === "DEFAULT_ROLE_NOT_FOUND") {
            return res.status(500).json({
                message: "Default role configuration error"
            });
        }

        return next(error);
    }

};


// =============================================
// INICIAR SESIÓN
// =============================================

const login = async (req, res, next) => {

    try {

        // --- Obtener Credenciales ---

        const { email, password } = req.body;


        // --- Obtener Direccion IP ---

        const ipAddress = req.ip || req.socket.remoteAddress;


        // --- Iniciar Sesion ---

        const result = await loginUser({
            email,
            password,
            ipAddress
        });


        // --- Configurar Cookie JWT ---

        res.cookie(
            "accessToken",
            result.token,
            {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000
            }
        );


        // --- Configurar Cookie CSRF ---

        res.cookie(
            "csrfToken",
            result.csrfToken,
            {
                ...csrfCookieOptions,
                maxAge: 15 * 60 * 1000
            }
        );


        // --- Devolver Resultado ---

        return res.status(200).json({
            message: "Login successful",
            user: result.user
        });

    } catch (error) {

        if (
            error.message === "INVALID_CREDENTIALS" ||
            error.message === "ACCOUNT_LOCKED"
        ) {
            return res.status(401).json({
                message: "Invalid credentials or account temporarily unavailable"
            });
        }

        if (error.message === "ACCOUNT_INACTIVE") {
            return res.status(403).json({
                message: "Account inactive"
            });
        }

        return next(error);
    }

};


// =============================================
// OBTENER USUARIO AUTENTICADO
// =============================================

const getCurrentUser = (req, res) => {

    // --- Obtener Usuario Autenticado ---

    return res.status(200).json({
        user: req.user
    });

};


// =============================================
// CERRAR SESIÓN
// =============================================

const logout = async (req, res, next) => {

    try {

        // --- Obtener ID De La Sesion ---

        const sessionId = req.user.sessionId;


        // --- Revocar Sesion ---

        await logoutUser(sessionId);


        // --- Eliminar Cookies ---

        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("csrfToken", csrfCookieOptions);


        // --- Devolver Resultado ---

        return res.status(200).json({
            message: "Logout successful"
        });

    } catch (error) {

        return next(error);
    }

};


// =============================================
// EXPORTAR CONTROLADORES
// =============================================

module.exports = {
    register,
    login,
    getCurrentUser,
    logout
};
