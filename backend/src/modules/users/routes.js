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

module.exports = router;