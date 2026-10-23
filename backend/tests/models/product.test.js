const { describe, it } = require("node:test");

const assert = require("node:assert/strict");

const Product = require("../../src/models/Product");

const mongoose = require("mongoose");


const createProduct = (overrides = {}) => {

    return {
        name: "Camiseta de Algodon",
        description: "Camiseta comoda de alta calidad",
        price: 25000,
        category: new mongoose.Types.ObjectId(),
        stock: 10,
        images: ["https://example.com/pinguino.jpg"],
        ...overrides
    };
};

describe("Modelo Product", () => {

    // ---  Crear Un Producto Con Datos Validos (Pasa) ---
    it("debe pasar la validación con datos válidos", async () => {
        const product = new Product(createProduct());

        await assert.doesNotReject(async () => {
            await product.validate();
        });
    });

    // --- Omitir Nombre (Falla) ---
    it ("debe rechazar un producto sin nombre", async () => {

        const data = createProduct();
        delete data.name; // Eliminar nombre del producto
        const product = new Product(data);

        await assert.rejects(
            product.validate(),
            (error) => {
                assert.equal(error.name, "ValidationError");
                assert.ok(error.errors.name);
                return true;
            }
        );
    });

    // --- Omitir Descripcion (Falla) ---
    it ("debe rechazar un producto sin descripcion", async () => {
        const data = createProduct();
        delete data.description;
        const product = new Product(data);

        await assert.rejects(
            product.validate(),
            (error) => {
                assert.equal(error.name, "ValidationError");
                assert.ok(error.errors.description);
                return true;
            }
        );
    });

    // --- Omitir Precio (Falla) ---
    it("debe rechazar un producto sin precio", async () => {
        const data = createProduct();
        delete data.price;
        const product = new Product(data);

        await assert.rejects(
            product.validate(),
            (error) => {
                assert.equal(error.name, "ValidationError");
                assert.ok(error.errors.price);
                return true;
            }
        );
    });

    // --- Precio Con Decimal (FALLA)
    it("debe rechazar un precio con decimales", async () => {
        const product = new Product(createProduct({ price: 2500.5}));

        await assert.rejects(
            product.validate(),
            (error) => {
                assert.equal(error.name, "ValidationError");
                assert.ok(error.errors.price);
                return true;
            }
        );

    });

    // --- Comprobar Stock En 0 Por defecto (PASA) ---
    it("debe establecer el stock en 0 por defecto", async () => {
        const data = createProduct();
        delete data.stock;

        const product = new Product(data);

        await product.validate();
        assert.equal(product.stock, 0);

    });

    // --- Usar Stock Con Decimal (Falla) ---
    it("debe rechazar un stock si contiene decimales", async () => {
        const product = new Product(createProduct({stock: 5500.5}));

        await assert.rejects(
            product.validate(),
            (error) => {
                assert.equal(error.name, "ValidationError");
                assert.ok(error.errors.stock);
                return true;
            }
        );
    });

    // --- Omitir Categoria (Falla) ---
    it("debe rechazar un producto sin categoría", async () => {
        const data = createProduct();
        delete data.category;
        const product = new Product(data);

        await assert.rejects(
            product.validate(),
            (error) => {
                assert.equal(error.name, "ValidationError");
                assert.ok(error.errors.category);
                return true;
            }

        );
    });

    // Omitir Imagenes (PASA)
    it("debe aplicar un arreglo vacío por defecto si se omiten las imágenes", async () => {
        const data = createProduct();
        delete data.images;
        const product = new Product(data);

        await product.validate();
        assert.ok(Array.isArray(product.images));
        assert.equal(product.images.length, 0);
    });

    // --- Incluir Una Imagen Vacia (Falla) ---
    it("debe rechazar una imagen con una cadena vacía", async () => {
        const product = new Product(createProduct({
            images: [""] // La cadena esta vacia.
        }));

        await assert.rejects(
            product.validate(),
            (error) => {
                assert.equal(error.name, "ValidationError");
                assert.ok(error.errors.images);
                return true;
            }
        );

    });

    // -- Omitir isActive (PASA)
    it("debe establecer isActive en true por defecto la configuración", async () => {
        const data = createProduct();
        delete data.isActive;
        const product = new Product(data);

        await product.validate();
        assert.equal(product.isActive, true);

    });


});