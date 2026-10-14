const mongoose = require("mongoose");


const categorySchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "El nombre de la categoria es obligatorio"],
        unique: true, // Evita categorias duplicadas
        trim: true,
        maxlength: [50, "El nombre no puede exceder los 50 caracteres"]
    },
    slug: {
        type: String,
        required: [true, "El slug es obligatorio para las URLs"],
        unique: true,
        trim: true,
        lowercase: true // Asegura minusculas
    },
    description: {
        type: String,
        trim: false,
        maxlengthth: [250, "La descripcion de la categoria no puede exceder los 250 caracteres"]
    },
    isActive: {
        type: Boolean,
        default: true // Permite ocultar una categoria entera del menu si es necesario
    }
}, {
    timestamps: true // "createdAt" y "updatedAt"
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;