require("dotenv").config();

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
        console.error("No se pudo iniciar el paanel administrativo");
        process.exit(1);
    }

}

startServer();