
// --- IMPORTACIONES ---
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
// MIDDLEWARES
// =============================================


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// =============================================
// ARCHIVOS ESTÁTICOS
// =============================================

app.use(express.static(path.join(__dirname, "public"), {
    index: false
}));



// =============================================
// RUTAS
// =============================================


// --- RUTAS DE LA TIENDA ---
app.use("/store", require("./routes/store.routes"));



// =============================================
// HEALTH CHECK
// =============================================

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        service: "penguin-store-frontend"
    });
});


// =============================================
// SISTEMA GLOBAL DE MANEJOS DE ERRORES
// =============================================

app.use((error, req, res, next) => {
    console.error("Error en la tienda:", error);

    res.status(500).send(
        "Ocurrió un error en la tienda. Inténtalo nuevamente."
    );
});


// =============================================
// EXPORTAR APP
// =============================================

module.exports = app;
