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



    // --- Renderizar Plantilla De Login ---

    res.render("auth/login", {
        title: "Iniciar Sesión | Penguin Store",
        csrfToken,
        error: req.query.error === "csrf"
            ? "La sesión del formulario expiró. Intenta nuevamente"
            : null
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
            products,
            categories

        });
    
    } catch (error) {

        next(error);
    }


};



// ------------------------------------
// PROCESAR LOGIN DE ADMINISTRADOR
// ------------------------------------

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
            await logoutUser(result.sessionID);

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

        return res.redirect(303, "/admin/login?error=credentials");

    }


}


// --- Exportar Logica De Los Controlladores ---
module.exports = {
    showLogin,
    showDashboard,
    login
};