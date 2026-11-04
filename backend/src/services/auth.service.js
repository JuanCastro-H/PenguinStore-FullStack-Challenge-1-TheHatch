// ===========================
// SERVICIO DE AUTENTICACION
// ===========================

const User = require("../models/User");
const Role = require("../models/Role");
const Session = require("../models/Session");
const LoginAttempt = require("../models/LoginAttempt");


// --- Funcion Para Hashear Una Clave ---
const { hashPassword, verifyPassword } = require("./password.service");
const { generateToken } = require("./jwt.service");
const { hashToken, generateSessionPlaceholder } = require("./session.service");


// ----------------------------------------
// CONFIGURACIÓN DE SEGURIDAD
// ----------------------------------------


const MAX_FAILED_ATTEMPTS = 5;       // Cantidad de intentos fallidos
const LOCK_TIME_MINUTES = 15;        // Tiempo de bloqueo
const SESSION_DURATION_MINUTES = 15; // Tiempo de la sessión



// ------------------------------
// REGISTRAR INTENTOS DE LOGIN
// ------------------------------

const createLoginAttempt = async ({
    userId,
    email,
    ipAddress,
    success
}) => {

    await LoginAttempt.create({
        data: {
            user: userId,
            email,
            ipAddress,
            success
        }
    });
};
