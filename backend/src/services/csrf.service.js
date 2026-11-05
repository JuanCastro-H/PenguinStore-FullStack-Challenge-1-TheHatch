// --- Importar crypto ---
const crypto = require("crypto");


// =============================================
// GENERAR TOKEN CSRF
// =============================================

const generateCsrfToken = () => {

    return crypto.randomBytes(32).toString("hex"); // Genera un token aleatorio de 32 bits.

};


// =============================================
// HASHEAR TOKEN CSRF
// =============================================

const hashCsrfToken = (token) => {

    return crypto
        .createHash("sha256") // Inicializa el algoritmo de hashing SHA-256
        .update(token)        // Introduce el token que se va a procesar
        .digest("hex");       // Genera el resultado final en formato hexadecimal

};


// =============================================
// EXPORTAR FUNCIONES
// =============================================

module.exports = {
    generateCsrfToken,
    hashCsrfToken
};
