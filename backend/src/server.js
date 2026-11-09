require("dotenv").config();

// =============================================
// VALIDAR CONFIGURACIÓN
// =============================================

if (!process.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL no esta configurado");
}

// --- Importar app/Express ---
const app = require("./app");
const connectDB = require("./config/database");


// --- PUERTO ---
const PORT = process.env.PORT || 4000;


const startServer = async () => {

    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Panel administrativo: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("No se pudo iniciar el panel administrativo");
        console.error(error);
        process.exit(1);
    }

}

startServer();