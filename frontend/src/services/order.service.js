
const mongoose = require("mongoose");

const Order = require("../models/Order");

const { getProducts } = require("./catalog.service");

const {
    reserveStock,
    restoreStock
} = require("./inventory.service");

// =============================================
// UTILIDADES
// =============================================

// ---------------------------------------------
// CREAR ERROR CONTROLADO
// ---------------------------------------------

const createBusinessError = (message, statusCode) => {

    const error = new Error(message);

    error.statusCode = statusCode;

    return error;
};

// =============================================
// VALIDAR Y NORMALIZAR DATOS DEL CLIENTE
// =============================================

const normalizeCustomer = (customer) => {

    // --- Comprobar existencia de datos ---

    if (!customer) {
        throw createBusinessError(
            "Debes completar todos los datos del cliente.",
            400
        );
    }

    // --- Normalizar información ---

    const customerData = {
        name: typeof customer.name === "string"
            ? customer.name.trim()
            : "",

        email: typeof customer.email === "string"
            ? customer.email.trim().toLowerCase()
            : "",

        address: typeof customer.address === "string"
            ? customer.address.trim()
            : ""
    };

    // --- Validar datos normalizados ---

    if (
        !customerData.name ||
        !customerData.address ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email) ||
        customerData.name.length > 100 ||
        customerData.email.length > 150 ||
        customerData.address.length > 250
    ) {
        throw createBusinessError(
            "Los datos del cliente no son válidos.",
            400
        );
    }

    return customerData;
};

// =============================================
// VALIDAR Y CONSOLIDAR PRODUCTOS
// =============================================

const normalizeItems = (items) => {

    // --- Comprobar estructura del pedido ---

    if (!Array.isArray(items) || items.length === 0) {
        throw createBusinessError(
            "El pedido debe contener al menos un producto.",
            400
        );
    }

    // --- Estructura clave-valor para acumular cantidades ---

    const requestedItems = new Map();

    for (const item of items) {

        // --- Validar estructura del elemento ---

        if (!item || typeof item !== "object") {
            throw createBusinessError(
                "Los datos de los productos no son válidos.",
                400
            );
        }

        const { productId, quantity } = item;

        const normalizedQuantity = Number(quantity);

        // --- Ignorar productos no seleccionados ---

        if (normalizedQuantity === 0) {
            continue;
        }

        // --- Validar identificador y cantidad ---

        if (
            typeof productId !== "string" ||
            !mongoose.isValidObjectId(productId) ||
            !Number.isSafeInteger(normalizedQuantity) ||
            normalizedQuantity < 1
        ) {
            throw createBusinessError(
                "Los productos o las cantidades no son válidos.",
                400
            );
        }

        // --- Acumular cantidades repetidas ---

        const normalizedProductId = productId.toString();

        const accumulatedQuantity =
            (requestedItems.get(normalizedProductId) || 0)
            + normalizedQuantity;

        if (!Number.isSafeInteger(accumulatedQuantity)) {
            throw createBusinessError(
                "La cantidad solicitada no es válida.",
                400
            );
        }

        requestedItems.set(
            normalizedProductId,
            accumulatedQuantity
        );
    }

    // --- Comprobar que se seleccionó algún producto ---

    if (requestedItems.size === 0) {
        throw createBusinessError(
            "Debes seleccionar al menos un producto.",
            400
        );
    }

    return requestedItems;
};

// =============================================
// CREAR PEDIDO
// =============================================

const createOrder = async (customer, items) => {

    // --- Registrar productos reservados para posibles reversiones ---

    const reservedItems = [];

    try {

        // ---------------------------------------------
        // VALIDAR INFORMACIÓN DEL CLIENTE
        // ---------------------------------------------

        const customerData = normalizeCustomer(customer);

        // ---------------------------------------------
        // VALIDAR PRODUCTOS SOLICITADOS
        // ---------------------------------------------

        const requestedItems = normalizeItems(items);

        // ---------------------------------------------
        // CONSULTAR CATÁLOGO DEL BACKEND
        // ---------------------------------------------

        const products = await getProducts();

        // --- Crear estructura de búsqueda por ID ---

        const productsById = new Map(
            products.map(product => [
                product._id.toString(),
                product
            ])
        );

        const productIds = [...requestedItems.keys()];

        // ---------------------------------------------
        // PREPARAR PRODUCTOS DEL PEDIDO
        // ---------------------------------------------

        const orderItems = [];

        for (const productId of productIds) {

            // --- Obtener información del catálogo ---

            const product = productsById.get(productId);

            if (!product) {
                throw createBusinessError(
                    "Uno o varios productos no existen, están inactivos o no están disponibles.",
                    400
                );
            }

            const quantity = requestedItems.get(productId);

            // --- Validar precio recibido del catálogo ---

            if (
                !Number.isSafeInteger(product.price) ||
                product.price < 0
            ) {
                throw createBusinessError(
                    `El precio de ${product.name} no es válido.`,
                    400
                );
            }

            // ---------------------------------------------
            // RESERVAR STOCK
            // ---------------------------------------------

            const updatedProduct = await reserveStock(
                productId,
                quantity,
                product.price
            );

            // --- Comprobar disponibilidad actual ---

            if (!updatedProduct) {
                throw createBusinessError(
                    `El producto ${product.name} cambió o ya no tiene stock suficiente. Actualiza la tienda e inténtalo nuevamente.`,
                    409
                );
            }

            // --- Registrar reserva para posibles reversiones ---

            reservedItems.push({
                productId,
                quantity
            });

            // ---------------------------------------------
            // CALCULAR SUBTOTAL
            // ---------------------------------------------

            const subtotal = updatedProduct.price * quantity;

            if (!Number.isSafeInteger(subtotal)) {
                throw createBusinessError(
                    "El subtotal del producto no es válido.",
                    400
                );
            }

            // --- Guardar información histórica del producto ---

            orderItems.push({
                product: updatedProduct._id,
                name: updatedProduct.name,
                price: updatedProduct.price,
                quantity,
                subtotal
            });
        }

        // ---------------------------------------------
        // CALCULAR TOTAL DEL PEDIDO
        // ---------------------------------------------

        const total = orderItems.reduce(
            (accumulator, item) => accumulator + item.subtotal,
            0
        );

        if (!Number.isSafeInteger(total)) {
            throw createBusinessError(
                "El total del pedido no es válido.",
                400
            );
        }

        // ---------------------------------------------
        // GUARDAR PEDIDO EN MONGODB
        // ---------------------------------------------

        const order = await Order.create({
            customer: customerData,
            items: orderItems,
            total
        });

        return order;

    } catch (error) {

        // ---------------------------------------------
        // RESTAURAR STOCK SI OCURRE UN ERROR
        // ---------------------------------------------

        if (reservedItems.length > 0) {

            try {

                await restoreStock(reservedItems);

            } catch (restoreError) {

                // --- Informar si falla la compensación ---

                console.error(
                    "ERROR CRÍTICO: No se pudo restaurar todo el stock.",
                    restoreError
                );

                error.stockRestorationFailed = true;
            }
        }

        throw error;
    }
};

// =============================================
// EXPORTAR SERVICIO
// =============================================

module.exports = {
    createOrder
};
