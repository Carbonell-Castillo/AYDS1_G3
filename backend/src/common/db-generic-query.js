const mysql = require('mysql2');
const config = require('../config');


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

function selectRecord(table, where){
    return new Promise( (resolve,reject) => {
        connection.query(`SELECT * FROM ${table} WHERE ?`, where, (error,result) => {
            if(error) return reject(error);
            resolve(result[0]);
        })
    });
}

function insertRecord(table,record){

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

module.exports ={
    selectAll,
    selectRecord,
    insertRecord,
    updateRecord,
    removeRecord,
    totalInvertido
}