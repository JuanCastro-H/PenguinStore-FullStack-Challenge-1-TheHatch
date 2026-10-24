// --- Importar Schema De Producto ---
const Product = require("../models/Product");


// ====================================
// CONTROLADOR DE ACCIONES 
// ====================================


// GET /products — Listar productos
const getProducts = async (req, res) => {
    try { // Cambiar ID De Categoria Por Nombre De Categoria
        const products = await Product.find().populate("category");
        res.status(200).json(products);
    } catch (error) { // Manejo De Errores
        res.status(500).json({ error: "Error al obtener productos" });
    }
};


// GET /products/:id — Obtener un producto por ID
const getProductById = async (req, res) => {
    try { //  Obtener Producto Por ID Y Info De Su Categoria 
        const product = await Product.findById(req.params.id)
            .populate("category");

        if (!product) { // No Existe 
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.status(200).json(product);
    } catch (error) { // ID Tiene Formato Incombatible
        res.status(400).json({ error: "ID de producto inválido" });
    }
};


// POST /products — Crear producto
const createProduct = async (req, res) => {
    try { // Obtener Datos Del Producto Y Crearlo
        const product = await Product.create(req.body);
          // Agregarle Su Categoria
        const populatedProduct = await product.populate("category");

        res.status(201).json(populatedProduct);
    } catch (error) { // Datos O Formato De ID Invalidos
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({ error: "Error al crear producto" });
    }
};


// PUT /products/:id — Actualizar producto
const updateProduct = async (req, res) => {
    try { // Busca El Producto Por Su ID Y Actualiza Sus Campos
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate("category");

        if (!product) { // No Existe
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.status(200).json(product);
    } catch (error) { // Datos O Formato De ID Invalidos
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ error: error.message });
        }

        // Manejar Error Desconocido
        res.status(500).json({ error: "Error al actualizar producto" });
    }
};


// DELETE /products/:id — Eliminar producto
const deleteProduct = async (req, res) => {
    try { // Eliminar Producto Por Su ID
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) { // No Existe
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        res.status(200).json({
            message: "Producto eliminado correctamente"
        });
    } catch (error) { // Formato De ID Invalido
        res.status(400).json({ error: "ID de producto inválido" });
    }
};


// --- Exportar Logica De Los Controlladores ---
module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
