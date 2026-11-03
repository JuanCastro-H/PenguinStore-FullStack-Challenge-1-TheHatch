// --- Importar Mongoose ---
const mongoose = require("mongoose");


// --- Crear Schema De Rol ---
const roleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "El nombre del rol es obligatorio"],
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: [30, "El nombre del rol no puede superar los 30 caracteres"]
        }
    },
    {
        timestamps:true
    }
);

// --- Exportar Schema ---
module.exports = mongoose.model("Role", roleSchema);
