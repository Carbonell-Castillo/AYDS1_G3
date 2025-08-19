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

module.exports = router;