
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const Category = require("../../src/models/Category");

describe("Modelo Category", () => {

    it("debe generar automáticamente el slug a partir del nombre", async () => {
        const category = new Category({
            name: "Ropa para Pingüinos"
        });

        await category.validate();

        assert.equal(category.slug, "ropa-para-pinguinos");
    });

    it("debe convertir el nombre en un slug en minúsculas y sin símbolos", async () => {
        const category = new Category({
            name: "¡Ofertas Especiales!"
        });

        await category.validate();

        assert.equal(category.slug, "ofertas-especiales");
    });

    it("debe establecer isActive en true por defecto", () => {
        const category = new Category({
            name: "Peluches"
        });

        assert.equal(category.isActive, true);
    });

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
