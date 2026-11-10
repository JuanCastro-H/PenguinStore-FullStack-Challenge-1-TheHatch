const Product = require("../models/Product");

const mongoose = require("mongoose");
const Order = require("../models/Order");


// =============================================
// CONTROLADOR DE VISTAS DE LA TIENDA
// =============================================

// ---------------------------------------------
// MOSTRAR FORMULARIO DE CHECKOUT
// ---------------------------------------------

const showCheckout = async (req, res, next) => {

    try {

        // --- Obtener Productos Activos ---

        const products = await Product.find({
            isActive: true
        })
        .populate("category", "name")
        .sort({ name: 1 })
        .lean();


        // --- Renderizar Checkout ---

        return res.render("store/checkout", {
            title: "Finalizar compra",
            products
        });

    } catch (error) {
        next(error);
    }

};



// ---------------------------------------------
// MOSTRAR CONFIRMACIÓN DEL PEDIDO
// ---------------------------------------------

const showOrderConfirmation = async (req, res, next) => {

    try {

        const { orderId } = req.params;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(404).send("Pedido no encontrado.");
        }

        const order = await Order.findById(orderId)
            .select("items total status createdAt")
            .lean();

        if (!order) {
            return res.status(404).send("Pedido no encontrado.");
        }

        return res.render("store/confirmation", {
            title: "Pedido confirmado",
            order
        });

    } catch (error) {
        next(error);
    }

};


// =============================================
// EXPORTAR CONTROLADORES
// =============================================

module.exports = {
    showCheckout,
    showOrderConfirmation
};
