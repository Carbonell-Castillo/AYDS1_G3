const express = require('express');
const generiResponse = require('../../common/generic-response');
const controller = require('./multa-controller');
const router = express.Router();

/*
router.get("/",function (req,res){
    const usersList = controller.getUsers()
    .then((records) => {
        generiResponse.success(req,res, records,200);
    })
});*/

router.post("/registrar",function (req,res){
    console.log(req.body);
    const usersList = controller.createPenalty(req.body)
    .then((records) => {
        generiResponse.success(req,res, records,200);
    })
});

router.put("/:id", function (req, res) {
    const id = req.params.id;

    controller.updatePenalty(id,req.body)
    .then((result) => {
        generiResponse.success(req, res, result, 200);
    })
    .catch((error) => {
        generiResponse.error(req, res, error, 500);
    });
});

router.delete("/:id", function (req, res) {
    const id = req.params.id;

    controller.removePenalty(id)
    .then((result) => {
        generiResponse.success(req, res, result, 200);
    })
    .catch((error) => {
        generiResponse.error(req, res, error, 500);
    });
});

/*
router.put("/registrar",function (req,res){
    let usuario = req.body.dpi ? req.body.dpi:req.body.email;
    console.log(req.body);
    console.log(usuario);
    const usersList = controller.validateUser(usuario,req.body.password)
    .then((records) => {
        generiResponse.success(req,res, records,200);
    })
});

router.delete("/registrar",function (req,res){
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

*/

module.exports = router;