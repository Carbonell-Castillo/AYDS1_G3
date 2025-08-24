const db = require('../../common/db-generic-query');

function getUsers()
{
    return db.selectAll('usuario');

}

function getTotalInvertido(dpi) {
    return db.selectRecord('usuario', { usuario: dpi })
    .then((user) => {
        if (!user) throw new Error('User not found');
        return db.totalInvertido('ingreso', { usuario: user.usuario });
    });
}

function getVehiculosParqueados(dpi) {
    return db.selectRecord('usuario', { usuario: dpi })
    .then(async (user) => {
        if (!user) throw new Error('User not found');
        const vehiculosParqueados = await db.vehiculosParqueados('vehiculo', { usuario: user.usuario });
        return {
            "dpi": user.usuario,
            "vehiculosParqueados": vehiculosParqueados
        }
    });
}

function getVehiculosCount(dpi) {
    return db.selectRecord('usuario', { usuario: dpi })
    .then(async (user) => {
        if (!user) throw new Error('User not found');
        const totalVehiculos = await db.vehiculosCount('usuario_vehiculo', { usuario: user.usuario });
        return {
            "dpi": user.usuario,
            "totalVehiculos": totalVehiculos
        }
    });
}

function getVehiculos(dpi) {
    return db.selectRecord('usuario', { usuario: dpi })
    .then(async (user) => {
        if (!user) throw new Error('User not found');
        const vehiculos = await db.selectAll('vehiculo', { usuario: user.usuario });
        return {
            "vehiculos": vehiculos
        }
    });
}

module.exports = {
    getUsers,
    getTotalInvertido,
    getVehiculosParqueados,
    getVehiculosCount,
    getVehiculos
};