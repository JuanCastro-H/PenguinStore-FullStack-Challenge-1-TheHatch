
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
        validate: Number.isInteger
    },

    quantity: {
        type: Number,
        required: true,
        min: 1,
        validate: Number.isInteger
    },

    subtotal: {
        type: Number,
        required: true,
        min: 0,
        validate: Number.isInteger
    }

}, {
    _id: false
});

// =============================================
// ESQUEMA PRINCIPAL DE PEDIDOS
// =============================================

const orderSchema = new mongoose.Schema({

    customer: {
        type: customerSchema,
        required: true
    },

    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: items => items.length > 0,
            message: "El pedido debe contener al menos un producto."
        }
    },

    total: {
        type: Number,
        required: true,
        min: 0,
        validate: Number.isInteger
    },

    status: {
        type: String,
        enum: ["pending", "delivered"],
        default: "pending"
    }

}, {
    timestamps: true,
    collection: "orders"
});

// =============================================
// EXPORTAR MODELO
// =============================================

module.exports = mongoose.model("Order", orderSchema);
