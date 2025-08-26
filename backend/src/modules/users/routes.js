const express = require('express');
const generiResponse = require('../../common/generic-response');
const controller = require('./user-controller');
const router = express.Router();


router.get("/",function (req,res){
    const usersList = controller.getUsers()
    .then((records) => {
        generiResponse.success(req,res, records,200);
    })
});

router.post("/auth/login",function (req,res){
    let usuario = req.body.dpi ? req.body.dpi:req.body.email;
    console.log(req.body);
    console.log(usuario);
    const usersList = controller.validateUser(usuario,req.body.password)
    .then((records) => {
        generiResponse.success(req,res, records,200);
    })
});

router.post('/', (req, res) => {
    const body = req.body;

    controller.createUser(body)
        .then((result) => {
            generiResponse.success(req, res, result, 200);
        })
        .catch((error) => {
            console.log(error);
            generiResponse.error(req, res, error, 500);
        });
});



router.get("/:dpi/total-invertido", function (req, res) {
    const dpi = req.params.dpi;

    const totalInvertido = controller.getTotalInvertido(dpi)
    .then((result) => {
        generiResponse.success(req, res, result, 200);
    })
    .catch((error) => {
        generiResponse.error(req, res, error, 500);
    });
});

router.get("/:dpi/vehiculos/parqueo", function (req, res) {
    const dpi = req.params.dpi;

    const vehiculosParqueados = controller.getVehiculosParqueados(dpi)
    .then((result) => {
        generiResponse.success(req, res, result, 200);
    })
    .catch((error) => {
        generiResponse.error(req, res, error, 500);
    });
});

router.get("/:dpi/vehiculos/count", function (req, res) {
    const dpi = req.params.dpi;

    const vehiculosCount = controller.getVehiculosCount(dpi)
    .then((result) => {
        generiResponse.success(req, res, result, 200);
    })
    .catch((error) => {
        generiResponse.error(req, res, error, 500);
    });
});

router.get("/:dpi/vehiculos", function (req, res) {
    const dpi = req.params.dpi;

    const vehiculos = controller.getVehiculos(dpi)
    .then((result) => {
        generiResponse.success(req, res, result, 200);
    })
    .catch((error) => {
        generiResponse.error(req, res, error, 500);
    });
});

router.get("/:dpi/pagos", function (req, res) {
    const dpi = req.params.dpi;

    const pagos = controller.getPagos(dpi)
    .then((result) => {
        generiResponse.success(req, res, result, 200);
    })
    .catch((error) => {
        generiResponse.error(req, res, error, 500);
    });
});

module.exports = router;