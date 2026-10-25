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


// --- PRUEBA 3: OBTENER CATEGORIA POR ID ---
test("GET /categories/:id — devuelve una categoría existente", async () => {
    // - Guardar Categoria En La BD -
    const category = await Category.create({
        name: "Categoría individual"
    });

    // - Buscar Categoria Por Su ID -
    const response = await request(app).get(`/categories/${category._id}`);

    // - Verificaciones -
    assert.equal(response.status, 200);           // Respuesta postiva
    assert.equal(response.body._id, category.id); // Checar que ID obtenido Y de la categoria coincidan
});


// --- PRUEBA 4: ACTUALIZAR CATEGORIA POR ID ---
test("PUT /categories/:id — actualiza una categoría existente", async () => {
    // - Guardar Categoria De Prueba -
    const category = await Category.create({
        name: "Nombre anterior"
    });

    // - Hacer Solititud Para Actualizar El Nombre -
    const response = await request(app)
        .put(`/categories/${category._id}`)
        .send({ name: "Nombre actualizado" });

    // - Verificaciones -
    assert.equal(response.status, 200);                     // Respuesta positiva
    assert.equal(response.body.name, "Nombre actualizado"); // Name Actualizado
});


// --- PRUEBA 5: ELIMINAR CATEGORIA POR ID ---
test("DELETE /categories/:id — elimina una categoría existente", async () => {
    // - Guardar Categoria De Prueba -
    const category = await Category.create({
        name: "Categoría para eliminar"
    });

    // - Hacer Solicitud Para Eliminarla ---
    const response = await request(app).delete(`/categories/${category._id}`);

    // - Verificaciones -
    assert.equal(response.status, 200);        // Respuesta positiva
    assert.equal(                              // Verificar Eliminacion
        await Category.findById(category._id),
        null
    );
});


// --- PRUEBA 6: ID DE CATEGORIA NO EXISTE ---
test("GET /categories/:id — devuelve 404 si la categoría no existe", async () => {
    // - Generar ID Aleatorio -
    const id = new mongoose.Types.ObjectId();

    // - Buscar Categoria Inexistente Con Ese ID -
    const response = await request(app).get(`/categories/${id}`);

    // - Verifiacar Error -
    assert.equal(response.status, 404);
});


// --- PRUEBA 7: FALTA EL CAMPO NOMBRE AL CREAR UNA CATEGORIA ---
test("POST /categories — devuelve 400 si falta el nombre", async () => {
    // - Crear Categoria Sin Pasarle Nombre"
    const response = await request(app)
        .post("/categories")
        .send({});

    // - Verificar Que Devuelve El Error Correcto -
    assert.equal(response.status, 400);
});


// --- PRUEBA 8: ENVIAR FORMATO DE ID INVALIDO ---
test("GET /categories/:id — devuelve 400 si el ID es inválido", async () => {
    // - Hacer Solicitud Con Id Invalido -
    const response = await request(app).get("/categories/id-invalido");

    // - Verificar Que Devuelve El Error Correcto -
    assert.equal(response.status, 400);
});