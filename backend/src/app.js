const express = require("express");
const config = require("./config");

const users = require("./modules/users/routes.js");
const parqueo = require("./modules/parqueo/routes.js");

const app = express();
app.use(express.json());

app.set("port", config.appConfig.port);
app.use(express.json());

app.use("/api/usuarios", users);
app.use("/api/parqueo", parqueo);

module.exports = app;
