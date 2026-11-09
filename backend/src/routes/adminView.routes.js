const express = require("express");

const router = express.Router();

// --- Importar Controladores ---

const adminViewController = require("../controllers/adminViw.controller");


// --- Importar Middlewares ---

const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");



// =============================================
// RUTAS DEL PANEL ADMINISTRATIVO
// =============================================


// ---------------------------------------------
// LOGIN
// ---------------------------------------------

router.get(
    "/login",
    adminViewController.showLogin
);


// ---------------------------------------------
// DASHBOARD
// ---------------------------------------------

router.get(
    "/dashboard",
    authenticateToken,
    authorizeRoles("admin"),
    adminViewController.showDashboard
);



// --- EXPORTAR ROUTERS ---
module.exports = router;