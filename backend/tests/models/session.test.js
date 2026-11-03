const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Session = require("../../src/models/Session");

describe("Modelo Session", () => {

    const createSession = (overrides = {}) => {
        return new Session({
            sessionTokenHash: "hash_de_token_ejemplo",
            user: new mongoose.Types.ObjectId(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            ...overrides
        });
    };

    test("debe aceptar una sesión con datos válidos", () => {
        const session = createSession();

        assert.equal(session.validateSync(), undefined);
    });

    test("debe rechazar una sesión sin hash del token", () => {
        const session = createSession({
            sessionTokenHash: undefined
        });

        const error = session.validateSync();

        assert.ok(error);
        assert.equal(error.errors.sessionTokenHash.kind, "required");
    });

    test("debe rechazar una sesión sin usuario", () => {
        const session = createSession({
            user: undefined
        });

        const error = session.validateSync();

        assert.ok(error);
        assert.equal(error.errors.user.kind, "required");
    });

    test("debe rechazar una sesión sin fecha de expiración", () => {
        const session = createSession({
            expiresAt: undefined
        });

        const error = session.validateSync();

        assert.ok(error);
        assert.equal(error.errors.expiresAt.kind, "required");
    });

    test("debe establecer revokedAt en null por defecto", () => {
        const session = createSession();

        assert.equal(session.revokedAt, null);
    });

    test("debe configurar timestamps", () => {
        const session = createSession();

        assert.ok(session.schema.options.timestamps);
    });

});
