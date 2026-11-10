// --- Importar Modelos ---

const Category = require("../models/Category");
const Product = require("../models/Product");
const Order = require("../models/Order");
const mongoose = require("mongoose");

const { loginUser, logoutUser } = require("../services/auth.service");
const { generateCsrfToken } = require("../services/csrf.service");

// ---------------------------------------------
// CONVERTIR IMÁGENES EN ARRAY
// ---------------------------------------------

const imagesToArray = (images) => {
    if (!images) return [];

    return Array.isArray(images)
        ? images
        : images.split("\n").map(image => image.trim()).filter(Boolean);
};

// ====================================
// CONTROLADOR DE ACCIONES 
// ====================================

// ------------------------------------
// MOSTRAR LOGIN 
// ------------------------------------
const showLogin = (req, res) => {

    // --- Generar Token CSRF ---

    const csrfToken = generateCsrfToken();
    

    // --- Configurar Cookie CSRF ---
    
    res.cookie("csrfToken", csrfToken, {

        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60 * 1000

    });

    // --- Mensajes De Errores ---
    const errors = {

        csrf: "La sesión del formulario expiró. Intenta nuevamente.",
    credentials: "Correo o contraseña incorrectos.",
    unauthorized: "No tienes permisos para acceder al panel."

    };

    // --- Renderizar Plantilla De Login ---
    
    res.render("auth/login", {
        title: "Iniciar Sesión | Penguin Store",
        csrfToken,
        error: errors[req.query.error] || null
    });
    
};



// ------------------------------------
// MOSTRAR DASHBOARD
// ------------------------------------
const showDashboard = async (req, res, next) => {

    try {

        // --- Contar La Cantidad De Productos Y Categorias ---
        const [products, categories] = await Promise.all([
            Product.countDocuments(),
            Category.countDocuments()
        ]);


        // --- Renderizar La Pagina Del Panel Adm ---
        res.render("admin/dashboard", {

            title: "Dashboard | Penguin Store",
            user: req.user,
            csrfToken: req.cookies.csrfToken,
            products,
            categories

        });
        
    } catch (error) {

        next(error);
    }


};



// -----------------------------------------
// INICIAR SESSION AL PANEL ADMINISTRATIVO
// -----------------------------------------

const login = async (req, res, next) => {

    try {

        // --- Obtener Email Y Contraseña ---
        const { email, password } = req.body;

        
        // ---- Intentar Iniciar Sesión ---
        const result = await loginUser({
            email,
            password,
            ipAddress: req.ip
        });


        // --- Comprobar Rol De Administrador ---
        if (result.user.role !== "admin") {

            // --- Revocar La Session Creada ---
            await logoutUser(result.sessionId);

            return res.redirect(303, "/admin/login?error=unauthorized");
        }

        // --- Configurar Cookie De Autenticación ---

        res.cookie("accessToken", result.token, {

            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 15 * 60 * 1000

        });


        // --- Configurar Cookie CSRF De La Sesión ---

        res.cookie("csrfToken", result.csrfToken, {

            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 15 * 60 * 1000

        });


        // --- Redirigir Al Dashboard ---

        res.redirect(303, "/admin/dashboard");


    } catch (error) {

        return next(error);
    
    }
};



// =============================================
// CERRAR SESIÓN DESDE EL PANEL ADMINISTRATIVO
// =============================================

const logout = async (req, res, next) => {

    try {
        
        // --- Obtener ID De La Sesión ---

        const sessionId = req.user.sessionId;


        // --- Revocar Sesión ---

        await logoutUser(sessionId);


        // --- Eliminar Cookies ---

        res.clearCookie("accessToken", {

            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"

        });


        res.clearCookie("csrfToken", {

            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        
        });


        // --- Redirigir Al Login ---

        return res.redirect(303, "/admin/login");

    } catch (error) {

        return next(error);
    
    }
}



// =============================================
// ADMINISTRACIÓN DE CATEGORIAS
// =============================================


// ---------------------------------------------
// LISTAR CATEGORÍAS
// ---------------------------------------------

const showCategories = async (req, res, next) => {

    try {

        const categories = await Category.find()
            .sort({ name: 1 })
            .lean();

        // --- Mensajes De Eliminación De Categoria ---
        const messages = {
            deleted: "La categoría fue eliminada correctamente.",
            "has-products": "No puedes eliminar una categoría que tiene productos asociados.",
            "not-found": "La categoría solicitada no existe."
        };


        res.render("admin/categories/list", {

            title: "Administrar Categorías | Penguin Store",
            user: req.user,
            csrfToken: req.cookies.csrfToken,
            categories,
            message: messages[req.query.message] || null

        });
    
    } catch (error) {

        next(error);
    
    }
    
};



