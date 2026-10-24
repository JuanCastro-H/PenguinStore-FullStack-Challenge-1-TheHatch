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


// ===== RUTAS =====

// --- Obtener Lista De Productos 
router.get("/", getProducts);
// --- Obtener Producto Por Su ID
router.get("/:id", getProductById);
// --- Crear Nuevo Producto
router.post("/", createProduct);
// --- Actualizar Producto Por Su ID
router.put("/:id", updateProduct);
// --- Eliminar Producto Por Su ID
router.delete("/:id", deleteProduct);


// --- Exportar Rutas ---
module.exports = router;
