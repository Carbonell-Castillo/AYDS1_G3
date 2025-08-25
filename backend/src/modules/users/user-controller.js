const db = require('../../common/db-generic-query');

function getUsers()
{
    return db.selectAll('usuario');

}

function validateUser(usuario,password)
{
    return db.validateUser(usuario,password);

}

const createUser = async (reqParams) => {
    try {
        const result = await db.createUser('usuario', {
            usuario: reqParams.dpi,
            password: reqParams.password,
            nombre: reqParams.nombre,
            apellido: reqParams.apellido,
            licencia_imagen_path: reqParams.licencia_path,
            genero_id:reqParams.genero ==='M'?1:2,
            telefono: reqParams.telefono,
            correo_electronico:reqParams.email,
            id_parqueo:'ayds1s22025P1',
            solo_parqueo_asignado:1,
            dpi:reqParams.dpi});
        return {
            mensaje: "Usuario creado exitosamente"
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
};


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
    getVehiculos,
    validateUser,
    createUser
};