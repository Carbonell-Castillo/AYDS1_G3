const express = require('express');
const config = require ('./config');

const users = require ('./modules/users/routes.js');

const app = express();
app.use(express.json());

app.set('port',config.appConfig.port);

app.use('/api/users',users);



module.exports = app;

