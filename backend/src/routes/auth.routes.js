
const express = require("express");

const router = express.Router();


// --- Importar Controladores ---

const authController = require("../controllers/auth.controller");


// --- Importar Middlewares ---

const { authenticateToken } = require("../middleware/auth.middleware");
const { verifyCsrfToken } = require("../middleware/csrf.middleware");


// =============================================
// RUTAS DE AUTENTICACIÓN
// =============================================


// ---------------------------------------------
// REGISTRAR USUARIO
// ---------------------------------------------

router.post(
    "/register",
    authController.register
);


// ---------------------------------------------
// INICIAR SESIÓN
// ---------------------------------------------

router.post(
    "/login",
    authController.login
);


// ---------------------------------------------
// OBTENER USUARIO AUTENTICADO
// ---------------------------------------------

router.get(
    "/me",
    authenticateToken,
    authController.getCurrentUser
);


// ---------------------------------------------
// CERRAR SESIÓN
// ---------------------------------------------

router.post(
    "/logout",
    authenticateToken,
    verifyCsrfToken,
    authController.logout
);


// =============================================
// EXPORTAR ROUTER
// =============================================

module.exports = router;
