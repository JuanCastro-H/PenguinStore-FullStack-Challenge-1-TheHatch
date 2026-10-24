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


// ===== RUTAS =====

// --- Obtener Lista De Categorias
router.get("/", getCategories);
// --- Obtener Categoria Por Su ID  
router.get("/:id", getCategoryById);
// --- Crear Una Categoria ---
router.post("/", createCategory);
// --- Actualizar Una Categoria Por ID 
router.put("/:id", updateCategory);
// --- Eliminar Una Categoria Por ID
router.delete("/:id", deleteCategory);


// --- Exportar Rutas ---
module.exports = router;
