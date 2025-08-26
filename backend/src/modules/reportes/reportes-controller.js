const db = require('../../common/db-generic-query');

async function getOcupacion(periodo = 'diaria', desde) {
  if (periodo === 'semanal') return db.reporteOcupacionSemanal(desde);
  return db.reporteOcupacionDiaria(desde);
}

async function getSanciones({ q, desde, hasta, rol }) {
  return db.reporteSanciones({ q, desde, hasta, rol });
}

async function getMovimientos({ q, desde, hasta }) {
  return db.reporteMovimientos({ q, desde, hasta });
}

async function getPagosUsuarios({ desde, hasta, q }) {
  return db.reportePagosUsuarios({ desde, hasta, q });
}

async function getRecaudoMensual(mes) {
  return db.reporteRecaudoMensual(mes); // number
}

module.exports = {
  getOcupacion,
  getSanciones,
  getMovimientos,
  getPagosUsuarios,
  getRecaudoMensual
};
