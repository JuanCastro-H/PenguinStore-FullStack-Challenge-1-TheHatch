
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const User = require("../../src/models/User");

describe("Modelo User", () => {

    // Datos válidos para reutilizar en las pruebas
    const createUser = (overrides = {}) => {
        return new User({
            email: "admin@penguinstore.com",
            passwordHash: "hashed_password_example",
            role: new mongoose.Types.ObjectId(),
            ...overrides
        });
    };

    // 1. Crear un usuario válido
    test("debe aceptar un usuario con datos válidos", () => {
        const user = createUser();

        assert.equal(user.validateSync(), undefined);
    });

    // 2. Rechazar usuario sin correo
    test("debe rechazar un usuario sin correo electrónico", () => {
        const user = createUser({
            email: undefined
        });

        const error = user.validateSync();

        assert.ok(error);
        assert.equal(error.errors.email.kind, "required");
    });

    // 3. Normalizar correo
    test("debe eliminar espacios y convertir el correo a minúsculas", () => {
        const user = createUser({
            email: "  ADMIN@PENGUINSTORE.COM  "
        });

        assert.equal(user.email, "admin@penguinstore.com");
    });

    // 4. Rechazar usuario sin contraseña
    test("debe rechazar un usuario sin passwordHash", () => {
        const user = createUser({
            passwordHash: undefined
        });

        const error = user.validateSync();

        assert.ok(error);
        assert.equal(error.errors.passwordHash.kind, "required");
    });

    // 5. Rechazar usuario sin rol
    test("debe rechazar un usuario sin rol", () => {
        const user = createUser({
            role: undefined
        });

        const error = user.validateSync();

        assert.ok(error);
        assert.equal(error.errors.role.kind, "required");
    });

    // 6. Verificar valores predeterminados
    test("debe establecer los valores predeterminados de la cuenta", () => {
        const user = createUser();

        assert.equal(user.isActive, true);
        assert.equal(user.failedLoginAttempts, 0);
        assert.equal(user.lockedUntil, null);
    });

    // 7. Rechazar intentos negativos
    test("debe rechazar intentos fallidos negativos", () => {
        const user = createUser({
            failedLoginAttempts: -1
        });

        const error = user.validateSync();

        assert.ok(error);
        assert.equal(error.errors.failedLoginAttempts.kind, "min");
    });

    // 8. Rechazar intentos decimales
    test("debe rechazar intentos fallidos con decimales", () => {
        const user = createUser({
            failedLoginAttempts: 2.5
        });

        const error = user.validateSync();

        assert.ok(error);
        assert.equal(error.errors.failedLoginAttempts.kind, "user defined");
    });

    // 9. Verificar timestamps
    test("debe configurar las fechas de creación y actualización", () => {
        const user = createUser();

        assert.ok(user.schema.options.timestamps);
    });

});
