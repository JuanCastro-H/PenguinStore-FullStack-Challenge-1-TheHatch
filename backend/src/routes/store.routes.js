
const express = require("express");

const router = express.Router();

console.log("🐧 Rutas públicas de Penguin Store cargadas");
// =============================================
// CONTROLADORES
// =============================================

const { createOrder } = require("../controllers/orderController");
const { showCheckout, showOrderConfirmation } = require("../controllers/storeView.controller");


// =============================================
// MIDDLEWARES
// =============================================

const { providePublicCsrfToken, verifyPublicCsrfToken } = require("../middleware/csrf.middleware");


// =============================================
// RUTAS PÚBLICAS DE LA TIENDA
// =============================================

// --- Mostrar Checkout ---

router.get(
    "/checkout",
    providePublicCsrfToken,
    showCheckout
);

// --- Crear Pedido ---

router.post(
    "/orders",
    verifyPublicCsrfToken,
    createOrder
);

// --- Confirmación De Pedido ---

router.get(
    "/orders/:orderId/confirmation",
    showOrderConfirmation
);

// =============================================
// EXPORTAR RUTAS
// =============================================

module.exports = router;
