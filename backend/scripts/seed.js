const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../src/config/database");

const Role = require("../src/models/Role");
const User = require("../src/models/User");

const { hashPassword } = require("../src/services/password.service");


// ========================================
// INICIALIZAR ROLES
// ========================================

const initializeRoles = async () => {

    const roles = ["user", "admin"];

    for (const roleName of roles) {

        await Role.updateOne(
            { name: roleName },
            { $setOnInsert: { name: roleName } },
            { upsert: true }
        );

        console.log(`Rol verificado: ${roleName}`);
    }
};


// ========================================
// INICIALIZAR ROL DE ADMIN
// ========================================

const initializeAdmin = async () => {

    const email = process.env.ADMIN_EMAIL
        ?.trim()
        .toLowerCase();

    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error("ADMIN_EMAIL y ADMIN_PASSWORD son obligatorios");
    }

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {

        if (existingAdmin.role) {
            const existingRole = await Role.findById(existingAdmin.role);

            if (existingRole?.name === "admin") {
                console.log("El administrador inicial ya existe");
                return;
            }
        }

        throw new Error("El correo configurado ya pertenece a un usuario que no es administrador");
    }

    // --- Obtener rol administrador ---
    const adminRole = await Role.findOne({
        name: "admin"
    });

    if (!adminRole) {
        throw new Error("No se encontró el rol administrador");
    }

    // --- Hashear Contraseña ---
    const passwordHash = await hashPassword(password);

    // --- Crear Administrador ---
    await User.create({
        email,
        passwordHash,
        role: adminRole._id
    });

    console.log("Administrador inicial creado correctamente");

};


// ========================================
// EJECUTAR SEED
// ========================================
const seed = async () => {

    try {
        await connectDB();

        await initializeRoles();

        await initializeAdmin();

        console.log("Inicialización completa correctamente");

    } catch (error) {

        console.error("Error durante la inicialización:", error.message);

        process.exitCode = 1;

    } finally {

        const mongoose = require("mongoose");

        await mongoose.disconnect();

        console.log("Conexión con MongoDB cerrada");
    }

};

seed();