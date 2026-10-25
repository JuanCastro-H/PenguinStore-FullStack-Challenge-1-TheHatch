// --- Importar Herramientas De Test ---
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

// --- Importar Herramientas Para Simular Peticiones HTTP ---
const request = require("supertest");

// --- Importar Mongoose ---
const mongoose = require("mongoose");

// --- Configuracion De La Aplicacion Y Schema De Categorias ---
const app = require("../../src/app");
const Category = require("../../src/models/Category");


// --- Preparacion Inicial Para Las Pruebas ---
before(async () => {
    // --- Conectarse Con BD De Prueba ---
    await mongoose.connect(
        "mongodb://127.0.0.1:27017/penguin_store_test"
    );
    // --- Limpiar Categorias Para Crear Entorno limpio ---
    await Category.deleteMany({});
});


// --- Acciones Finales Tras Las Pruebas ---
after(async () => {
    await Category.deleteMany({});     // Limpiar Categorias.
    await mongoose.connection.close(); // Cerrar conexion con DB.
});

// --- PRUEBA 1: CREAR CATEGORIA ---
test("POST /categories — crea una categoría y devuelve 201", async () => {
    // - Enviar Peticion HTTP -
    const response = await request(app)
    .post("/categories")
    .send({ name: "Categoría HTTP" });

    // - Verificaciones ---
    assert.equal(response.status, 201);                 // Respuesta positiva
    assert.equal(response.body.name, "Categoría HTTP"); // JSON con info correcta
    assert.ok(response.body._id);                       // Se crea un ID valido.
});


// --- PRUEBA 2: OBTENER LISTA DE CATEGORIAS ---
test("GET /categories — devuelve la lista de categorías", async () => {
    // - Insertar una cateogoria -
    await Category.create({ name: "Categoría para listar" });

    // - Petion HTTP Para Obtener Lista De Categorias -
    const response = await request(app).get("/categories");

    // - Verificaciones ---
    assert.equal(response.status, 200);                       // Respuesta positiva
    assert.ok(Array.isArray(response.body));                  // Que devuelta una lista/array
    assert.ok(response.body.some(                             // Categoria ingresada este
        category => category.name === "Categoría para listar"
    ));
});

