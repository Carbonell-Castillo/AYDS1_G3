const db = require('../../common/db-generic-query');
const { error } = require('../../common/generic-response');
const utilities = require('../../utilities/utils');

const createPenalty = async (reqParams) => {

    try {

        
            return await db.getUserByVehiculePlate(reqParams.placa)
            .then( async (result) => {
                let selectedUser = '';
                result.forEach((element, index) => {
                    selectedUser = element.usuario;
                });

                const fecha_hora_ingreso = utilities.formatDate(new Date());
                return db.insertRecord('multa_sancion', {
                            id_parqueo            : 'ayds1s22025P1',
                            usuario               : selectedUser,
                            placa_vehiculo        : reqParams.placa,
                            monto                 : reqParams.monto,
                            descripcion           : reqParams.motivo,
                            id_tipo_multa         : 1,
                            path_imagen_video     : reqParams.evidencia,
                            fecha                 : fecha_hora_ingreso,
                            pagada                : 0,
                            anulada               : 0,
                            descripcion_anulacion : ''})
                .then( (result) =>
                    {
                        return {
                            mensaje: "Multa creada satisfactoriamente"
                        };  
                    }
                )
                .catch ( (error) =>
                    {
                       console.log(error);
                       throw error; 
                    }
                )
                                                 
            })
            .catch((error) => {
                console.log(error);
                throw error;
            });

    } catch (error) {
        console.log(error);
        throw error;
    }
};

const updatePenalty = async (id,body) => {
    try {
        const result = await db.updatePenalty(body.monto,body.motivo,id);
        if(result.affectedRows != 0)
            return {
                mensaje: "Multa Actualizada correctamente",
                idMulta: id
            };
        else
            return {
                mensaje: "La multa no existe",
                idMulta: id
            };
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const removePenalty = async (id) => {
    try {
        const result = await db.removePenalty(id);
        if(result.affectedRows != 0)
            return {
                mensaje: "Multa anulada correctamente",
                idMulta: id
            };
        else
            return {
                mensaje: "La multa no existe",
                idMulta: id
            };
    } catch (error) {
        console.log(error);
        throw error;
    }
};


module.exports = {
    createPenalty,
    updatePenalty,
    removePenalty
};