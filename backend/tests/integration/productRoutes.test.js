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


// --- PRUEBA 2: OBTENER LISTA DE PRODUCTOS ---
test("GET /products — devuelve los productos y sus categorías", async () => {
    // - Crear Producto -
    await Product.create({
        name: "Producto para listar",
        description: "Descripción de prueba",
        price: 150,
        stock: 10,
        category: category._id
    });

    // - Peticion HTTP Para Obtener Lista De Productos -
    const response = await request(app).get("/products");

    // - Verificaciones -
    assert.equal(response.status, 200);      // Respuesta positiva
    assert.ok(Array.isArray(response.body)); // Lista de productos

    // - Buscar Producto Creado En La Lista -
    const product = response.body.find(
        item => item.name === "Producto para listar"
    );

    // - Verificaciones extras -
    assert.ok(product);                                                 // Se obtuvo el producto
    assert.equal(product.category.name, "Categoría de productos HTTP"); // Si su categoria coincide
});


// --- PRUEBA 3: OBTENER UN PRODUCTO POR SU ID ---
test("GET /products/:id — devuelve un producto existente", async () => {
    // - Crear Producto -
    const product = await Product.create({
        name: "Producto individual",
        description: "Consulta por ID",
        price: 200,
        stock: 3,
        category: category._id
    });

    // - Peticion HTTP Para Buscarlo Por Su ID -
    const response = await request(app).get(`/products/${product._id}`);

    // - Verificaciones -
    assert.equal(response.status, 200);                                        // Respuesta positiva
    assert.equal(response.body._id, product.id);                               // Coinciden los ID
    assert.equal(response.body.name, "Producto individual");                   // Name del producto correcto
    assert.equal(response.body.category.name, "Categoría de productos HTTP");  // Categoria correcta
});


// --- PRUEBA 4: ACTUALIZAR UN PRODCUTO POR SU ID ---
test("PUT /products/:id — actualiza un producto existente", async () => {
    // - Crear Producto -
    const product = await Product.create({
        name: "Nombre anterior",
        description: "Descripción original",
        price: 200,
        stock: 3,
        category: category._id
    });

    // - Peticion HTTP Para Actualizar Nombre Del Producto -
    const response = await request(app)
        .put(`/products/${product._id}`)
        .send({ name: "Nombre actualizado" });

    // - Verificaiones -
    assert.equal(response.status, 200);                      // Respuesta Positiva
    assert.equal(response.body.name, "Nombre actualizado");  // Name actualizado
});


// --- PRUEBA 5: ELIMINAR UN PRODUCTO POR SU ID ---
test("DELETE /products/:id — elimina un producto existente", async () => {
    // - Crear Producto -
    const product = await Product.create({
        name: "Producto para eliminar",
        description: "Prueba de eliminación",
        price: 50,
        stock: 2,
        category: category._id
    });

    // - Peticion HTTP Para Eliminarlo El Producto -
    const response = await request(app).delete(`/products/${product._id}`);

    // - Verificaciones
    assert.equal(response.status, 200);                        // Respuesta positiva
    assert.equal(await Product.findById(product._id), null);   // Confirmar eliminacion
});


// --- PRUEBA 6: BUSCAR UN PRODUCTO INEXISTENTE POR ID ---
test("GET /products/:id — devuelve 404 si el producto no existe", async () => {
    // - Crear ID Aleatorio -
    const id = new mongoose.Types.ObjectId();

    // - Solicitar Un Producto Por Esa ID -
    const response = await request(app).get(`/products/${id}`);
    
    // - Verificar Error -
    assert.equal(response.status, 404);
});


// --- PRUEBA 7: FALTAN CAMPOS OBLIGATORIOS ---
test("POST /products — devuelve 400 si faltan campos obligatorios", async () => {
    // - Crear Producto Sin Campos Obligatorios -
    const response = await request(app)
        .post("/products")
        .send({}); 

    // - Verificar Que Devuelve El Error Correcto -
    assert.equal(response.status, 400);
});


