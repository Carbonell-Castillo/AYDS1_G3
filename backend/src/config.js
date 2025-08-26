require('dotenv').config();

module.exports = {
    appConfig: {
        port: process.env.PORT
    },
    mysqlConfig:{
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB
    }
}