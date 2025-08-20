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

module.exports = {
    getUsers,
    getTotalInvertido

};