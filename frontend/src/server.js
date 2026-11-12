// --- Importar Conexion Con La Base De Datos ---
const connectDB = require("./config/database");

 // --- Importar configuracion Interna ---
require("dotenv").config();

// --- Importar App/express ---
const app = require("./app");

// --- PUERTO ---
const PORT = process.env.PORT || 3000;



// =============================================
// INICIAR SERVIDOR
// =============================================

const startServer = async () => {

    try {

        // --- Conectar a MongoDB ---
        await connectDB();

        // --- Iniciar Express ---
        app.listen(PORT, () => {
            console.log(
                `Tienda online: http://localhost:${PORT}`
            );
        });

    } catch (error) {

        console.error(
            "No se pudo iniciar la tienda online."
        );

        console.error(error);

        process.exit(1);
    }

};

startServer();

startServer();
