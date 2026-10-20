const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "El nombre del producto es obligatorio"],
        trim: true, // Elimina espacios en blanco al inicio y final
        maxlength: [150, "El nombre no puede exceder los 150 caracteres"]
    },
    descripcion: {
        type: String,
        required: [true, "La descripcion es obligatoria"],
        trim: true,
        maxlength: [650, "La descripcion no puede exceder los 650 caracteres"]
    },
    price: {
        type: Number,
        required: [true, "El precio es obligatorio"],
        min: [0, "El precio no puede ser un numero negativo"],
        validate: { // Validacion para bloquear decimales
            validator: Number.isInteger,
            message: "El precio debe ser entero"
        }
    },
    stock: {
        type: Number,
        required: [true, "El stock es obligatorio"],
        min: [0, "El stock no puede ser menor a 0"],
        default: 0,
        validate: { // Bloquear stock con decimales
            validator: Number.isInteger,
            message: "El stock deber ser entero"
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', // Referencia a otro modelo de Categorias
        required: [true, "la categoria es obligatoria"]
    },
    images: [{
        type: [{ 
            type: String, // Array de URLs de las imagenes del producto
            trim: true
        }],
        default: [],      
        validate: {  // validar que haya imagenes cargadas 
            validator: function (images) {
                return images.every(
                    image => image.length > 0
                );
            },
            message: "Las URLs de las imagenes no pueden estar vacias"
        }
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