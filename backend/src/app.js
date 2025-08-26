const express = require("express");
const path = require("path");
const cors = require("cors");
const config = require("./config");

const users = require("./modules/users/routes.js");
const parqueo = require("./modules/parqueo/routes.js");
const multas = require("./modules/multas/routes.js");
const reportes = require("./modules/reportes/routes.js");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:4200" })); // Angular dev
app.set("port", config.appConfig.port);

app.use("/api/usuarios", users);
app.use("/api/parqueo", parqueo);
app.use("/api/multas", multas);
app.use("/api/reportes", reportes);

module.exports = app;
