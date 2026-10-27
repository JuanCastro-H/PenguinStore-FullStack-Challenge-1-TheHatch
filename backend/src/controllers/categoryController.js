// --- Importar Schema De Categorias ---
const Category = require("../models/Category");

// --- Importar Schema De Producto ---
const Product = require("../models/Product");


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

    try { // - Obtener Id y Buscar La Categoria Expesifica -
        const category = await Category.findById(req.params.id);

        if (!category) { // No Se Encuentra 
            return res.status(404).json({ error: "Categoría no encontrada" });
        }

        // - Operación completada -
        res.status(200).json(category); 


    } catch (error) { 

        if (error.name === "CastError") {
            return res.status(400).json({
                error: "ID de categoría inválido"
            });
        }

        return res.status(500).json({
            error: "Error al obtener categoría"
        });
    }
};


// POST /categories — Crear una nueva categoría 
const createCategory = async (req, res) => {

    try { 

        // - Obtener Datos Y Guardalos  -
        const { name, description, isActive } = req.body;


        const categoryData = { name };

        if (description !== undefined){
            categoryData.description = description;
        }

        if (isActive !== undefined){
            categoryData.isActive = isActive;
        }

        // Crear Categoria Nueva
        const category = await Category.create(categoryData);
        res.status(201).json(category);


    } catch (error) { 

        // - Ya existe La Categoria
        if (error.code === 11000) {
            return res.status(409).json({ error: "La categoría ya existe" });
        }

        // - Datos Invalidos -
        if (error.name === "ValidationError") { 
            return res.status(400).json({ error: error.message });
        }

        // - Manejar Errores extras -
        res.status(500).json({ error: "Error al crear categoría" });
    }
};


// PUT /categories/:id — Actualizar una categoría por su ID
const updateCategory = async (req, res) => {

    try {  
        
        // - Buscar Categoria Por ID -
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // Verificar Si Existe
        if (!category) { 
            return res.status(404).json({ error: "Categoría no encontrada" });
        }

        // - Obtener Y Guadar Datos -
        const { name, description, isActive } = req.body;

        const allowedFields = {};

        if (description !== undefined){
            categoryData.description = description;
        }

        if (isActive !== undefined){
            categoryData.isActive = isActive;
        }

        if (Object.keys(allowedFields).length === 0){
            return res.status(400).json({
                error: "Debes proporcionar al menos un campo válido para actualizar"
            });
        }

        // - Aplicar Y Guardar Cambios -
        Object.assign(category, allowedFields);
        const updatedCategory = await category.save();

        // - Operación Realizada Con Exito
        res.status(200).json(updatedCategory);


    } catch (error) { 

        // - Ya existe La Categoria
        if (error.code === 11000) {
            return res.status(409).json({
                error: "Ya existe una categoría con esos datos"
            });
        }

        // - Datos Invalidos -
        if (error.name === "ValidationError") {
            return res.status(400).json({ error: error.message });
        }
        
        // - Errores No
        return res.status(500).json({
            error: "Error al actualizar categoría"
        });
    }
};


// DELETE /categories/:id — Eliminar una categoría por su ID
const deleteCategory = async (req, res) => {

    try { 

        // - Verificar Que La Categoria Exista -
        const category = await Category.findById(req.params.id);

        if (!category) { // ID no existe
            return res.status(404).json({ error: "Categoría no encontrada" });
        }
        
        // - Verificar Que No Tenga Productos Asociados -
        const products = await Product.exists({ category: req.params.id });
        
        if (products) {
            return res.status(409).json({
                error: "No se puede eliminar una categoría con productos asociados"
            });
        }
        
        // - Eliminar Categoria Y Retornar Proceso Exitoso -
        await Category.findByIdAndDelete(category.id);
        res.status(200).json({ message: "Categoría eliminada correctamente" });

    } catch (error) { 

        // - Formato De ID No Valido -
        if (error.name === "CastError") {
            return res.status(400).json({
                error: "ID de categoría inválido"
            });
        }

        return res.status(500).json({
            error: "Error al eliminar categoría"
        });
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
