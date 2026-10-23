const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Category = require("../../src/models/Category");
const Product = require("../../src/models/Product");

before(async () => {
    await mongoose.connect(
        "mongodb://127.0.0.1:27017/penguin_store_test"
    );
});

after(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
    await mongoose.connection.close();
});

test("Crear un producto asociado a una categoría y recuperarla con populate", async () => {
    const category = await Category.create({
        name: "Prueba integración"
    });

    const product = await Product.create({
        name: "Producto de prueba",
        description: "Producto para verificar la relación",
        price: 100,
        stock: 5,
        category: category._id
    });

    const result = await Product.findById(product._id)
        .populate("category");

    assert.ok(result);
    assert.equal(result.name, "Producto de prueba");
    assert.ok(result.category);
    assert.equal(result.category.name, "Prueba integración");
});