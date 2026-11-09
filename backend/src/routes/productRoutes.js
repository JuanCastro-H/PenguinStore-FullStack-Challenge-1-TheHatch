// --- Importar Express Y Su Herramienta Router Para Manejar Rutas ---
const express = require("express");
const router = express.Router();


// --- Obtener Funciones Logica Del Controller
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");


// --- Importar Middlewares De Seguridad ---

const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRoles }    = require("../middleware/role.middleware");
const { verifyCsrfToken }   = require("../middleware/csrf.middleware");


// ===== RUTAS =====

// ---------------------------------------------
// CONSULTAR PRODUCTOS (PUBLICO)
// ---------------------------------------------

// --- Obtener Lista De Productos ---
router.get("/", getProducts);
// --- Obtener Producto Por Su ID ---
router.get("/:id", getProductById);


// ---------------------------------------------
// ADMINISTRAR PRODUCTOS (SOLO ADMIN)
// ---------------------------------------------


// --- Crear Nuevo Producto ---
router.post(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    verifyCsrfToken,
    createProduct
);


// --- Actualizar Producto Por Su ID ---
router.put(
    "/:id",
    authenticateToken,
    authorizeRoles("admin"),
    verifyCsrfToken,
    updateProduct
);


// --- Eliminar Producto Por Su ID ---
router.delete(
    "/:id",
    authenticateToken,
    authorizeRoles("admin"),
    verifyCsrfToken,
    deleteProduct
);


// --- Exportar Rutas ---
module.exports = router;
