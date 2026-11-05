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




// ------------------------------
// INICIAR SESION
// ------------------------------

const loginUser = async ({email, password, ipAddress}) => {

    // --- Normalizar Email ---
    const normalizedEmail = email
        .trim()
        .toLowerCase();
    

    // --- Buscar Usuario ---
    const user = await User.findOne({
        email: normalizedEmail
    }).populate("role");


    // --- Si El Usuario No Existe ---
    if (!user) {

        //  Registrar intento de registro fallido.
        await createLoginAttempt({

            userId: null,
            email: normalizedEmail,
            ipAddress,
            success: false

        });

        throw new Error("INVALID_CREDENTIALS");

    }


    // --- Comprobar Si La Cuenta Esta Activa ---
    if (!user.isActive) {

        await createLoginAttempt({
            userId: user._id,
            email: user.email,
            ipAddress,
            success: false
        });

        throw new Error("ACCOUNT_INACTIVE");

    }


    // --- Comprobar Si La Cuenta Esta Bloqueada ---
    if (user.lockedUntil && user.lockedUntil > new Date()){

        throw new Error("ACCOUNT_LOCKED");

    }


    // --- Verificar Contrasenia ---
    const passwordIsValid = await verifyPassword(
        user.passwordHash,
        password
    );


    // --- Contrasenia Incorrecta ---
    if (!passwordIsValid){

        // Registrar intentos
        await createLoginAttempt({

            userId: user._id,
            email: user.email,
            ipAddress,
            success: false

        });

        // Aumentar El Numero De Intentos Fallidos
        const updatedUser = await User.findByIdAndUpdate( 
            user._id,                             // Indentificar de usuario
            { $inc: { failedLoginAttempts: 1 } }, // Incrementar valor
            {                                     
                returnDocument: "after",          // Obtener documento actualizado
                runValidators: true               // Asegurarse que el cambio cumpla con el schema
            }
        );


        // --- Comprobar Si Se Alcanzo EL Numero De Intentos ---
        if (updatedUser.failedLoginAttempts >= MAX_FAILED_ATTEMPTS){

            // Calcular Tiempo Del Bloqueo.
            const lockedUntil = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);

            await User.findByIdAndUpdate(
                user._id,
                { lockedUntil },
                { runValidators: true}
            );
        } 

        throw new Error("INVALID_CREDENTIALS");

    }

    // -----------------------------
    // LOGIN EXITOSO
    // -----------------------------

    await createLoginAttempt({

        userId: user._id,
        email: user.email,
        ipAddress,
        success: true

    });


    // --- Reiniciar Contador ---

    await User.findByIdAndUpdate(

        user._id,                    // Identificador del usuario
        {
            failedLoginAttempts: 0,  // Reinicar intentos
            lockedUntil: null        // Quitar fecha de bloqueo
        },
        { runValidators: true }      // Asegurarse que se cumple el schema

    );


    // -----------------------------
    //  CREAR SESSION 
    // -----------------------------


    // ---  Calcular Fecha De Expiracion De La Session ---
    const expiresAt = new Date(
        Date.now() + SESSION_DURATION_MINUTES * 60 * 1000
    );

    // --- Registrar Session En La Base De Datos ---
    const session = await Session.create({

            sessionTokenHash: generateSessionPlaceholder(),
            userId: user._id,
            expiresAt

    });


    try {

        // --- Generar JWT ---
        const token = generateToken({
    
            sub: user._id.toString(),
            email: user.email,
            role: user.role.name,
            sessionId: session._id.toString()
    
        });
    
    
        // --- Encriptar Token De Session Y Guardarlo ---
        const sessionTokenHash = hashToken(token);
        await session.save();
    

        // --- Devolver Resultado ---
        return {
            token,                              // Devolver JWT.
            sessionId: session._id.toString(),  // Devolver session.
            // - Datos De Usuario -
            user: {
                id: user.id,
                email: user.email,
                role: user.role.name
            }
        };


    } catch (error) {

        await Session.findByIdAndDelete(session._id);
        throw error;

    }
};



// --------------------------------
//  CERRAR SESIÓN
// --------------------------------

const logoutUser = async (sessionId) => {

    // --- Buscar La Sesion Unica En La BD ---

    const session = await Session.findById(sessionId);


    // --- Comprobar Que Existe ---

    if (!session) { // Se detiene la ejecucion y lanza un error.
        throw new Error("SESSION_NOT_FOUND");
    }


    if (session.revokedAt) {
        throw new Error("SESSION_ALREADY_REVOKED");
    }

    session.revokedAt = new Daate();

    // --- Revocar Sesion ---

    await session.save();

};




// --- Exportar Funciones Del Modulo ---
module.exports = {
    registerUser,
    loginUser,
    logoutUser
};