// --- Importar configuracion Interna ---
require("dotenv").config();

const { connect } = require("mongoose");

// --- Importar App/express ---
const app = require("./app");
const connectDB = require("./config/database");

// --- PUERTO ---
const PORT = process.env.PORT || 3000;


const startServer = async () => {

    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Tienda online: http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("No se pudo iniciar la tienda online");
        process.exit(1);
    }
};

startServer();


