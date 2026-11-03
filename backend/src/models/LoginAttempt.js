// --- Importar Mongoose ---
const mongoose = require("mongoose");


// --- Crear Schema De Intento De Inicio De Sessión ---
const loginAttemptSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        email: {
            type: String,
            required: [true, "El correo electrónico es obligatorio"],
            trim: true,
            lowercase: true,
            maxlength: [254, "El correo electrónico es demasiado largo"]
        },

        ipAddress: {
            type: String,
            required: [true, "La dirección IP es obligatoria"]
        },

        success: {
            type: Boolean,
            required: [true, "El resultado del intento es obligatorio"]
        }
    },
    {
        timestamps: true
    }
);


// Consultas del historial de intentos por usuario.
loginAttemptSchema.index({ user: 1, createdAt: -1 });

// Consultas por correo electrónico.
loginAttemptSchema.index({ email: 1, createdAt: -1 });


// --- Exportar Schema De Intento De Inicio De Sesión ---
module.exports = mongoose.model("LoginAttempt", loginAttemptSchema);