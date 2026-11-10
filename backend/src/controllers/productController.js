// --- Importar Schema De Producto ---
const Product = require("../models/Product");

// --- Importar Schema De Categoria ---
const Category = require("../models/Category");



// ====================================
// NORMALIZAR DATOS DEL FORMULARIO
// ====================================

// --- Convertir Estado A Booleano ---

const parseBoolean = (value) => {

    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;

    throw new Error("El estado del producto no es válido");

};


// --- Normalizar URLs De Imágenes ---

const normalizeImages = (images) => {

    if (images === undefined) return undefined;

    const imageArray = Array.isArray(images) ? images : [images];

    return imageArray
        .map(image => image.trim())
        .filter(image => image.length > 0);

};



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
        // - Operacion realizada Con exito -
        res.status(200).json(product);

    } catch (error) { // ID Tiene Formato Incombatible

        if (error.name === "CastError"){
            return res.status(400).json({
                error: "ID de producto inválido"
            });
        }
        
        res.status(500).json({ error: "Error interno del servidor" });
    }
};


// POST /products — Crear producto
const createProduct = async (req, res) => {

    console.log("1. CREATE PRODUCT: petición recibida");

    try {
        
        // --- Obtener Datos Del Producto ---

        const { 
            name,
            description, 
            price, 
            stock, 
            category, 
            isActive
        } = req.body
    

        // --- Verificar Que Existe La Categoria ---

        const existingCategory = await Category.findById(category);

        console.log("2. CREATE PRODUCT: categoría consultada");
    
        if (!existingCategory) {
            return res.status(400).json({
                error: "La categoría indicada no existe"
            });
        }


        // --- Normalizar Datos ---

        const images = normalizeImages(req.body.images);


        // - Campos Del Producto Permitidos -
        const productData = {

            name,
            description,
            price,
            stock,
            category: existingCategory._id
        
        };


        // --- Agregar Imagenes ---
        if (images !== undefined) {
            productData.images = images;
        }

        // --- Agregar Actividad Del Producto ---
        if (isActive !== undefined) {
            productData.isActive = parseBoolean(isActive);
        }

        console.log("3. CREATE PRODUCT: intentando guardar");
    
        // - Crear Producto Y Agregarle su categoria -
        const product = await Product.create(productData);

        console.log("4. CREATE PRODUCT: producto guardado");

        const populatedProduct = await product.populate("category");

        console.log("5. CREATE PRODUCT: categoría poblada");

    
        // - Todo Salio Bien Producto Creado -
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

    try { 

        console.log("1. UPDATE PRODUCT: petición recibida");
        console.log("ID:", req.params.id);
        console.log("BODY:", req.body);

        // - Verificar Si Existe El Producto -
        const existingProduct = await Product.findById(req.params.id);

        console.log("2. UPDATE PRODUCT: producto encontrado");

    
        if (!existingProduct) {
            return res.status(404).json({
                error: "Producto no encontrado"
            });
        }


        // --- Obtener Campos Permitidos ---
        const { 
            name, 
            description, 
            price, 
            stock, 
            category,
            isActive 
        } = req.body;
    

        const productData = {};

    
        // --- Agregar Campos Presentes En La Petición ---
        
        if (name !== undefined) productData.name = name;
        if (description !== undefined) productData.description = description;
        if (price !== undefined) productData.price = price;
        if (stock !== undefined) productData.stock = stock;

    
        // --- Verificar SI Se Proporciona Una Categoria ---
        if (category !== undefined ) {

            // - Obtener Categoria -
            const existingCategory = await Category.findById(category);
        
        
            // - Verificar Que Existe -
            if (!existingCategory) {
                return res.status(400).json({
                    error: "La categoría indicada no existe"
                });
            }
        
            // - Agregar El ID De Categoria A Los Datos -
            productData.category = existingCategory._id;
        
        }


       // --- Actualizar Imágenes ---
        if (req.body.images !== undefined) {
            productData.images = normalizeImages(req.body.images);
        }


        // --- Actualizar Estado ---
        if (isActive !== undefined) {
            productData.isActive = parseBoolean(isActive);
        }

        console.log("3. UPDATE PRODUCT: datos preparados", productData);
    
        // --- Evitar Actualizaciones Vacías ---
        if (Object.keys(productData).length === 0) {

            return res.status(400).json({
                error: "Debes proporcionar al menos un campo para actualizar"
            });
        
        }

        console.log("4. UPDATE PRODUCT: intentando guardar");

        // --- Aplicar Y Guardar Cambios ---

        Object.assign(existingProduct, productData);
        const updatedProduct = await existingProduct.save();

        console.log("5. UPDATE PRODUCT: producto guardado");
        await updatedProduct.populate("category");

    
        // - Actualización Completada -
        res.status(200).json(updatedProduct);

    } catch (error) { 

        console.error("ERROR EN UPDATE PRODUCT:", error);

        // - Datos O Formato De ID Invalidos -
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ error: error.message });
        }

        // - Manejar Error Desconocido -
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

        if (error.name === "CastError"){
            return res.status(400).json({
                error: "ID de producto inválido"
            });
        }
        
        res.status(500).json({ error: "Error interno del servidor" });

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