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

const asignarParqueoManual = async (body) => {
    const { usuario, placa, idParqueo, idEspacio } = body;

    try {
        const result = await db.asignarParqueoManual(usuario, placa, idParqueo, idEspacio);
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

const asignarParqueoUsuario = async(body) => {
    const { usuario, idParqueo } = body;

    try {
        const result = await db.asignarParqueoUsuario(usuario, idParqueo);
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const obtenerEspaciosDisponibles = async () => {
    try {
        const result = await db.obtenerEspaciosDisponibles();
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const registrarSalida = async (idEspacio, body) => {
    const { usuario, placa } = body;

    try {
        const result = await db.registrarSalida(idEspacio, usuario, placa);
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

module.exports = {
    asignarParqueoAutomatico,
    asignarParqueoManual,
    asignarParqueoUsuario,
    obtenerEspaciosDisponibles,
    registrarSalida
};