// ---------------------------------------------
// MOSTRAR FORMULARIO DE CREACIÓN DE CATEGORIAS
// ---------------------------------------------

const showCreateCategory = (req, res) => {

    res.render("admin/categories/form", {

        title: "Crear Categoría | Penguin Store",
        user: req.user,
        csrfToken: req.cookies.csrfToken,
        category: null,
        error: null
    
    });
};



// ---------------------------------------------
// CREAR CATEGORÍA
// ---------------------------------------------

const createCategoryView = async (req, res, next) => {

    try {

        const { name, description } = req.body;

        const category = await Category.create({

            name,
            description

        });

        return res.redirect(303, "/admin/categories");
    
    } catch (error) {

        if (error.code === 11000) {

            return res.status(409).render("admin/categories/form", {
    
                title: "Crear Categoría | Penguin Store",
                user: req.user,
                csrfToken: req.cookies.csrfToken,
                category: req.body,
                error: "Ya existe una categoría con ese nombre o slug."
            
            });

        }

        if (error.name ===  "ValidationError") {

            return res.status(400).render("admin/categories/form", {

                title: "Crear Categoría | Penguin Store",
                user: req.user,
                csrfToken: req.cookies.csrfToken,
                category: req.body,
                error: error.message
            
            });
        }

        next(error);
    }
};



// ---------------------------------------------
// ACTUALIZAR CATEGORÍA
// ---------------------------------------------

const updateCategoryView = async (req, res, next) => {

    try {
        const { name, description } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).send("Categoría no encontrada");
        }

        category.name = name;
        category.description = description;

        await category.save()

        return res.redirect(303, "/admin/categories");
    
    } catch (error) {

        if (error.code === 11000) {
            return res.status(409).send( "Ya existe una categoría con ese nombre o slug");
        }

        if (error.name === "ValidationError") {
            return res.status(400).send(error.message);
        }

        next(error);
    }
}



// ---------------------------------------------
// ELIMINAR CATEGORÍA
// ---------------------------------------------

const deleteCategoryView = async (req, res, next) => {

    try {

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.redirect(303, "/admin/categories?message=not-found");
        }

        // Comprobar si existen productos asociados
        const hasProducts = await Product.exists({
            category: category._id
        });

        if (hasProducts) {
            return res.redirect(303, "/admin/categories?message=has-products");
        }

        await Category.findByIdAndDelete(category._id);

        return res.redirect(303, "/admin/categories?message=deleted");

    } catch (error) {

        if (error.name === "CastError") {
            return res.redirect(303, "/admin/categories?message=not-found");
        }

        next(error);

    }

};






// ---------------------------------------------
// MOSTRAR FORMULARIO DE EDICIÓN
// ---------------------------------------------

const showEditCategory =  async (req, res, next) => {

    try {

        const category = await Category.findById(req.params.id).lean();

        if (!category) {
            return res.status(404).send("Categoría no encontrada");
        }
        
        res.render("admin/categories/form", {

            title: "Editar Categoría | Penguin Store",
            user: req.user,
            csrfToken: req.cookies.csrfToken,
            category,
            error: null
        
        });
    
    } catch (error) {

        next(error);
        
    }

};



// ---------------------------------------------
// CAMBIAR ESTADO DE CATEGORÍA
// ---------------------------------------------

const toggleCategoryStatus = async (req, res, next) => {

    try {

        const category = await Category.findById(req.params.id);
        
        if (!category) {
            return res.status(404).send("Cartegoría no encontrada");
        }
        
        category.isActive = !category.isActive;

        await category.save();
        
        return res.redirect(303, "/admin/categories");
        
    } catch (error) {
        
        next(error);
        
    }
};




// =============================================
// ADMINISTRACIÓN DE PRODUCTOS
// =============================================

// ---------------------------------------------
// LISTAR PRODUCTOS
// ---------------------------------------------

const showProducts = async (req, res, next) => {
    try {

        // Obtener todos los productos y sus categorías
        const products = await Product.find()
            .populate("category")
            .sort({ createdAt: -1 })
            .lean();

        
        // --- MENSAJES DE RESPUESTA ---
        const messages = {
            deleted: "El producto fue eliminado correctamente.",
            "status-updated": "El estado del producto fue actualizado.",
            "not-found": "El producto solicitado no existe."
        };


        // Renderizar listado de productos
        return res.status(200).render("admin/products/list", {

            title: "Administración de productos",
            user: req.user,
            csrfToken: req.cookies.csrfToken,
            products,
            message: messages[req.query.message] || null

        });

    } catch (error) {
        next(error);
    }
};



