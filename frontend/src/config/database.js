const mongoose = require("mongoose");

// =============================================
// CONEXIÓN A MONGODB
// =============================================

const connectDB = async () => {

    try {

        // --- Validar configuración ---
        if (!process.env.MONGODB_URL) {
            throw new Error(
                "MONGODB_URL no está configurado."
            );
        }

        // --- Conectar a MongoDB ---
        await mongoose.connect(process.env.MONGODB_URL);

        console.log(
            "🐧 Frontend conectado correctamente a MongoDB."
        );

    } catch (error) {

        console.error(
            "Error al conectar el frontend con MongoDB:",
            error
        );

        throw error;
    }

};

// =============================================
// EXPORTAR CONEXIÓN
// =============================================

module.exports = connectDB;