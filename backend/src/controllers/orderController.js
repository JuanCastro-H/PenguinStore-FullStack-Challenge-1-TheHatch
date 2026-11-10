
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");


// =============================================
// CONTROLADOR DE PEDIDOS
// =============================================


// ---------------------------------------------
// CREAR PEDIDO
// ---------------------------------------------

const createOrder = async (req, res, next) => {

    // Arreglo temporal para rastrear productos cuyo stock ya se redujo.
    // Sirve como "seguro" para revertir los cambios si el proceso falla a mitad de camino.

    const reservedItems = [];

    try {

        // ---------------------------------------------
        // OBTENER DATOS DEL CLIENTE
        // ---------------------------------------------

        const { customer, items } = req.body;

        if (
            !customer ||
            !customer.name ||
            !customer.email ||
            !customer.address
        ) {
            return res.status(400).send(
                "Debes completar todos los datos del cliente."
            );
        }

        // --- Normalizar Datos  ---
        const customerData = {
            name: customer.name.trim(),
            email: customer.email.trim().toLowerCase(),
            address: customer.address.trim()
        };

        // --- Verificar Que Cumple la normalización ---
        if (
            !customerData.name ||
            !customerData.address ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)
        ) {
            return res.status(400).send(
                "Los datos del cliente no son válidos."
            );
        }


        // ---------------------------------------------
        // VALIDAR PRODUCTOS Y CANTIDADES
        // ---------------------------------------------

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).send(
                "El pedido debe contener al menos un producto."
            );
        }


        // --- Estructura de clave-valor para consolidar cantidades ---

        const requestedItems = new Map();

        for (const item of items) {

            // --- Validar Estructura Del Elemento ---

            if (!item || typeof item !== "object") {
                return res.status(400).send(
                    "Los datos de los productos no son válidos."
                );
            }

            const { productId, quantity } = item;

            const normalizedQuantity = Number(quantity);


            // --- Ignorar Productos No Seleccionados ---

            if (normalizedQuantity === 0) {
                continue;
            }


            // --- Validar Producto Y Cantidad ---

            if (
                typeof productId !== "string" ||
                !mongoose.isValidObjectId(productId) ||
                !Number.isSafeInteger(normalizedQuantity) ||
                normalizedQuantity < 1
            ) {
                return res.status(400).send(
                    "Los productos o las cantidades no son válidos."
                );
            }


            // --- Acumular Cantidades Repetidas ---

            const normalizedProductId = productId.toString();

            const accumulatedQuantity =
                (requestedItems.get(normalizedProductId) || 0)
                + normalizedQuantity;

            if (!Number.isSafeInteger(accumulatedQuantity)) {
                return res.status(400).send(
                    "La cantidad solicitada no es válida."
                );
            }

            requestedItems.set(
                normalizedProductId,
                accumulatedQuantity
            );

        }


        // --- Comprobar Que Se Seleccionó Algún Producto ---

        if (requestedItems.size === 0) {
            return res.status(400).send(
                "Debes seleccionar al menos un producto."
            );
        }


        // ---------------------------------------------
        // BUSCAR PRODUCTOS EN MONGODB
        // ----------------------- ----------------------

        // ---  // Extrae la lista de IDs únicos del Map ---
        const productIds = [...requestedItems.keys()];

        // --- Busca todos los productos De la lista y que estén activos ---
        const products = await Product.find({
            _id: { $in: productIds },
            isActive: true
        });

        // --- Verificar Que Coincidan Las Cantidades ---
        if (products.length !== productIds.length) {                   // Si la cantidad final no coincide con los solicitados, algún producto no existe o está inactivo
            return res.status(400).send(
                "Uno o varios productos no existen o están inactivos."
            );
        }


        // ---------------------------------------------
        // PREPARAR LOS PRODUCTOS DEL PEDIDO
        // ---------------------------------------------

        const orderItems = [];

        for (const product of products) {

            const quantity = requestedItems.get(                // Recupera la cantidad solicitada asociada al ID de este producto
                product._id.toString()
            );

            // --- Verificar Stock ---
            if (quantity > product.stock) {
                return res.status(409).send(
                    `Stock insuficiente para ${product.name}.`
                );
            }


            // --- Calcular Costo De Un/s pedido/s ---
            const subtotal = product.price * quantity;
            

            // --- Guardar Documento Del Pedido ---
            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity,
                subtotal
            });

        }


        // ---------------------------------------------
        // CALCULAR TOTAL 
        // ---------------------------------------------

        const total = orderItems.reduce(                        
            (accumulator, item) => accumulator + item.subtotal, // Suma el subtotal de todos los medidos acomulados
            0
        );


        // ---------------------------------------------
        // DESCONTAR STOCK
        // ---------------------------------------------

        for (const item of orderItems) {
            
            
            // --- Busca producto atómicamente y asegurar que tenga stock suficiente ---
            const updatedProduct = await Product.findOneAndUpdate(
                {
                    _id: item.product,
                    isActive: true,
                    stock: { $gte: item.quantity }   // Evita condiciones de carrera (Race Conditions)
                },
                {
                    $inc: { stock: -item.quantity }  // Decrementa la cantidad de forma atómica en la BD
                },
                {
                    returnDocument: "after"          // Devuelve el documento modificado
                }
            );

            // --- Comprobar que stock esta disponible aun ---

            if (!updatedProduct) {
                const error = new Error(
                    `Ya no hay stock suficiente para ${item.name}.`
                );

                error.statusCode = 409;

                throw error;
            }

            // --- Registrar Producto ---
            reservedItems.push({
                productId: item.product,
                quantity: item.quantity
            });

        }


        // ---------------------------------------------
        // GUARDAR PEDIDO/ORDEN
        // ---------------------------------------------

        const order = await Order.create({
            customer: customerData,
            items: orderItems,
            total
        });


        // ---------------------------------------------
        // REDIRIGIR A CONFIRMACIÓN
        // ---------------------------------------------

        return res.redirect(
            303,
            `/store/orders/${order._id}/confirmation`
        );


    } catch (error) {

        // ---------------------------------------------
        // DEVOLVER STOCK SI OCURRE UN ERROR
        // ---------------------------------------------

        for (const item of reservedItems) {         // Devovler Stock de los productos reservados.

            await Product.updateOne(
                { _id: item.productId },
                {
                    $inc: { stock: item.quantity }  // Re-incrementa el stock previamente restado
                }
            );

        }

        // --- Responder Errores Controlados ---

        if (error.statusCode) {
            return res.status(error.statusCode).send(error.message);
        }

        // --- Delegar Errores Inesperados ---

        next(error);

    }

};


// =============================================
// EXPORTAR CONTROLADORES
// =============================================

module.exports = {
    createOrder
};
