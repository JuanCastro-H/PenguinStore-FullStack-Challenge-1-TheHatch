const mongoose = require("mongoose");


// =============================================
// ESQUEMA DE LOS DATOS DEL CLIENTE
// =============================================

const customerSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 150
    },

    address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 250
    }

}, {
    _id: false
});



// =============================================
// ESQUEMA DE LOS PRODUCTOS DEL PEDIDO
// =============================================

const orderItemSchema = new mongoose.Schema({

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    // Conservar datos históricos del producto

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },

    price: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: "El precio debe ser un número entero."
        }
    },

    quantity: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: Number.isInteger,
            message: "La cantidad debe ser un número entero."
        }
    },

    subtotal: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: "El subtotal debe ser un número entero."
        }
    }

}, {
    _id: false
});


