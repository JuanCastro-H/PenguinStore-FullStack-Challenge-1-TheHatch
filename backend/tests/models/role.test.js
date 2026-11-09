const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const Role = require("../../src/models/Role");

describe("Modelo Role", () => {

    // 1. Crear un rol válido
    test("debe crear un rol con un nombre válido", () => {
        const role = new Role({
            name: "admin"
        });

        assert.equal(role.validateSync(), undefined);
        assert.equal(role.name, "admin");
    });

    // 2. Rechazar un rol sin nombre
    test("debe rechazar un rol sin nombre", () => {
        const role = new Role({});

        const error = role.validateSync();

        assert.ok(error);
        assert.equal(error.errors.name.kind, "required");
    });

    // 3. Normalizar el nombre
    test("debe eliminar espacios y convertir el nombre a minúsculas", () => {
        const role = new Role({
            name: "  ADMIN  "
        });

        assert.equal(role.name, "admin");
        assert.equal(role.validateSync(), undefined);
    });

    // 4. Rechazar nombres demasiado largos
    test("debe rechazar un nombre que supere los 30 caracteres", () => {
        const role = new Role({
            name: "a".repeat(31)
        });

        const error = role.validateSync();

        assert.ok(error);
        assert.equal(error.errors.name.kind, "maxlength");
    });

    // 5. Verificar timestamps
    test("debe configurar las fechas de creación y actualización", () => {
        const role = new Role({
            name: "admin"
        });

        assert.ok(role.schema.options.timestamps);
    });

});
