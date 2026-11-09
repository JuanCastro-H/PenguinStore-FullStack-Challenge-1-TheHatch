// =====================================================
// LIBRERÍAS
// =====================================================
/*
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const dotenv = require("dotenv");
const Role = require(".../models/Role.js");

// =====================================================
// CONFIGURACIÓN DEL ENTORNO DE PRUEBAS
// =====================================================

dotenv.config({ path: ".env.test", override: true });

const testDatabaseUrl = process.env.MONGODB_TEST_URL;

if (!testDatabaseUrl) {
    throw new Error("MONGODB_TEST_URL no está configurada");
}

const databaseName = new URL(testDatabaseUrl).pathname.replace("/", "");

if (databaseName !== "penguin_store_test") {
    throw new Error("Los tests solo pueden ejecutarse en penguin_store_test");
}

process.env.MONGODB_URL = testDatabaseUrl;

// =====================================================
// IMPORTACIONES DEL PROYECTO
// =====================================================

 const app = require("../../src/app");
const Role = require("../../src/models/Role");
const User = require("../../src/models/User");
const Session = require("../../src/models/Session");
const LoginAttempt = require("../../src/models/LoginAttempt");
const { hashPassword } = require("../../src/services/password.service");

// =====================================================
// PREPARACIÓN Y LIMPIEZA
// =====================================================

before(async () => {
    await mongoose.connect(testDatabaseUrl);

    await Role.updateOne(
        { name: "user" },
        { $setOnInsert: { name: "user" } },
        { upsert: true }
    );

    await Role.updateOne(
        { name: "admin" },
        { $setOnInsert: { name: "admin" } },
        { upsert: true }
    );
});

after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});

// =====================================================
// TESTS DE AUTENTICACIÓN
// =====================================================

test("AUTENTICACIÓN — flujo completo", async (t) => {

    // -------------------------------------------------
    // REGISTRO
    // -------------------------------------------------

    await t.test("POST /auth/register — registra un usuario", async () => {

        const response = await request(app)
            .post("/auth/register")
            .send({
                email: "usuario@test.com",
                password: "Password123!"
            });

        assert.equal(response.status, 201);

        const user = await User.findOne({ email: "usuario@test.com" });

        assert.ok(user);
        assert.equal(user.email, "usuario@test.com");
        assert.equal(user.isActive, true);
        assert.equal(user.failedLoginAttempts, 0);

        // La contraseña no debe almacenarse en texto plano.
        assert.notEqual(user.passwordHash, "Password123!");
    });

    await t.test("POST /auth/register — rechaza un correo duplicado", async () => {

        const response = await request(app)
            .post("/auth/register")
            .send({
                email: "usuario@test.com",
                password: "Password123!"
            });

        assert.equal(response.status, 409);
    });

    // -------------------------------------------------
    // INICIO DE SESIÓN
    // -------------------------------------------------

    await t.test("POST /auth/login — inicia sesión correctamente", async () => {

        const response = await request(app)
            .post("/auth/login")
            .send({
                email: "usuario@test.com",
                password: "Password123!"
            });

        assert.equal(response.status, 200);

        const cookies = response.headers["set-cookie"];

        assert.ok(cookies);

        const accessCookie = cookies.find(cookie =>
            cookie.startsWith("accessToken=")
        );

        const csrfCookie = cookies.find(cookie =>
            cookie.startsWith("csrfToken=")
        );

        assert.ok(accessCookie);
        assert.ok(csrfCookie);

        const user = await User.findOne({ email: "usuario@test.com" });

        assert.equal(user.failedLoginAttempts, 0);

        const session = await Session.findOne({ user: user._id });

        assert.ok(session);
        assert.equal(session.revokedAt, null);
        assert.ok(session.csrfTokenHash);
    });

    await t.test("POST /auth/login — rechaza una contraseña incorrecta", async () => {

        const response = await request(app)
            .post("/auth/login")
            .send({
                email: "usuario@test.com",
                password: "ContraseñaIncorrecta123!"
            });

        assert.equal(response.status, 401);

        const user = await User.findOne({ email: "usuario@test.com" });

        assert.equal(user.failedLoginAttempts, 1);
    });

    await t.test("POST /auth/login — bloquea la cuenta después de cinco intentos fallidos", async () => {

        // Ya existe un intento fallido del test anterior.
        // Realizamos cuatro intentos adicionales.

        for (let i = 0; i < 4; i++) {
            await request(app)
                .post("/auth/login")
                .send({
                    email: "usuario@test.com",
                    password: "ContraseñaIncorrecta123!"
                });
        }

        const user = await User.findOne({ email: "usuario@test.com" });

        assert.equal(user.failedLoginAttempts, 5);
        assert.ok(user.lockedUntil);
        assert.ok(user.lockedUntil > new Date());

        // Una contraseña correcta tampoco debe permitir
        // entrar mientras la cuenta esté bloqueada.

        const response = await request(app)
            .post("/auth/login")
            .send({
                email: "usuario@test.com",
                password: "Password123!"
            });

        assert.equal(response.status, 401);
    });

    // -------------------------------------------------
    // SESIONES Y COOKIES
    // -------------------------------------------------

    await t.test("GET /auth/me — permite consultar al usuario autenticado", async () => {

        const agent = request.agent(app);

        await agent
            .post("/auth/login")
            .send({
                email: "usuario@test.com",
                password: "Password123!"
            });

        const response = await agent.get("/auth/me");

        assert.equal(response.status, 200);
        assert.equal(response.body.email, "usuario@test.com");
    });

    await t.test("GET /auth/me — rechaza solicitudes sin autenticación", async () => {

        const response = await request(app).get("/auth/me");

        assert.equal(response.status, 401);
    });

    // -------------------------------------------------
    // PROTECCIÓN CSRF
    // -------------------------------------------------

    await t.test("POST /auth/logout — rechaza una solicitud sin token CSRF", async () => {

        const agent = request.agent(app);

        await agent
            .post("/auth/login")
            .send({
                email: "usuario@test.com",
                password: "Password123!"
            });

        const response = await agent.post("/auth/logout");

        assert.equal(response.status, 403);
    });

    // -------------------------------------------------
    // CIERRE DE SESIÓN
    // -------------------------------------------------

    await t.test("POST /auth/logout — cierra sesión y revoca el token", async () => {

        const agent = request.agent(app);

        const loginResponse = await agent
            .post("/auth/login")
            .send({
                email: "usuario@test.com",
                password: "Password123!"
            });

        assert.equal(loginResponse.status, 200);

        const cookies = loginResponse.headers["set-cookie"];

        const csrfCookie = cookies.find(cookie =>
            cookie.startsWith("csrfToken=")
        );

        assert.ok(csrfCookie);

        const csrfToken = decodeURIComponent(
            csrfCookie.split(";")[0].substring("csrfToken=".length)
        );

        const session = await Session.findOne({
            user: await User.findOne({ email: "usuario@test.com" }).then(user => user._id),
            revokedAt: null
        });

        assert.ok(session);

        const logoutResponse = await agent
            .post("/auth/logout")
            .set("x-csrf-token", csrfToken);

        assert.equal(logoutResponse.status, 200);

        const revokedSession = await Session.findById(session._id);

        assert.ok(revokedSession.revokedAt);

        const meResponse = await agent.get("/auth/me");

        assert.equal(meResponse.status, 401);
    });
});
*/