const db = require('../../common/db-generic-query');

const getOcupacion = async (periodo) => {
    try {
        const result = await db.getOcupacion(periodo);
        return result;
    } catch (error) {
        throw error;
    }
};

const getSanciones = async (placa) => {
    try {
        const result = await db.selectAllRecords('multa_sancion', { placa_vehiculo: placa });
        const sanciones = result.map(sancion => ({
            id: sancion.id_multa_sancion,
            motivo: sancion.descripcion,
            monto: sancion.monto,
            fecha: sancion.fecha
        }));
        return {
            placa: placa,
            sanciones: sanciones
        }
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getOcupacion,
    getSanciones
};
