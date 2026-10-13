// --- Importar Mongoose ---
const mongoose = require("mongoose");

const connectDB =  async () => {

    try {

        // --- Conectar Con La BD ---
        await mongoose.connect(process.env.MONGOBD_URL);
        console.log("MongoDB conectado correctamente");

    } catch (error) {
        
        // --- Imprimir Error --
        console.error("Error al conectar con MongoDb:", error);
        throw error;
    }
}