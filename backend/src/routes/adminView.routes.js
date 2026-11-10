const express = require("express");

const router = express.Router();

// --- Importar Controladores ---

const adminViewController = require("../controllers/adminView.controller");


// --- Importar Middlewares ---

const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { verifyLoginCsrfToken, verifyCsrfToken } = require("../middleware/csrf.middleware");


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


// --------------------------------------------
// INICIAR SESSION
// --------------------------------------------
router.post(
    "/login",
    verifyLoginCsrfToken,
    adminViewController.login
);


// --------------------------------------------
// DASHBOARD / PANEL
// ---------------------------------------------

router.get(
    "/dashboard",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    adminViewController.showDashboard
);


// ---------------------------------------------
// ADMINISTRACIÓN DE CATEGORÍAS
// ---------------------------------------------

router.get(
    "/categories",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    adminViewController.showCategories
);

router.get(
    "/categories/new",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    adminViewController.showCreateCategory
);

router.post(
    "/categories",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    verifyCsrfToken,
    adminViewController.createCategoryView
);

// Mostrar formulario de edición
router.get(
    "/categories/:id/edit",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    adminViewController.showEditCategory
);

// Guardar cambios
router.post(
    "/categories/:id/edit",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    verifyCsrfToken,
    adminViewController.updateCategoryView
);

router.post(
    "/categories/:id/toggle-status",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    verifyCsrfToken,
    adminViewController.toggleCategoryStatus
);


// --- Eliminar Categoria ---
router.post(
    "/categories/:id/delete",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    verifyCsrfToken,
    adminViewController.deleteCategoryView
);



// ---------------------------------------------
// ADMINISTRACIÓN DE PRODUCTOS
// ---------------------------------------------


// --- LISTAR PRODUCTOS ---
router.get(
    "/products",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    adminViewController.showProducts
);

// --- Mostrar Formulario Para Crear Nuevo Producto ---
router.get(
    "/products/new",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    adminViewController.showCreateProduct
);

// --- Crear Nuevo Producto ---
router.post(
    "/products",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    verifyCsrfToken,
    adminViewController.createProductView
);


// --- Cerrar Sesión ---
router.post(
    "/logout",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    verifyCsrfToken,
    adminViewController.logout
);

// --- Mostrar Formulario De Edición ---
router.get(
    "/products/:id/edit",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    adminViewController.showEditProduct
);

// --- Actualizar Un Producto ---
router.post(
    "/products/:id/edit",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    verifyCsrfToken,
    adminViewController.updateProductView
);

// --- Cambiar Estado De Un Producto ---
router.post(
    "/products/:id/toggle-status",
    authenticateToken({ redirect: true }),
    authorizeRoles("admin"),
    verifyCsrfToken,
    adminViewController.toggleProductStatus
);


// --- EXPORTAR ROUTERS ---
module.exports = router;