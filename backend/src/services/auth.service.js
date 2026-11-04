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




// ------------------------------
// REGISTRAR USUARIO
// ------------------------------

const registerUser = async ({email, password}) => {

    // --- Normalizar Email ---
    const normalizedEmail = email.trim().toLowerCase(); // Eliminar espacios y convertir a minusculas.


    // ---- Comprobar Si Existe El Usuario ---
    const existingUser = await User.findOne({
            email: normalizedEmail
    });

    if (existingUser) { // Si existe el usuario detenemos el registro.
        throw new Error("USER_ALREADY_EXISTS");
    }


    // --- Asignar Rol "Usuario" Por Defecto ---
    const userRole = await Role.findOne({
            name: "user"
    });

    if (!userRole){ // Sino existe "User... 
        throw new Error("DEFAULT_ROLE_NOT_FOUND"); // Notificar de error en la configuracion.
    }


    // --- Hashear Contrasenia ---
    const passwordHash = await hashPassword(password);

    try {
        
        // --- Crear Usuario ---
        const user = await User.create({
                email: normalizedEmail,  // Correo.
                passwordHash,            // Clave hasheada.
                roleId: userRole._id      // Id del nuevo usuario.
        });
    
        // --- Retornar Datos Publicos Del Usuario ---
        return {
            id: user._id,
            email: user.email,
            role: userRole,
            createdAt: user.createdAt
        };


    } catch (error) {

        // --- Control De Usuarios Duplicados ---
        if (error.code === 11000) {
            throw new Error("USER_ALREADY_EXISTS");
        }

        throw error;
    }
};

