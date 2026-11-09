
const crypto = require("crypto");

const { hashCsrfToken } = require("../services/csrf.service");


// =============================================
// MIDDLEWARE DE PROTECCIÓN CSRF
// =============================================

const verifyCsrfToken = (req, res, next) => {

    // --- Comprobar Metodo HTTP ---

    const safeMethods = ["GET", "HEAD", "OPTIONS"];

    if (safeMethods.includes(req.method)) {
        return next();
    }


    // --- Comprobar Metodo De Autenticacion ---

    if (req.authMethod === "bearer") {
        return next();
    }


    // --- Obtener Tokens CSRF ---

    const cookieToken = req.cookies?.csrfToken;
    const headerToken = req.headers["x-csrf-token"];
    const formToken = req.body?._csrf;


    // --- Obtener Token Enviado ---

    const submittedToken = headerToken ?? formToken;



    // --- Comprobar Que Existan Ambos Tokens ---

    if (
        typeof cookieToken !== "string" ||
        typeof submittedToken !== "string"
    ) {
        return res.status(403).json({
            message: "CSRF token required"
        });
    }


    // --- Comprobar Formato De Los Tokens ---

    const tokenPattern = /^[a-f0-9]{64}$/i;

    if (
        !tokenPattern.test(cookieToken) ||
        !tokenPattern.test(submittedToken)
    ) {
        return res.status(403).json({
            message: "Invalid CSRF token"
        });
    }


    // --- Comparar Cookie Y Token Enviado ---

    const cookieBuffer   = Buffer.from(cookieToken, "hex");
    const submittedBuffer = Buffer.from(submittedToken, "hex");

    if (
        !crypto.timingSafeEqual(cookieBuffer, submittedBuffer)
    ) {
        return res.status(403).json({
            message: "CSRF token mismatch"
        });
    }


    // --- Comprobar Que Existe Una Sesion Autenticada ---

    if (!req.session || !req.session.csrfTokenHash) {
        return res.status(403).json({
            message: "Invalid CSRF session"
        });
    }


    // --- Verificar Hash CSRF De La Sesion ---

    const receivedHash = hashCsrfToken(submittedToken);
    const storedHash = req.session.csrfTokenHash;

    if (!/^[a-f0-9]{64}$/i.test(storedHash)) {
        return res.status(403).json({
            message: "Invalid CSRF session"
        });
    }

    const receivedBuffer = Buffer.from(receivedHash, "hex");
    const storedBuffer = Buffer.from(storedHash, "hex");

    if (
        receivedBuffer.length !== storedBuffer.length ||
        !crypto.timingSafeEqual(receivedBuffer, storedBuffer)
    ) {
        return res.status(403).json({
            message: "Invalid CSRF token"
        });
    }


    // --- Continuar Con La Peticion ---

    next();

};



const verifyLoginCsrfToken = (req, res, next) => {

    // --- Obtener Tokens CSRF ---

    const cookieToken = req.cookies?.csrfToken;
    const formToken   = req.body?._csrf;


    // --- Comprobar Que Existen Ambos Tokens ---

    if ( 
        typeof cookieToken !== "string" ||
        typeof formToken   !== "string"
    ) {
        return res.redirect(303, "/admin/login?error=csrf");
    }

    // --- Comprobar Formato De Los Tokens ---

    const tokenPattern = /^[a-f0-9]{64}$/i;

    if (
        !tokenPattern.test(cookieToken) ||
        !tokenPattern.test(formToken)
    ) {
        return res.redirect(303, "/admin/login?error=csrf");
    }


    // --- Comparar Cookie Y Token Del Formulario ---

    const cookieBuffer = Buffer.from(cookieToken, "hex");
    const formBuffer    = Buffer.from(formToken, "hex");

    if (
        !crypto.timingSafeEqual(cookieBuffer, formBuffer)
    ) {
        return res.redirect(303, "/admin/login?error=csrf");
    }


    
    // --- Continuar Petición ---

    next();


};

// =============================================
// EXPORTAR MIDDLEWARE
// =============================================

module.exports = {
    verifyCsrfToken
};
