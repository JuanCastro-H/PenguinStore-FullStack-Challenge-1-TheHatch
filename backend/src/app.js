// --- Importar Express ---
const express = require("express");

const app = express();

app.use(express.json());

// -- Ruta Para Comprobar Que El Servidor Funciona ---
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "admin"
    });
});

const categoryRoutes = require("./routes/categoryRoutes");
app.use("/categories", categoryRoutes);

const productRoutes = require("./routes/productRoutes");
app.use("/products", productRoutes);

// --- Exportar Modulo ---
module.exports = app;