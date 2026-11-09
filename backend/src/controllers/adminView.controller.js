// --- Importar Modelos ---

const Category = require("../models/Category");
const Product = require("../models/Product");


// ====================================
// CONTROLADOR DE ACCIONES 
// ====================================

// ------------------------------------
// MOSTRAR LOGIN 
// ------------------------------------
const showLogin = (req, res) => {

    // --- Renderizar Plantilla De Login ---
    res.render("pages/login", {
        title: "Iniciar Sesión | Penguin Store"
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
        res.render("pages/dashboard", {

            title: "Dashboard | Penguin Store",
            user: req.user,
            products,
            categories

        });
    
    } catch (error) {

        next(error);
    }


};



// --- Exportar Logica De Los Controlladores ---
module.exports = {
    showLogin,
    showDashboard
};