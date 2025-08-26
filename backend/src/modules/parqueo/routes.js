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

router.post('/asignar', (req, res) => {
    const body = req.body;

    controller.asignarParqueoManual(body)
        .then((result) => {
            genericResponse.success(req, res, result, 200);
        })
        .catch((error) => {
            console.log(error);
            genericResponse.error(req, res, error, 500);
        });
});

router.post('/asignar-usuario', (req, res) => {
   const body = req.body;
   
   controller.asignarParqueoUsuario(body)
       .then((result) => {
           genericResponse.success(req, res, result, 200);
       })
       .catch((error) => {
           console.log(error);
           genericResponse.error(req, res, error, 500);
       });
});

router.get('/disponibles', (req, res) => {
    controller.obtenerEspaciosDisponibles()
        .then((result) => {
            genericResponse.success(req, res, result, 200);
        })
        .catch((error) => {
            console.log(error);
            genericResponse.error(req, res, error, 500);
        });
});


router.get('/configuracion/:id', (req, res) => {
    const { id } = req.params;
    controller.obtenerConfiguracionParqueoId(id)
        .then((result) => {
            genericResponse.success(req, res, result, 200);
        })
        .catch((error) => {
            console.log(error);
            genericResponse.error(req, res, error, 500);
        });
});

router.get('/ocupados', (req, res) => {
    controller.obtenerListadoEspaciosOcupados()
        .then((result) => {
            genericResponse.success(req, res, result, 200);
        })
        .catch((error) => {
            console.log(error);
            genericResponse.error(req, res, error, 500);
        });
});


router.post('/salida', (req, res) => {
  const body = req.body;
  controller.registrarSalida(body)
    .then((result) => genericResponse.success(req, res, result, 200))
    .catch((error) => genericResponse.error(req, res, error.message || error, 500));
});


module.exports = router;
