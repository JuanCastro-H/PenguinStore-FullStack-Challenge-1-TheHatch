// --- Importar app/Express ---
const app = require("./app");

// --- PUERTO ---
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Panel administrativo: http://localhost:${PORT}`);
});
