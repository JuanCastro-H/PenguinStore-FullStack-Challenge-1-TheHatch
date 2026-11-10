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
    logout
};