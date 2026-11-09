// --- Importar Express ---
const express = require("express");
const path = require("path");

const app = express();


// =============================================
// CONFIGURACIÓN DE VISTAS
// =============================================

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));


// =============================================
// ARCHIVOS ESTÁTICOS
// =============================================

const publicPath = path.join(__dirname, "public");

app.use(express.static(publicPath));


// =============================================
// MIDDLEWARES GLOBALES
// =============================================

app.use(express.urlencoded({
    extended: true
}));



// --- Vista De Prueba ---

app.get("/test-view", (req, res) => {
    res.render("test");
});

// =============================================
// RUTA PARA COMPROBAR EL SERVIDOR
// =============================================

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "Okey",
        service: "store"
    });
});


// --- Exportar Modulo ---
module.exports = app;