const db = require('../../common/db-generic-query');

const getOcupacion = async (periodo) => {
    try {
        const result = await db.getOcupacion(periodo);
        return result;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getOcupacion
};
