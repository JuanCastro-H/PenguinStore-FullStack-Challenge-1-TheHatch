// --- Importar Modelos ---

const Category = require("../models/Category");
const Product = require("../models/Product");

const { generateCsrfToken } = require("../services/csrf.service");
const { loginUser, logoutUser } = require("../services/auth.service");


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



// ---------------------------------------------
// LISTAR CATEGORÍAS
// ---------------------------------------------

const showCategories = async (req, res, next) => {

    try {

        const categories = await Category.find()
            .sort({ name: 1 })
            .lean();


        res.render("admin/categories/list", {

            title: "Administrar Categorías | Penguin Store",
            user: req.user,
            csrfToken: req.cookies.csrfToken,
            categories

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
    updateCategoryView
};