
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const Category = require("../../src/models/Category");

describe("Modelo Category", () => {

    // --- Crear Slug (PASA) ---
    it("debe generar automáticamente el slug a partir del nombre", async () => {
        const category = new Category({
            name: "Ropa para Pingüinos"
        });

        await category.validate();

        assert.equal(category.slug, "ropa-para-pinguinos");
    });

    // --- Verificar Limpieza Del Slug (PASA) ---
    it("debe convertir el nombre en un slug en minúsculas y sin símbolos", async () => {
        const category = new Category({
            name: "¡Ofertas Especiales!"
        });

        await category.validate();

        assert.equal(category.slug, "ofertas-especiales");
    });

    // --- Categoria Activa Por Defecto (PASA) ---
    it("debe establecer isActive en true por defecto", () => {
        const category = new Category({
            name: "Peluches"
        });

        assert.equal(category.isActive, true);
    });

    // --- Intentar Crear Categoria Sin Nombre (FALLA) ---
    it("debe rechazar una categoría sin nombre", async () => {
        const category = new Category({});

        await assert.rejects(
            category.validate(),
            (error) => {
                assert.equal(error.name, "ValidationError");
                assert.ok(error.errors.name);
                return true;
            }
        );
    });

    // --- Usar Mas Caracteres De Lo Permitidos ---
    it("debe rechazar un nombre que supere los 50 caracteres", async () => {
        const category = new Category({
            name: "A".repeat(51)
        });

        await assert.rejects(
            category.validate(),
            (error) => {
                assert.equal(error.name, "ValidationError");
                assert.ok(error.errors.name);
                return true;
            }
        );
    });

});
