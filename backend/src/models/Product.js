const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "El nombre del producto es obligatorio"],
        trim: true, // Elimina espacios en blanco al inicio y final
        maxlength: [150, "El nombre no peude exceder los 150 caracteres"]
    },
    descripcion: {
        type: String,
        required: [true, "La descripcion es obligatoria"],
        trim: true,
        maxlength: [650, "El nombre no peude exceder los 150 caracteres"]
    },
    price: {
        type: Number,
        required: [true, "El precio es obligatorio"],
        min: [0, "El precio no puede ser un numero negativo"]
    },
    stock: {
        type: Number,
        required: [true, "El stock es obligatorio"],
        min: [0, "El stock no puede ser menor a 0"],
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Referencia a otro modelo de Categorias
        required: [true, "la categoria es obligatoria"]
    },
    imageUrl: [{
        type: String, // Array de URLs de las imagenes del producto
        required: true
    }],
    isActive: {
        type: Boolean,
        default: true // Permite "desactivar" productos sin borrarlos de la BD
    }
}, {
    timestamps: true // Crea automaticamente: "createdAt" y "updatedAt"
});

// --- Creacion Del Modelo ---
const Product = mongoose.model('Product', productSchema);

module.exports = Product;