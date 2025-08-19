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

function selectRecord(table){

}

function insertRecord(table,record){

}

function updateRecord(table,record){

}

function removeRecord(table,id){

}

module.exports ={
    selectAll,
    selectRecord,
    insertRecord,
    updateRecord,
    removeRecord
}