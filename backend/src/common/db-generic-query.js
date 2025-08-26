const mysql = require('mysql2');
const config = require('../config');
const utilities = require('../utilities/utils');

const dbConfig = {
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password,
    database: config.mysqlConfig.database
}

let connection;

function connMysql(){
    connection = mysql.createConnection(dbConfig);

    connection.connect((err) => {
        if(err){
            console.log('[db err]',err);
            setTimeout(connMysql, 200);
        }else{
            console.log('La base de datos fue conectada correctamente');
        }
    });

    connection.on('error', err => {
        console.log('[db err]',err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            connMysql();
        }else{
            throw err;
        }
    });

}
connMysql();

function selectAll(table){
    return new Promise( (resolve,reject) => {
        connection.query(`SELECT * FROM ${table}`,(error,result) => {
            if(error) return reject(error);
            resolve(result);
        })
    });
}

function validateUser(usuario,password){
    return new Promise( (resolve,reject) => {
        let q =`SELECT COUNT(usuario) as exist FROM usuario where (usuario ='${usuario}' or dpi ='${usuario}' or correo_electronico ='${usuario}') and password='${password}'`;
        console.log(q);
        connection.query(q,(error,result) => {
            if(error) return reject(error);
            resolve(result);
        })
    });
}

function getUserByVehiculePlate(plate){
    return new Promise( (resolve,reject) => {
        let q =`SELECT * FROM usuario_vehiculo where  placa_vehiculo ='${plate}' LIMIT 1`;
        console.log(q);
        connection.query(q,(error,result) => {
            if(error) return reject(error);
            resolve(result);
        })
    });
}



async function createUser(table,record)
{

    return insertRecord(table,record);
}



function selectRecord(table, where){
    return new Promise( (resolve,reject) => {
        connection.query(`SELECT * FROM ${table} WHERE ?`, where, (error,result) => {
            if(error) return reject(error);
            resolve(result[0]);
        })
    });
}

function insertRecord(table,record){
    return new Promise( (resolve,reject) => {
        connection.query(`INSERT INTO ${table} SET ?`, [record], (error,result) => {
            if(error) return reject(error);
            resolve(result);
        })
    });
}

function updatePenalty(monto,motivo,id){

    return new Promise( (resolve,reject) => {
        connection.query(`
                UPDATE multa_sancion
                SET monto = ${monto},
                descripcion = '${motivo}'
                WHERE id_multa_sancion = ${id} AND anulada =0;`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            })
    });


}

function removePenalty(id){

    return new Promise( (resolve,reject) => {
        connection.query(`
                UPDATE multa_sancion
                SET anulada = 1
                WHERE id_multa_sancion = ${id} AND anulada =0;`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            })
    });


}

function removeRecord(table,id){

}

