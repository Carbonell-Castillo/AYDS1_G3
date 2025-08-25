const express = require('express');
const genericResponse = require('../../common/generic-response');
const controller = require('./parqueo-controller');
const router = express.Router();

router.post('/asignar-automatico', (req, res) => {
    const body = req.body;

    controller.asignarParqueoAutomatico(body)
        .then((result) => {
            genericResponse.success(req, res, result, 200);
        })
        .catch((error) => {
            console.log(error);
            genericResponse.error(req, res, error, 500);
        });
});

module.exports = router;
