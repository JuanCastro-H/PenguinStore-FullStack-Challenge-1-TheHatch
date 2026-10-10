// --- Importar App/express ---
const app = require("./app");

// --- PUERTO ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Tienda online: http://localhost:${PORT}`);
});