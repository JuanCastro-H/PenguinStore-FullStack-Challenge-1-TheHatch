
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const LoginAttempt = require("../../src/models/LoginAttempt");

describe("Modelo LoginAttempt", () => {

    const createLoginAttempt = (overrides = {}) => {
        return new LoginAttempt({
            email: "admin@penguinstore.com",
            ipAddress: "127.0.0.1",
            success: false,
            ...overrides
        });
    };

    test("debe aceptar un intento de login válido", () => {
        const attempt = createLoginAttempt();

        assert.equal(attempt.validateSync(), undefined);
    });

    test("debe permitir intentos sin usuario asociado", () => {
        const attempt = createLoginAttempt({
            user: null
        });

        assert.equal(attempt.validateSync(), undefined);
    });

    test("debe aceptar una referencia de usuario válida", () => {
        const userId = new mongoose.Types.ObjectId();

        const attempt = createLoginAttempt({
            user: userId
        });

        assert.equal(attempt.user.toString(), userId.toString());
        assert.equal(attempt.validateSync(), undefined);
    });

    test("debe rechazar un intento sin correo", () => {
        const attempt = createLoginAttempt({
            email: undefined
        });

        const error = attempt.validateSync();

        assert.ok(error);
        assert.equal(error.errors.email.kind, "required");
    });

    test("debe rechazar un intento sin dirección IP", () => {
        const attempt = createLoginAttempt({
            ipAddress: undefined
        });

        const error = attempt.validateSync();

        assert.ok(error);
        assert.equal(error.errors.ipAddress.kind, "required");
    });

    test("debe rechazar un intento sin resultado", () => {
        const attempt = createLoginAttempt({
            success: undefined
        });

        const error = attempt.validateSync();

        assert.ok(error);
        assert.equal(error.errors.success.kind, "required");
    });

    test("debe normalizar el correo electrónico", () => {
        const attempt = createLoginAttempt({
            email: "  ADMIN@PENGUINSTORE.COM  "
        });

        assert.equal(attempt.email, "admin@penguinstore.com");
    });

    test("debe configurar timestamps", () => {
        const attempt = createLoginAttempt();

        assert.ok(attempt.schema.options.timestamps);
    });

});
