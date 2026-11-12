// --- Importar Mongoose ---
const mongoose = require("mongoose");


// =============================================
// ESQUEMA DE ACCESO AL INVENTARIO
// =============================================

const inventoryProductSchema = new mongoose.Schema({


    // --- INFORMACIÓN NECESARIA PARA LOS PEDIDOS ---

    name: {
        type: String
    },

    price: {
        type: Number
    },


    // --- CONTROL DE EXISTENCIAS ---


    stock: {
        type: Number
    },

    isActive: {
        type: Boolean
    }

}, {
    collection: "products",
    versionKey: false
});

// =============================================
// MODELO DE ACCESO AL INVENTARIO
// =============================================

const InventoryProduct = mongoose.model(
    "InventoryProduct",
    inventoryProductSchema
);

// =============================================
// EXPORTAR MODELO
// =============================================

module.exports = InventoryProduct;
