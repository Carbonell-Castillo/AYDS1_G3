const express = require('express');
const genericResponse = require('../../common/generic-response');
const controller = require('./reportes-controller');
const router = express.Router();

router.get("/ocupacion", (req, res) => {
    const periodo = req.query.periodo; // 'diario', 'semanal', 'mensual'

    controller.getOcupacion(periodo)
        .then(result => genericResponse.success(req, res, result, 200))
        .catch(error => genericResponse.error(req, res, error, 500));
});

module.exports = router;

