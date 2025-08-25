const db = require('../../common/db-generic-query');

const asignarParqueoAutomatico = async (body) => {
    const { usuario, placa } = body;

    try {
        const result = await db.asignarParqueoAutomatico(usuario, placa);
        return {
            mensaje: "Parqueado exitosamente",
            idParqueo: result.id_parqueo,
            idEspacio: result.id_espacio,
            fechaIngresoHora: result.fecha_hora_ingreso
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
};

module.exports = {
    asignarParqueoAutomatico
};
