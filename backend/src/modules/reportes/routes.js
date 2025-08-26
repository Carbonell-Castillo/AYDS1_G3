const express = require('express');
const genericResponse = require('../../common/generic-response');
const controller = require('./reportes-controller');
const router = express.Router();

// ya existía
router.get("/ocupacion", (req, res) => {
  const { periodo = 'diaria', desde } = req.query;
  controller.getOcupacion(periodo, desde)
    .then(result => genericResponse.success(req, res, result, 200))
    .catch(error => genericResponse.error(req, res, error, 500));
});

// NUEVOS
router.get("/sanciones", (req, res) => {
  const { q, desde, hasta, rol } = req.query;
  controller.getSanciones({ q, desde, hasta, rol })
    .then(result => genericResponse.success(req, res, result, 200))
    .catch(error => genericResponse.error(req, res, error, 500));
});

router.get("/movimientos", (req, res) => {
  const { q, desde, hasta } = req.query;
  controller.getMovimientos({ q, desde, hasta })
    .then(result => genericResponse.success(req, res, result, 200))
    .catch(error => genericResponse.error(req, res, error, 500));
});

router.get("/pagos-usuarios", (req, res) => {
  const { desde, hasta, q } = req.query;
  controller.getPagosUsuarios({ desde, hasta, q })
    .then(result => genericResponse.success(req, res, result, 200))
    .catch(error => genericResponse.error(req, res, error, 500));
});

// opcional KPI
router.get("/recaudo", (req, res) => {
  const { mes } = req.query; // 'YYYY-MM'
  controller.getRecaudoMensual(mes)
    .then(result => genericResponse.success(req, res, { total: result }, 200))
    .catch(error => genericResponse.error(req, res, error, 500));
});

router.get("/sanciones/:placa", (req, res) => {
    const params = req.params.placa;

    controller.getSanciones(params)
        .then((result) => {
            genericResponse.success(req, res, result, 200);
        })
        .catch((error) => {
            genericResponse.error(req, res, error, 500);
        });
});

module.exports = router;