// ---------------------------------------------
// MOSTRAR FORMULARIO DE CREACIÓN
// ---------------------------------------------

const showCreateProduct = async (req, res, next) => {
    try {
        // Obtener únicamente las categorías activas
        const categories = await Category.find({ isActive: true })
            .sort({ name: 1 })
            .lean();

        // --- Obtener token CSRF de la sesión actual ---
        const csrfToken = req.cookies.csrfToken;

        // Renderizar formulario
        return res.status(200).render("admin/products/form", {
            title: "Crear producto",
            user: req.user,
            csrfToken,
            categories,
            product: null,
            error: null
        });

    } catch (error) {
        next(error);
    }
};



// ---------------------------------------------
// CREAR PRODUCTO
// ---------------------------------------------

const createProductView = async (req, res, next) => {

    try {

        // Obtener datos del formulario
        const {
            name,
            description,
            price,
            stock,
            category,
            images
        } = req.body;

        // Convertir las imágenes en un array
        const imageArray = images
            ? images.split("\n")
                .map(image => image.trim())
                .filter(image => image.length > 0)
            : [];

        // Verificar que la categoría exista y esté activa
        const selectedCategory = await Category.findOne({
            _id: category,
            isActive: true
        });

        if (!selectedCategory) {
            const categories = await Category.find({ isActive: true })
                .sort({ name: 1 })
                .lean();

            // ---  Obtener token CSRF de la sesión actual ---
            const csrfToken = req.cookies.csrfToken;

            return res.status(400).render("admin/products/form", {
                title: "Crear producto",
                user: req.user,
                csrfToken,
                categories,
                product: req.body,
                error: "La categoría seleccionada no existe o está inactiva."
            });
        }

        // Crear producto
        await Product.create({
            name,
            description,
            price,
            stock,
            category,
            images: imageArray,
            isActive: req.body.isActive === "true"
        });

        // Redirigir al listado
        return res.redirect(303, "/admin/products");

    } catch (error) {
        // Manejar errores de validación
        if (error.name === "ValidationError" || error.name === "CastError") {
            const categories = await Category.find({ isActive: true })
                .sort({ name: 1 })
                .lean();

            // --- Obtener token CSRF de la sesión actual ---
            const csrfToken = req.cookies.csrfToken;

            return res.status(400).render("admin/products/form", {
                title: "Crear producto",
                user: req.user,
                csrfToken,
                categories,
                product: req.body,
                error: "Verifica los datos ingresados. Algunos campos no son válidos."
            });
        }

        next(error);
    }
};




// ---------------------------------------------
// MOSTRAR FORMULARIO DE EDICIÓN
// ---------------------------------------------

const showEditProduct = async (req, res, next) => {
    try {
        // Buscar producto
        const product = await Product.findById(req.params.id).lean();

        if (!product) {
            return res.status(404).send("Producto no encontrado.");
        }

        // Obtener categorías activas y conservar la categoría actual
        const categories = await Category.find({
            $or: [
                { isActive: true },
                { _id: product.category }
            ]
        })
            .sort({ name: 1 })
            .lean();

        // Normalizar referencias para compararlas en Pug
        product.category = product.category.toString();

        // --- Obtener token CSRF de la sesión actual ---
        const csrfToken = req.cookies.csrfToken;

        // Renderizar formulario
        return res.status(200).render("admin/products/form", {
            title: "Editar producto",
            user: req.user,
            csrfToken,
            categories,
            product,
            error: null
        });

    } catch (error) {
        if (error.name === "CastError") {
            return res.status(404).send("Producto no encontrado.");
        }

        next(error);
    }
};




// ---------------------------------------------
// ACTUALIZAR PRODUCTO
// ---------------------------------------------

