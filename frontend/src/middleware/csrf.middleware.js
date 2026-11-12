
const crypto = require("crypto");

// =============================================
// GENERAR TOKEN CSRF
// =============================================

const provideCsrfToken = (req, res, next) => {

    // --- Generar token aleatorio ---

    const token = crypto.randomBytes(32).toString("hex");

    // --- Guardar token en cookie protegida ---

    res.cookie("storeCsrfToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60 * 1000
    });

    // --- Compartir token con la vista ---

    res.locals.csrfToken = token;

    next();
};

// =============================================
// VALIDAR TOKEN CSRF
// =============================================

const verifyCsrfToken = (req, res, next) => {

    const cookieToken = req.cookies.storeCsrfToken;
    const formToken = req.body?._csrf;

    // --- Validar estructura de los tokens ---

    if (
        typeof cookieToken !== "string" ||
        typeof formToken !== "string" ||
        !/^[a-f0-9]{64}$/i.test(cookieToken) ||
        !/^[a-f0-9]{64}$/i.test(formToken)
    ) {
        return res.status(403).send(
            "Token CSRF inválido. Recarga la página."
        );
    }

    // --- Comparar tokens de forma segura ---

    const valid = crypto.timingSafeEqual(
        Buffer.from(cookieToken, "hex"),
        Buffer.from(formToken, "hex")
    );

    if (!valid) {
        return res.status(403).send(
            "Token CSRF inválido. Recarga la página."
        );
    }

    next();
};

// =============================================
// EXPORTAR MIDDLEWARES
// =============================================

module.exports = {
    provideCsrfToken,
    verifyCsrfToken
};
