const mongoose = require("mongoose");


// -------------------------------------------------------------------------
// MIDDLEWARE: GENERAR SLUG AUTOMÁTICAMENTE ANTES DE GUARDAR LA CATEGORÍA
// -------------------------------------------------------------------------
const generateSlug = (text) => {

    return text
        .normalize("NFD")                // Separar letra de su acento
        .replace(/[\u0300-\u036f]/g, "") // Elimina tildes
        .toLowerCase()                   // Minusculas
        .trim()                          // Eliminar Espacios inicio-fin
        .replace(/[^a-z0-9]+/g, "-")     // Reemplaza espacios y símbolos
        .replace(/^-+|-+$/g, "");        // Elimina guiones de los extremos

}


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
        trim: true,
        maxlength: [250, "La descripcion de la categoria no puede exceder los 250 caracteres"]
    },
    isActive: {
        type: Boolean,
        default: true // Permite ocultar una categoria entera del menu si es necesario
    }
}, {
    timestamps: true // "createdAt" y "updatedAt"
});


// --- Generar Slug Antes De Validar ---
categorySchema.pre("validate", function (){

    // --- Si Fue Modificada O No Tiene Slung --
    if (this.isModified("name") || !this.slug) {

        // --- Limpiar y generar Slung ---
        this.slug = generateSlug(this.name || "");

    }
});


const Category = mongoose.model('Category', categorySchema);

module.exports = Category;