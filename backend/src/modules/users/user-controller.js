const db = require('../../common/db-generic-query');

function getUsers()
{
    return db.selectAll('usuario');

}


module.exports = {
    getUsers


}