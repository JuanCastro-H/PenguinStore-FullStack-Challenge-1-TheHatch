// --- Importar Express ---
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();


// =============================================
// CONFIGURACIÓN DE VISTAS
// =============================================

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));



// =============================================
// CONFIGURACIÓN DE SEGURIDAD
// =============================================


// --- Helmet ---

app.use(helmet());

// --- CORS ---

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));


// =============================================
// MIDDLEWARES GLOBALES
// =============================================


// --- Interpretar JSON ---

app.use(express.json());


// --- Interpretar Datos De Formularios ---

app.use(express.urlencoded({
    extended: true
}));


// --- Procesar Cookies ---

app.use(cookieParser());



// =============================================
// ARCHIVOS ESTÁTICOS
// =============================================

app.use(express.static(path.join(__dirname, "public")));



// =============================================
// RUTAS DE LA APLICACIÓN
// =============================================


// --- Health Check ---

app.get("/health", (req, res) => {
    res.status(200).json({
        message: "Penguin Store API funcionando correctamente"
    });
});

// --- Vista De Prueba ---

app.get("/test-view", (req, res) => {
    res.render("test");
});

// --- Autenticación ---

app.use("/auth", require("./routes/auth.routes"));


// --- Tienda Pública ---

app.use("/store", require("./routes/store.routes"));


// --- Categorías ---

app.use("/categories", require("./routes/categoryRoutes"));


// --- Productos ---

app.use("/products", require("./routes/productRoutes"));


// --- Panel Administrativo ---

app.use("/admin", require("./routes/adminView.routes"));



// =============================================
// RUTA NO ENCONTRADA
// =============================================

app.use((req, res) => {

    res.status(404).json({
        message: "Route not found"
    });

});



// =============================================
// MANEJO GLOBAL DE ERRORES
// =============================================

app.use((error, req, res, next) => {

    console.error(error);

    res.status(500).json({
        message: "Internal server error"
    });

});


// --- Exportar Modulo ---
module.exports = app;