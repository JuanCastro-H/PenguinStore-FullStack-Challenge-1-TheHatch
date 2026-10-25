// --- Importar Herramientas De Test ---
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

// --- Importar Herramientas Para Simular Peticiones HTTP ---
const request = require("supertest");

// --- Importar Mongoose ---
const mongoose = require("mongoose");

// --- Impotar Configuracion De La Aplicacion Y Schemas ---
const app = require("../../src/app");
const Category = require("../../src/models/Category");
const Product = require("../../src/models/Product");

let category;


// --- Preparacion Inicial Para Las Pruebas ---
before(async () => {
    // - Conectarse Con BD De Prueba -
    await mongoose.connect(
        "mongodb://127.0.0.1:27017/penguin_store_test"
    );

    // - Limpiar Productos Y Categorias -
    await Product.deleteMany({});
    await Category.deleteMany({});

    // - Guardar Categoria De Prueba -
    category = await Category.create({
        name: "Categoría de productos HTTP"
    });
});


// --- Acciones Finales Tras Las Pruebas ---
after(async () => {
    await Product.deleteMany({});      // Limpiar Productos
    await Category.deleteMany({});     // Limpiar Categorias
    await mongoose.connection.close(); // Cerrar conexion con la BD
});


// --- PRUEBA 1: CREAR UN PRODUCTO ---
test("POST /products — crea un producto y devuelve 201", async () => {

    // - Enviar PETICION HTTP -
    const response = await request(app)
        .post("/products")
        .send({ // Datos Del Producto
            name: "Producto HTTP",
            description: "Producto para integración",
            price: 100,
            stock: 5,
            category: category._id
        });
    
    // - Verificaciones - 
    assert.equal(response.status, 201);                  // Respuesta positiva
    assert.equal(response.body.name, "Producto HTTP");   // 
    assert.ok(response.body._id);
});


