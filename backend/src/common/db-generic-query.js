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
        let q =`SELECT COUNT(usuario) as exist FROM usuario where usuario ='${usuario}' and password='${password}'`;
        console.log(q);
        connection.query(q,(error,result) => {
            if(error) return reject(error);
            resolve(result);
        })
    });
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

function updateRecord(table,record){

}

function removeRecord(table,id){

}

async function totalInvertido(table, where) {
    const [tiempo] = await new Promise((resolve, reject) => {
        connection.query(`SELECT TIMESTAMPDIFF(HOUR, i.fecha_hora_ingreso, i.fecha_hora_salida) AS tiempo FROM ${table} i WHERE i.usuario = '${where.usuario}';`, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
    const precioQuery = `
    SELECT
        tc.precio
    FROM ingreso i
        INNER JOIN espacio esp
            ON i.id_espacio = esp.id_espacio
        INNER JOIN tipo_cobro tc
            ON esp.tipo_cobro_id = tc.tipo_cobro_id
    WHERE i.usuario = '${where.usuario}';`
    const [precio] = await new Promise((resolve, reject) => {
        connection.query(precioQuery, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
    return {
        "dpi": where.usuario,
        "totalInvertido": Number(precio.precio) * tiempo.tiempo
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

module.exports ={
    selectAll,
    selectRecord,
    insertRecord,
    updateRecord,
    removeRecord,
    totalInvertido,
    vehiculosParqueados,
    vehiculosCount,
    getVehiculos,
    validateUser,
    asignarParqueoAutomatico,
    asignarParqueoManual
}