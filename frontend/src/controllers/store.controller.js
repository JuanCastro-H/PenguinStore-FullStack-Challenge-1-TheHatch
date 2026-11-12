
const mongoose = require("mongoose");

const Order = require("../models/Order");

const { getProducts } = require("../services/catalog.service");
const { createOrder } = require("../services/order.service");

// =============================================
// MOSTRAR CATÁLOGO
// =============================================

const showStore = async (req, res, next) => {

    try {

        const products = await getProducts();

        return res.render("store/index", {
            title: "Penguin Store",
            products,
            error: null
        });

    } catch (error) {
        next(error);
    }
};

// =============================================
// MOSTRAR CHECKOUT
// =============================================

const showCheckout = async (req, res, next) => {

    try {

        const products = await getProducts();

        return res.render("store/checkout", {
            title: "Finalizar compra",
            products,
            csrfToken: res.locals.csrfToken
        });

    } catch (error) {
        next(error);
    }
};

// =============================================
// PROCESAR PEDIDO
// =============================================

const submitOrder = async (req, res, next) => {

    try {

        const { customer, items } = req.body;

        // --- Ejecutar lógica de negocio ---

        const order = await createOrder(customer, items);

        // --- Redirigir a confirmación ---

        return res.redirect(
            303,
            `/store/orders/${order._id}/confirmation`
        );

    } catch (error) {

        // --- Responder errores controlados ---

        if (error.statusCode) {
            return res.status(error.statusCode).send(error.message);
        }

        next(error);
    }
};

// =============================================
// MOSTRAR CONFIRMACIÓN
// =============================================

const showOrderConfirmation = async (req, res, next) => {

    try {

        const { orderId } = req.params;

        // --- Validar identificador ---

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(404).send("Pedido no encontrado.");
        }

        // --- Buscar pedido en MongoDB ---

        const order = await Order.findById(orderId).lean();

        if (!order) {
            return res.status(404).send("Pedido no encontrado.");
        }

        return res.render("store/confirmation", {
            title: "Pedido confirmado",
            orderId: order._id,
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
    showStore,
    showCheckout,
    submitOrder,
    showOrderConfirmation
};
