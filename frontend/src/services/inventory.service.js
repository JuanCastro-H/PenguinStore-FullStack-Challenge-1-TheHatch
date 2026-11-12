
const InventoryProduct = require("../models/InventoryProduct");

// =============================================
// DESCONTAR STOCK DE UN PRODUCTO
// =============================================

const reserveStock = async (productId, quantity, expectedPrice) => {

    // --- Actualización atómica del inventario ---

    const product = await InventoryProduct.findOneAndUpdate(
        {
            _id: productId,
            isActive: true,
            stock: { $gte: quantity },
            price: expectedPrice
        },
        {
            $inc: {
                stock: -quantity
            }
        },
        {
            returnDocument: "after"
        }
    );

    return product;
};

// =============================================
// RESTAURAR STOCK DE UN PRODUCTO
// =============================================

const restoreStock = async (reservedItems) => {

    // --- Revertir las reservas realizadas ---

    const results = await Promise.allSettled(
        reservedItems.map(item =>
            InventoryProduct.updateOne(
                {
                    _id: item.productId
                },
                {
                    $inc: {
                        stock: item.quantity
                    }
                }
            )
        )
    );

    // --- Comprobar que todas las restauraciones funcionaron ---

    const failedRestorations = results.filter(
        result => result.status === "rejected"
    );

    const unsuccessfulUpdates = results.filter(
        result =>
            result.status === "fulfilled" &&
            result.value.matchedCount !== 1
    );

    if (
        failedRestorations.length > 0 ||
        unsuccessfulUpdates.length > 0
    ) {
        throw new Error(
            "No se pudo restaurar todo el stock reservado."
        );
    }
};

// =============================================
// EXPORTAR SERVICIO
// =============================================

module.exports = {
    reserveStock,
    restoreStock
};
