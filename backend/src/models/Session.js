// --- Importar Mongoose ---
const mongoose = require("mongoose");


// --- Schema de Sesiones ---
const sessionSchema = new mongoose.Schema(
    {
        sessionTokenHash: {
            type: String,
            required: [true, "El hash del token es obligatorio"],
            unique: true
        },

        csrfTokenHash: {
            type: String,
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "La sesión debe pertenecer a un usuario"]
        },

        expiresAt: {
            type: Date,
            required: [true, "La fecha de expiración es obligatoria"]
        },

        revokedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


// --- Îndice para consultar rápidamente las sesiones de un usuario ---
sessionSchema.index({ user:1 });

// --- Indice para localizar sesiones expiradas ---
sessionSchema.index({ expiresAt:1 });

// --- Exportar Schema de Sessiones ---
module.exports = mongoose.model("Session", sessionSchema);