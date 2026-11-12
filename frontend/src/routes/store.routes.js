
const express = require("express");

const router = express.Router();

// =============================================
// CONTROLADORES
// =============================================

const {
    showStore,
    showCheckout,
    submitOrder,
    showOrderConfirmation
} = require("../controllers/store.controller");

// =============================================
// MIDDLEWARES
// =============================================

const {
    provideCsrfToken,
    verifyCsrfToken
} = require("../middleware/csrf.middleware");

// =============================================
// CATÁLOGO
// =============================================

router.get("/", showStore);

// =============================================
// CHECKOUT
// =============================================

router.get(
    "/checkout",
    provideCsrfToken,
    showCheckout
);

// =============================================
// CREAR PEDIDO
// =============================================

router.post(
    "/orders",
    verifyCsrfToken,
    submitOrder
);

// =============================================
// CONFIRMACIÓN
// =============================================

router.get(
    "/orders/:orderId/confirmation",
    showOrderConfirmation
);

// =============================================
// EXPORTAR RUTAS
// =============================================

module.exports = router;
