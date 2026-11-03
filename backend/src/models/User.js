// --- Importar Mongoose ---
const mongoose = require("mongoose");


// --- Schema De Usuarios ---
const userSchema = new mongoose.Schema(

    {
        email: {
            type: String,
            required: [true, "El correo electrónico es obligatorio"],
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: [254, "El correo electrónico es demasiado largo"]

        },

        passwordHash: {
            type: String,
            required: [true, "La contraseña es obligatoria"]
        },

        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role",
            required: [true, "El usuario debe tener un rol"]
        },

        isActive: {
            type: Boolean,
            default: true
        },

        failedLoginAttempts: {
            type: Number,
            default: 0,
            min: [0, "Los intentos fallidos no pueden ser negativos"],
            validate: {
                validator: Number.isInteger,
                message: "Los intentos fallidos deben ser un número entero"
            }
        },

        lockedUntil: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// ---  Exportar esquema ---
module.exports = mongoose.model("User", userSchema);
