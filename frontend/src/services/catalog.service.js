
const { BACKEND_URL } = require("../config/api");

// =============================================
// CONSULTAR CATÁLOGO DE PRODUCTOS
// =============================================

const getProducts = async () => {

    const response = await fetch(`${BACKEND_URL}/products`);

    if (!response.ok) {
        throw new Error("No se pudieron obtener los productos.");
    }

    const products = await response.json();

    // --- Verificar estructura de respuesta ---

    if (!Array.isArray(products)) {
        throw new Error("La respuesta del catálogo no es válida.");
    }

    // --- Mostrar únicamente productos disponibles ---

    return products.filter(product =>
        product.isActive && product.stock > 0
    );
};

// =============================================
// EXPORTAR SERVICIO
// =============================================

module.exports = {
    getProducts
};
