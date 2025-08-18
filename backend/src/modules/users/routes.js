const express = require('express');
const generiResponse = require('../../common/generic-response');
const router = express.Router();


router.get("/",function (req,res){
    generiResponse.success(req,res,'mensaje de la respuesta correcta o body',200);
});

module.exports = router;