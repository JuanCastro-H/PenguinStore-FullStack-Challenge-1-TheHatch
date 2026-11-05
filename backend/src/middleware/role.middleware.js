
 // =============================================
 // MIDDLEWARE DE AUTORIZACIÓN PARA ROLES
 // =============================================


// ---------------------------------------------
// --- AUTORIZAR ROLES PERMITIDOS ---
// ---------------------------------------------

const authorizeRoles = (...allowedRoles) => {

    // --- Comprobar Si Se Recibieron Roles ---

    if (allowedRoles.length === 0) {
        throw new Error("At least one role must be specified");
    }


    // --- Verificar Rol Del Usuario ---

    return (req, res, next) => {

        // --- Comprobar Que El Usuario Este Autenticado ---

        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }


        // --- Obtener Rol Del Usuario ---

        const userRole = req.user.role;


        // --- Comprobar Si Tiene Un Rol Permitido ---

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                message: "Access denied: insufficient permissions"
            });
        }


        // --- Continuar Con La Peticion ---

        next();

    };

};



// =============================================
// EXPORTAR MIDDLEWARE
// =============================================

module.exports = {
    authorizeRoles
};
