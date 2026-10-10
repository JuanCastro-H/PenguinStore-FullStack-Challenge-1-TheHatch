// --- Importar Express ---
const express = require("express");

const app = express();

// -- Ruta Para Comprobar Que El Servidor Funciona ---
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "admin"
    });
});

// --- Exportar Modulo ---
module.exports = app;