async function totalInvertido(table, where) {
    const totalInvertido = await new Promise((resolve, reject) => {
        connection.query(`SELECT usuario, SUM(monto) AS total_invertido FROM ${table} WHERE usuario = '${where.usuario}';`, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
    console.log(totalInvertido);
    return {
        "dpi": totalInvertido[0].usuario,
        "totalInvertido": totalInvertido[0].total_invertido
    };
}

function vehiculosParqueados(table, where) {
    return new Promise((resolve, reject) => {
        connection.query(`
            SELECT
                v.placa,
                v.modelo,
                esp.etiqueta AS ubicacion
            FROM vehiculo v
                    INNER JOIN usuario_vehiculo uv
                                ON v.placa = uv.placa_vehiculo
                    INNER JOIN espacio esp
                    INNER JOIN ingreso i
                                ON esp.id_espacio = i.id_espacio
            WHERE uv.usuario = '${where.usuario}' AND esp.ocupado = 1;`, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
}

function vehiculosCount(table, where) {
    return new Promise((resolve, reject) => {
        connection.query(`
            SELECT COUNT(*) AS count
            FROM ${table}
            WHERE usuario = '${where.usuario}';`, (error, result) => {
            if (error) return reject(error);
            resolve(result[0].count);
        });
    });
}

function getVehiculos(table, where) {
    return new Promise((resolve, reject) => {
        connection.query(`
            SELECT
                v.placa,
                tv.nombre AS tipo,
                v.marca
            FROM vehiculo v
                    INNER JOIN tipo_vehiculo tv
                                ON v.tipo_vehiculo_id = tv.tipo_vehiculo_id
                    INNER JOIN usuario_vehiculo uv
                                ON v.placa = uv.placa_vehiculo
            WHERE uv.usuario = '${where.usuario}';`, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
}

async function asignarParqueoAutomatico(usuario, placa) {
    try {
        const parqueosLibres = await new Promise((resolve, reject) => {
            connection.query(`
                SELECT id_espacio, id_parqueo
                FROM espacio
                WHERE ocupado = 0
                LIMIT 1;`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });
        
        if (parqueosLibres.length === 0) {
            throw new Error("No hay espacios de parqueo disponibles");
        }

        const fecha_hora_ingreso = utilities.formatDate(new Date());
        insertRecord('ingreso', {
            id_parqueo: parqueosLibres[0].id_parqueo,
            id_espacio: parqueosLibres[0].id_espacio,
            usuario: usuario,
            placa: placa,
            fecha_hora_ingreso: fecha_hora_ingreso
        });

        await new Promise((resolve, reject) => {
            connection.query(`
                UPDATE espacio
                SET ocupado = 1
                WHERE id_espacio = ${parqueosLibres[0].id_espacio};`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });

        return {
            id_parqueo: parqueosLibres[0].id_parqueo,
            id_espacio: parqueosLibres[0].id_espacio,
            fecha_hora_ingreso: fecha_hora_ingreso
        }

    } catch (error) {
        throw error;
    }
}

async function asignarParqueoManual(usuario, placa, idParqueo, idEspacio) {
    try {
        const espacio = await new Promise((resolve, reject) => {
            connection.query(`
                SELECT id_espacio, id_parqueo
                FROM espacio
                WHERE id_espacio = ${idEspacio} AND ocupado = 0;`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });
        
        if (espacio.length === 0) {
            throw new Error("El espacio de parqueo no está disponible");
        }

        const fecha_hora_ingreso = utilities.formatDate(new Date());
        insertRecord('ingreso', {
            id_parqueo: idParqueo,
            id_espacio: idEspacio,
            usuario: usuario,
            placa: placa,
            fecha_hora_ingreso: fecha_hora_ingreso
        });

        await new Promise((resolve, reject) => {
            connection.query(`
                UPDATE espacio
                SET ocupado = 1
                WHERE id_espacio = ${idEspacio};`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });

        return {
            id_parqueo: idParqueo,
            id_espacio: idEspacio,
            fecha_hora_ingreso: fecha_hora_ingreso
        }

    } catch (error) {
        throw error;
    }  
}

async function asignarParqueoUsuario(usuario, idParqueo) {
    try {
        const insertar = await insertRecord('usuario_parqueo', {
            usuario: usuario,
            id_parqueo: idParqueo
        });

        if (insertar) {
            return {
                mensaje: "Usuario asignado al parqueo correctamente",
                usuario: usuario,
                idParqueo: idParqueo
            };
        } else {
            throw new Error("No se pudo asignar el usuario al parqueo");
        }
    } catch (error) {
        throw error;
    }
}

async function obtenerEspaciosDisponibles() {
    try {
        const espaciosDisponibles = await new Promise((resolve, reject) => {
            connection.query(`
                SELECT
                    e.id_parqueo AS idParqueo,
                    p.nombre AS nombre,
                    COUNT(*) AS espaciosDisponibles
                FROM espacio e
                INNER JOIN parqueo p ON e.id_parqueo = p.id_parqueo
                WHERE ocupado = 0
                GROUP BY e.id_parqueo, p.nombre;`, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });
        });
        return {
            parqueosDisponibles: espaciosDisponibles
        }
    } catch (error) {
        throw error;
    }
}

async function registrarPago(ingreso) {
    try {
        const datosPago = await new Promise((resolve, reject) => {
            connection.query(`
                SELECT
                    p.id_parqueo,
                    esp.id_espacio,
                    i.placa,
                    i.usuario,
                    tiempo_uso,
                    i.fecha_hora_salida,
                    tc.precio,
                    mt.nombre AS medida_tiempo,
                    tiempo_uso*tc.precio AS monto
                FROM ingreso i
                        INNER JOIN espacio esp ON i.id_espacio = esp.id_espacio
                        INNER JOIN tipo_cobro tc ON esp.tipo_cobro_id = tc.tipo_cobro_id
                        INNER JOIN medida_tiempo mt ON tc.medida_tiempo_id = mt.medida_tiempo_id
                        INNER JOIN parqueo p ON i.id_parqueo = p.id_parqueo
                        CROSS JOIN (SELECT TIMESTAMPDIFF(HOUR, fecha_hora_ingreso, fecha_hora_salida) AS tiempo_uso FROM ingreso  WHERE id_ingreso = ${ingreso.id_ingreso}) AS ht
                WHERE i.id_ingreso = ${ingreso.id_ingreso};`, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });
        });

        const fechaPago = utilities.formatDate(new Date());
        await new Promise((resolve, reject) => {
            connection.query(`
                INSERT INTO pago (usuario, id_parqueo, placa_vehiculo, monto, fecha_hora_pago)
                VALUES ('${datosPago[0].usuario}', '${datosPago[0].id_parqueo}', '${datosPago[0].placa}', ${datosPago[0].monto}, '${fechaPago}');`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });

        const pago = await selectRecord('pago', { usuario: datosPago[0].usuario });

        return {
            idParqueo: ingreso.id_parqueo,
            idEspacio: ingreso.id_espacio,
            placa: ingreso.placa,
            tiempoUso: datosPago[0].tiempo_uso + 'h',
            monto: datosPago[0].monto,
            reciboId: pago.id_pago,
            fechaSalida: ingreso.fecha_hora_salida,
        }
    } catch (error) {
        throw error;
    }
}

async function registrarSalida(idEspacio, usuario, placa) {
    try {
        const ingreso = await selectRecord('ingreso', { id_espacio: idEspacio});
        if (ingreso.usuario !== usuario || ingreso.placa !== placa) {
            throw new Error("Los datos proporcionados no coinciden con el registro de ingreso");
        }

        const fecha_hora_salida = utilities.formatDate(new Date());
        await new Promise((resolve, reject) => {
            connection.query(`
                UPDATE ingreso
                SET fecha_hora_salida = '${fecha_hora_salida}'
                WHERE id_espacio = ${idEspacio} AND usuario = '${usuario}' AND placa = '${placa}';`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });

        await new Promise((resolve, reject) => {
            connection.query(`
                UPDATE espacio
                SET ocupado = 0
                WHERE id_espacio = ${idEspacio};`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });

        const ingresoActualizado = await selectRecord('ingreso', { id_ingreso: ingreso.id_ingreso });
        const datosPago = await registrarPago(ingresoActualizado);
        return datosPago;
    } catch (error) {
        throw error;
    }
}

module.exports ={
    selectAll,
    selectRecord,
    insertRecord,
    removeRecord,
    totalInvertido,
    vehiculosParqueados,
    vehiculosCount,
    getVehiculos,
    validateUser,
    asignarParqueoAutomatico,
    createUser,
    asignarParqueoManual,
    asignarParqueoUsuario,
    obtenerEspaciosDisponibles,    
    getUserByVehiculePlate,
    updatePenalty,
    removePenalty,
    registrarSalida
}
