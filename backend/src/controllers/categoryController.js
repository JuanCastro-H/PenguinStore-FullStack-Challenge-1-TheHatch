// --- Importar Mongoose ---
const Category = require("../models/Category");

// ====================================
// CONTROLADOR DE ACCIONES 
// ====================================


// GET /categories — Obtener Lista con todas las categorías
const getCategories = async (req, res) => {

    try { // Consultar y Guadar Todas Las Categorias
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) { // Manejo De Error
        res.status(500).json({ error: "Error al obtener categorías" });
    }

};


// GET /categories/:id — Obtener una categoría por su ID
const getCategoryById = async (req, res) => {

    try { // Obtener Id y Buscar La Categoria Expesifica
        const category = await Category.findById(req.params.id);

        if (!category) { // No Se Encuentra 
            return res.status(404).json({ error: "Categoría no encontrada" });
        }

        res.status(200).json(category); 
    } catch (error) { // ID Invalido
        res.status(400).json({ error: "ID de categoría inválido" });
    }
};


// POST /categories — Crear una nueva categoría 
const createCategory = async (req, res) => {

    try { // Obtener Datos Y Crear Categoria Nueva
        const category = await Category.create(req.body);
        res.status(201).json(category);
    } catch (error) { // Ya existe
        if (error.code === 11000) {
            return res.status(409).json({ error: "La categoría ya existe" });
        }

        // Datos Invalidos
        if (error.name === "ValidationError") { 
            return res.status(400).json({ error: error.message });
        }

        // Manejar Errores extras
        res.status(500).json({ error: "Error al crear categoría" });
    }
};


// PUT /categories/:id — Actualizar una categoría por su ID
const updateCategory = async (req, res) => {
    try {  // Buscar Categoria Por ID Y Actualizar Campos 
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) { // ID Incorrecto
            return res.status(404).json({ error: "Categoría no encontrada" });
        }

        res.status(200).json(category);
    } catch (error) { // Datos Invalidos
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        
        // Capturar Errores de ID o formato
        res.status(400).json({ error: "No se pudo actualizar la categoría" });
    }
};


// DELETE /categories/:id — Eliminar una categoría por su ID
const deleteCategory = async (req, res) => {
    try { // Busca La categoria en la BD Por Su ID Y La Elmina
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) { // ID no existe
            return res.status(404).json({ error: "Categoría no encontrada" });
        }

        res.status(200).json({ message: "Categoría eliminada correctamente" });
    } catch (error) { // Formato De ID No Procesable
        res.status(400).json({ error: "ID de categoría inválido" });
    }
};


// --- Importar Logica De Las Categorias ---
module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