const updateProductView = async (req, res, next) => {
    try {
        // Buscar producto
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).send("Producto no encontrado.");
        }

        // Obtener datos del formulario
        const {
            name,
            description,
            price,
            stock,
            category,
            images,
            isActive
        } = req.body;

        // Verificar que la categoría exista
        const selectedCategory = await Category.findById(category);

        if (!selectedCategory) {
            return res.status(400).send("La categoría seleccionada no existe.");
        }

        // No permitir asignar una categoría inactiva diferente
        const isCurrentCategory = selectedCategory._id.equals(product.category);

        if (!selectedCategory.isActive && !isCurrentCategory) {
            return res.status(400).send("No puedes asignar una categoría inactiva.");
        }

        // Convertir imágenes en un array
        const imageArray = images
            ? images.split("\n")
                .map(image => image.trim())
                .filter(image => image.length > 0)
            : [];

        // Actualizar información del producto
        product.name = name;
        product.description = description;
        product.price = price;
        product.stock = stock;
        product.category = category;
        product.images = imageArray;
        product.isActive = isActive === "true";

        // Guardar cambios
        await product.save();

        // Redirigir al listado
        return res.redirect(303, "/admin/products");

    } catch (error) {
        // Manejar identificadores inválidos
        if (error.name === "CastError") {
            return res.status(404).send("Producto no encontrado o categoría inválida.");
        }

        // Manejar errores de validación
        if (error.name === "ValidationError") {
            const product = await Product.findById(req.params.id).lean();

            if (!product) {
                return res.status(404).send("Producto no encontrado.");
            }

            const categories = await Category.find({
                $or: [
                    { isActive: true },
                    { _id: product.category }
                ]
            })
                .sort({ name: 1 })
                .lean();

            // Conservar los datos enviados para corregir el formulario
            const formProduct = {

                ...req.body,
                _id: req.params.id,
                category: req.body.category,
                images: imagesToArray(req.body.images)
            
            };

            // --- Obtener token CSRF de la sesión actual ---
            const csrfToken = req.cookies.csrfToken;

            return res.status(400).render("admin/products/form", {
                title: "Editar producto",
                user: req.user,
                csrfToken,
                categories,
                product: formProduct,
                error: "Verifica los datos ingresados. Algunos campos no son válidos."
            });
        }

        next(error);
    }
};



// ---------------------------------------------
// CAMBIAR ESTADO DEL PRODUCTO
// ---------------------------------------------

const toggleProductStatus = async (req, res, next) => {
    try {
        // Buscar producto
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.redirect(303, "/admin/products?message=not-found");
        }

        // Invertir estado
        product.isActive = !product.isActive;

        // Guardar cambios
        await product.save();

        return res.redirect(303, "/admin/products?message=status-updated");

    } catch (error) {
        if (error.name === "CastError") {
            return res.redirect(303, "/admin/products?message=not-found");
        }

        next(error);
    }
};



// ---------------------------------------------
// ELIMINAR PRODUCTO
// ---------------------------------------------

const deleteProductView = async (req, res, next) => {
    try {
        // Buscar y eliminar producto
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.redirect(303, "/admin/products?message=not-found");
        }

        return res.redirect(303, "/admin/products?message=deleted");

    } catch (error) {
        if (error.name === "CastError") {
            return res.redirect(303, "/admin/products?message=not-found");
        }

        next(error);
    }
};




// =============================================
// ADMINISTRACIÓN DE PEDIDOS
// =============================================

// ---------------------------------------------
// MOSTRAR LISTA DE PEDIDOS
// ---------------------------------------------

const showOrders = async (req, res, next) => {

    try {

        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .lean();

        return res.render("admin/orders/list", {
            title: "Administrar pedidos",
            orders,
            csrfToken: req.cookies.csrfToken,
            message: req.query.message
        });

    } catch (error) {
        next(error);
    }

};


// ---------------------------------------------
// MARCAR PEDIDO COMO ENTREGADO
// ---------------------------------------------

const markOrderDelivered = async (req, res, next) => {

    try {

        const { orderId } = req.params;

        // --- Validar ID ---

        if (!mongoose.isValidObjectId(orderId)) {
            return res.redirect(
                303,
                "/admin/orders?message=not-found"
            );
        }

        // --- Actualizar Estado ---

        const order = await Order.findByIdAndUpdate(
            orderId,
            {
                status: "delivered"
            },
            {
                returnDocument: "after"
            }
        );

        if (!order) {
            return res.redirect(
                303,
                "/admin/orders?message=not-found"
            );
        }

        return res.redirect(
            303,
            "/admin/orders?message=delivered"
        );

    } catch (error) {
        next(error);
    }

};


// --- Exportar Logica De Los Controlladores ---
module.exports = {
    showLogin,
    showDashboard,
    login,
    logout,
    showCategories,
    showCreateCategory,
    createCategoryView,
    showEditCategory,
    updateCategoryView,
    toggleCategoryStatus,
    deleteCategoryView,
    showProducts,
    showCreateProduct,
    createProductView,
    showEditProduct,
    updateProductView,
    toggleProductStatus,
    deleteProductView,
    showOrders,
    markOrderDelivered
};