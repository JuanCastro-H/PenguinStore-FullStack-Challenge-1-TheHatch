// --- Importar Express Y Su Herramienta Router Para Manejar Rutas ---
const express = require("express");
const router = express.Router();


// --- Obtener Funciones Logica Del Controller

const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");


// --- Importar Middlewares De Seguridad ---

const { authenticateToken } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/role.middleware");
const { verifyCsrfToken } = require("../middleware/csrf.middleware");



// ===== RUTAS =====


// ---------------------------------------------
// CONSULTAR CATEGORIAS (PUBLICO)
// ---------------------------------------------

// --- Obtener Lista De Categorias ---
router.get("/", getCategories);

// --- Obtener Categoria Por Su ID  ---
router.get("/:id", getCategoryById);


// ---------------------------------------------
// ADMINISTRAR CATEGORIAS (SOLO ADMIN)
// ---------------------------------------------

// --- Crear Una Categoria ---
router.post(
    "/",
    authenticateToken(),
    authorizeRoles("admin"),
    verifyCsrfToken,
    createCategory
);

// --- Actualizar Una Categoria Por ID ---
router.put(
    "/:id",
    authenticateToken(),
    authorizeRoles("admin"),
    verifyCsrfToken,
    updateCategory
);


// --- Eliminar Una Categoria Por ID ---
router.delete(
    "/:id",
    authenticateToken(),
    authorizeRoles("admin"),
    verifyCsrfToken,
    deleteCategory
);


// --- Exportar Rutas ---
module.exports = router;
