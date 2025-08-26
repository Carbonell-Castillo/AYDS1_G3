const mysql = require('mysql2');
const config = require('../config');
const utilities = require('../utilities/utils');

const dbConfig = {
    host: config.mysqlConfig.host,
    user: config.mysqlConfig.user,
    password: config.mysqlConfig.password,
    database: config.mysqlConfig.database
}

let connection;

function connMysql(){
    connection = mysql.createConnection(dbConfig);

    connection.connect((err) => {
        if(err){
            console.log('[db err]',err);
            setTimeout(connMysql, 200);
        }else{
            console.log('La base de datos fue conectada correctamente');
        }
    });

    connection.on('error', err => {
        console.log('[db err]',err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST'){
            connMysql();
        }else{
            throw err;
        }
    });

}
connMysql();

function selectAll(table){
    return new Promise( (resolve,reject) => {
        connection.query(`SELECT * FROM ${table}`,(error,result) => {
            if(error) return reject(error);
            resolve(result);
        })
    });
}


function validateUser(usuario, password) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT usuario, nombre, apellido, correo_electronico, dpi, id_parqueo
      FROM usuario
      WHERE (usuario = ? OR dpi = ? OR correo_electronico = ?) AND password = ? 
      LIMIT 1
    `;
    connection.query(sql, [usuario, usuario, usuario, password], (error, result) => {
      if (error) return reject(error);
      resolve(result[0] || null); 
    });
  });
}


function penaltiesByUser(usuario){
    return new Promise( (resolve,reject) => {
        let q =`SELECT id_multa_sancion, descripcion  FROM multa_sancion where usuario ='${usuario}' AND pagada=0 AND anulada=0`;
        connection.query(q,(error,result) => {
            if(error) return reject(error);
            resolve(result);
        })
    });
}


function getUserByVehiculePlate(plate){
    return new Promise( (resolve,reject) => {
        let q =`SELECT * FROM usuario_vehiculo where  placa_vehiculo ='${plate}' LIMIT 1`;
        console.log(q);
        connection.query(q,(error,result) => {
            if(error) return reject(error);
            resolve(result);
        })
    });
}

function getUserByDpi(dpi){
    return new Promise( (resolve,reject) => {
        let q =`SELECT * FROM usuario where  dpi ='${dpi}' LIMIT 1`;
        console.log(q);
        connection.query(q,(error,result) => {
            if(error) return reject(error);
            resolve(result);
        })
    });
}


async function createUser(table,record)
{

    return insertRecord(table,record);
}



function selectRecord(table, where){
    return new Promise( (resolve,reject) => {
        connection.query(`SELECT * FROM ${table} WHERE ?`, where, (error,result) => {
            if(error) return reject(error);
            resolve(result[0]);
        })
    });
}

function insertRecord(table,record){
    return new Promise( (resolve,reject) => {
        connection.query(`INSERT INTO ${table} SET ?`, [record], (error,result) => {
            if(error) return reject(error);
            resolve(result);
        })
    });
}

function updatePenalty(monto,motivo,id){

    return new Promise( (resolve,reject) => {
        connection.query(`
                UPDATE multa_sancion
                SET monto = ${monto},
                descripcion = '${motivo}'
                WHERE id_multa_sancion = ${id} AND anulada =0;`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            })
    });


}

function removePenalty(id){

    return new Promise( (resolve,reject) => {
        connection.query(`
                UPDATE multa_sancion
                SET anulada = 1
                WHERE id_multa_sancion = ${id} AND anulada =0;`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            })
    });


}

function removeRecord(table,id){

}

async function totalInvertido(table, where) {
    const [tiempo] = await new Promise((resolve, reject) => {
        connection.query(`SELECT TIMESTAMPDIFF(HOUR, i.fecha_hora_ingreso, i.fecha_hora_salida) AS tiempo FROM ${table} i WHERE i.usuario = '${where.usuario}';`, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
    const precioQuery = `
    SELECT
        tc.precio
    FROM ingreso i
        INNER JOIN espacio esp
            ON i.id_espacio = esp.id_espacio
        INNER JOIN tipo_cobro tc
            ON esp.tipo_cobro_id = tc.tipo_cobro_id
    WHERE i.usuario = '${where.usuario}';`
    const [precio] = await new Promise((resolve, reject) => {
        connection.query(precioQuery, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
    return {
        "dpi": where.usuario,
        "totalInvertido": Number(precio.precio) * tiempo.tiempo
    };
}

function vehiculosParqueados(table, where) {
    return new Promise((resolve, reject) => {
        connection.query(`
            SELECT
                v.placa,
                v.modelo,
                esp.etiqueta AS ubicacion
            FROM vehiculo v
                    INNER JOIN usuario_vehiculo uv
                                ON v.placa = uv.placa_vehiculo
                    INNER JOIN espacio esp
                    INNER JOIN ingreso i
                                ON esp.id_espacio = i.id_espacio
            WHERE uv.usuario = '${where.usuario}' AND esp.ocupado = 1;`, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
}

function vehiculosCount(table, where) {
    return new Promise((resolve, reject) => {
        connection.query(`
            SELECT COUNT(*) AS count
            FROM ${table}
            WHERE usuario = '${where.usuario}';`, (error, result) => {
            if (error) return reject(error);
            resolve(result[0].count);
        });
    });
}

function vehiculosUsuario(table, where) {
    return new Promise((resolve, reject) => {
        connection.query(`
             SELECT
                v.placa,
                v.marca,
                v.modelo,
                v.tipo_vehiculo_id
            FROM vehiculo v
                    INNER JOIN usuario_vehiculo uv
                                ON v.placa = uv.placa_vehiculo
            WHERE uv.usuario = '${where.usuario}';`, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
}

function getVehiculos(table, where) {
    return new Promise((resolve, reject) => {
        connection.query(`
            SELECT
                v.placa,
                tv.nombre AS tipo,
                v.marca
            FROM vehiculo v
                    INNER JOIN tipo_vehiculo tv
                                ON v.tipo_vehiculo_id = tv.tipo_vehiculo_id
                    INNER JOIN usuario_vehiculo uv
                                ON v.placa = uv.placa_vehiculo
            WHERE uv.usuario = '${where.usuario}';`, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
}


async function obtenerConfiguracionParqueoId(id) {
    try {
        const result = await new Promise((resolve, reject) => {
            connection.query(`
                SELECT * from parqueo where id_parqueo = '${id}'`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function asignarParqueoAutomatico(usuario, placa) {
    try {
        const parqueosLibres = await new Promise((resolve, reject) => {
            connection.query(`
                SELECT id_espacio, id_parqueo
                FROM espacio
                WHERE ocupado = 0
                LIMIT 1;`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });
        
        if (parqueosLibres.length === 0) {
            throw new Error("No hay espacios de parqueo disponibles");
        }

        const fecha_hora_ingreso = utilities.formatDate(new Date());
        insertRecord('ingreso', {
            id_parqueo: parqueosLibres[0].id_parqueo,
            id_espacio: parqueosLibres[0].id_espacio,
            usuario: usuario,
            placa: placa,
            fecha_hora_ingreso: fecha_hora_ingreso
        });

        await new Promise((resolve, reject) => {
            connection.query(`
                UPDATE espacio
                SET ocupado = 1
                WHERE id_espacio = ${parqueosLibres[0].id_espacio};`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });

        return {
            id_parqueo: parqueosLibres[0].id_parqueo,
            id_espacio: parqueosLibres[0].id_espacio,
            fecha_hora_ingreso: fecha_hora_ingreso
        }

    } catch (error) {
        throw error;
    }
}

async function asignarParqueoManual(usuario, placa, idParqueo, idEspacio) {
    try {
        const espacio = await new Promise((resolve, reject) => {
            connection.query(`
                SELECT id_espacio, id_parqueo
                FROM espacio
                WHERE id_espacio = ${idEspacio} AND ocupado = 0;`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });
        
        if (espacio.length === 0) {
            throw new Error("El espacio de parqueo no está disponible");
        }

        const fecha_hora_ingreso = utilities.formatDate(new Date());
        insertRecord('ingreso', {
            id_parqueo: idParqueo,
            id_espacio: idEspacio,
            usuario: usuario,
            placa: placa,
            fecha_hora_ingreso: fecha_hora_ingreso
        });

        await new Promise((resolve, reject) => {
            connection.query(`
                UPDATE espacio
                SET ocupado = 1
                WHERE id_espacio = ${idEspacio};`, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });

        return {
            id_parqueo: idParqueo,
            id_espacio: idEspacio,
            fecha_hora_ingreso: fecha_hora_ingreso
        }

    } catch (error) {
        throw error;
    }  
}

async function asignarParqueoUsuario(usuario, idParqueo) {
    try {
        const insertar = await insertRecord('usuario_parqueo', {
            usuario: usuario,
            id_parqueo: idParqueo
        });

        if (insertar) {
            return {
                mensaje: "Usuario asignado al parqueo correctamente",
                usuario: usuario,
                idParqueo: idParqueo
            };
        } else {
            throw new Error("No se pudo asignar el usuario al parqueo");
        }
    } catch (error) {
        throw error;
    }
}

async function obtenerEspaciosDisponibles() {
    try {
        const espaciosDisponibles = await new Promise((resolve, reject) => {
            connection.query(`
                SELECT
                    e.id_parqueo AS idParqueo,
                    p.nombre AS nombre,
                    COUNT(*) AS espaciosDisponibles
                FROM espacio e
                INNER JOIN parqueo p ON e.id_parqueo = p.id_parqueo
                WHERE ocupado = 0
                GROUP BY e.id_parqueo, p.nombre;`, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });
        });
        return {
            parqueosDisponibles: espaciosDisponibles
        }
    } catch (error) {
        throw error;
    }
}

async function obtenerListadoEspaciosDisponibles() {
    try {
        const espaciosDisponibles = await new Promise((resolve, reject) => {
            connection.query(`
                SELECT
                    e.id_espacio AS idEspacio,
                    e.id_parqueo AS idParqueo,
                    p.nombre AS nombreParqueo,
                    e.etiqueta AS ubicacion,
                    tc.nombre AS tipoCobro,
                    tc.precio AS precio
                FROM espacio e
                INNER JOIN parqueo p ON e.id_parqueo = p.id_parqueo
                INNER JOIN tipo_cobro tc ON e.tipo_cobro_id = tc.tipo_cobro_id
                WHERE e.ocupado = 0
                ORDER BY e.id_parqueo, e.etiqueta;`, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });
        });
        return {
            espaciosDisponibles: espaciosDisponibles
        }
    } catch (error) {
        throw error;
    }
}

async function obtenerListadoEspaciosOcupados(){
    try {
        const espaciosOcupados = await new Promise((resolve, reject) => {
            connection.query(`
                  SELECT
                    e.id_espacio AS idEspacio,
                    p.nombre AS nombreParqueo,
                    e.etiqueta AS ubicacion,
                    e.tipo_vehiculo_id
                FROM espacio e
                INNER JOIN parqueo p ON e.id_parqueo = p.id_parqueo
                WHERE e.ocupado = 1;`, (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                });
        });
        return {
            espaciosOcupados: espaciosOcupados
        }
    } catch (error) {
        throw error;
    }
}

function multasByDpi(dpi) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        ms.id_multa_sancion,
        ms.usuario,
        ms.placa_vehiculo,
        ms.descripcion,
        ms.monto,
        ms.id_tipo_multa,
        tm.descripcion AS tipo_descripcion,
        tm.monto_sugerido,
        ms.fecha,
        ms.pagada,
        ms.anulada,
        ms.descripcion_anulacion
      FROM multa_sancion ms
      INNER JOIN tipo_multa tm ON tm.id_tipo_multa = ms.id_tipo_multa
      WHERE ms.usuario = ?
      ORDER BY ms.fecha DESC
    `;
    connection.query(sql, [dpi], (err, res) => err ? reject(err) : resolve(res));
  });
}


function multasTotalByDpi(dpi) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COALESCE(SUM(ms.monto), 0) AS totalMultas
      FROM multa_sancion ms
      WHERE ms.usuario = ? AND ms.anulada = 0
    `;
    connection.query(sql, [dpi], (err, res) => err ? reject(err) : resolve(res[0].totalMultas));
  });
}


function vehiculosConMultaByDpi(dpi) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT DISTINCT ms.placa_vehiculo AS placa
      FROM multa_sancion ms
      WHERE ms.usuario = ? AND ms.anulada = 0
      ORDER BY ms.placa_vehiculo
    `;
    connection.query(sql, [dpi], (err, res) => err ? reject(err) : resolve(res));
  });
}


function pagarMulta(idMulta) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE multa_sancion
      SET pagada = 1
      WHERE id_multa_sancion = ? AND anulada = 0
    `;
    connection.query(sql, [idMulta], (err, res) => err ? reject(err) : resolve({ updated: res.affectedRows }));
  });
}


function apelarMulta(idMulta, comentario) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE multa_sancion
      SET anulada = 0, descripcion_anulacion = ?
      WHERE id_multa_sancion = ?
    `;
    connection.query(sql, [comentario, idMulta], (err, res) => err ? reject(err) : resolve({ updated: res.affectedRows }));
  });
}




function existeVehiculo(placa) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT placa FROM vehiculo WHERE placa = ? LIMIT 1`;
    connection.query(sql, [placa], (err, res) => err ? reject(err) : resolve(!!res.length));
  });
}

function crearVehiculo({ placa, tipo_vehiculo_id, marca, modelo, color, linea }) {
    console.log('Crear vehículo:', { placa, tipo_vehiculo_id, marca, modelo, color, linea });
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO vehiculo (placa, tipo_vehiculo_id, marca, modelo, color, linea)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    connection.query(sql, [placa, tipo_vehiculo_id, marca, modelo, color || null, linea || null], (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

function vincularUsuarioVehiculo(usuario, placa) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT IGNORE INTO usuario_vehiculo (usuario, placa_vehiculo) VALUES (?, ?)`;
    connection.query(sql, [usuario, placa], (err, res) => err ? reject(err) : resolve(res));
  });
}

function desvincularUsuarioVehiculo(usuario, placa) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM usuario_vehiculo WHERE usuario = ? AND placa_vehiculo = ?`;
    connection.query(sql, [usuario, placa], (err, res) => err ? reject(err) : resolve({ deleted: res.affectedRows }));
  });
}

async function registrarVehiculoUsuario({ usuario, placa, tipo_vehiculo_id, marca, modelo, linea, color }) {
  
  const user = await selectRecord('usuario', { usuario });
  if (!user) throw new Error('Usuario no existe');

  
  const yaExiste = await existeVehiculo(placa);
  if (!yaExiste) {
    await crearVehiculo({ placa, tipo_vehiculo_id, marca, modelo, color, linea });
  }

  
  await vincularUsuarioVehiculo(usuario, placa);

  return {
    mensaje: 'Vehículo registrado y vinculado correctamente',
    usuario,
    vehiculo: { placa, tipo_vehiculo_id, marca, modelo, color: color || null }
  };
}


async function cerrarIngreso(usuario, placa) {
  
  const sql = `
    SELECT 
      i.id_ingreso,
      i.id_espacio,
      i.fecha_hora_ingreso,
      e.id_parqueo,
      e.etiqueta AS ubicacion,
      tc.precio,
      mt.equivalente_en_minutos,
      tc.nombre AS tipo_cobro
    FROM ingreso i
    INNER JOIN espacio e     ON e.id_espacio = i.id_espacio
    INNER JOIN tipo_cobro tc ON e.tipo_cobro_id = tc.tipo_cobro_id
    INNER JOIN medida_tiempo mt ON tc.medida_tiempo_id = mt.medida_tiempo_id
    WHERE i.usuario = ? AND i.placa = ? AND i.fecha_hora_salida IS NULL
    ORDER BY i.fecha_hora_ingreso DESC
    LIMIT 1
  `;
  const [row] = await new Promise((resolve, reject) => {
    connection.query(sql, [usuario, placa], (err, res) => err ? reject(err) : resolve(res));
  });
  if (!row) throw new Error('No existe ingreso abierto para ese usuario/placa');

  
  const ingreso = new Date(row.fecha_hora_ingreso);
  const salida = new Date(); 
  const minutos = Math.max(0, Math.floor((salida.getTime() - ingreso.getTime()) / 60000));
  const unidades = row.equivalente_en_minutos > 0 ? (minutos / row.equivalente_en_minutos) : 0;
  const total = Number((unidades * Number(row.precio)).toFixed(2));

  
  await new Promise((resolve, reject) => {
    connection.query(`UPDATE ingreso SET fecha_hora_salida = NOW() WHERE id_ingreso = ?`, [row.id_ingreso],
      (err) => err ? reject(err) : resolve(true)
    );
  });
  await new Promise((resolve, reject) => {
    connection.query(`UPDATE espacio SET ocupado = 0 WHERE id_espacio = ?`, [row.id_espacio],
      (err) => err ? reject(err) : resolve(true)
    );
  });

  return {
    mensaje: 'Salida registrada correctamente',
    usuario,
    placa,
    id_parqueo: row.id_parqueo,
    id_espacio: row.id_espacio,
    ubicacion: row.ubicacion,
    fecha_hora_ingreso: row.fecha_hora_ingreso,
    fecha_hora_salida: salida.toISOString().slice(0,19).replace('T',' '),
    minutos,
    tipo_cobro: row.tipo_cobro,
    precio_unitario: Number(row.precio),
    equivalente_en_minutos: row.equivalente_en_minutos,
    total
  };
}




function reporteOcupacionDiaria(desde) {
  
  
  const sql = `
    WITH fechas AS (
      SELECT DATE_SUB(CURDATE(), INTERVAL 13 DAY) AS d
      UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL 12 DAY)
      UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL 11 DAY)
      UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL 10 DAY)
      UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL  9 DAY)
      UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL  8 DAY)
      UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL  7 DAY)
      UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL  6 DAY)
      UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL  5 DAY)
      UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL  4 DAY)
      UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL  3 DAY)
      UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL  2 DAY)
      UNION ALL SELECT DATE_SUB(CURDATE(), INTERVAL  1 DAY)
      UNION ALL SELECT CURDATE()
    )
    SELECT 
      DATE(f.d) AS fecha,
      LEAST(100, ROUND(COALESCE(cnt.c,0) * 100.0 / GREATEST(1,(SELECT COUNT(*) FROM espacio)), 0)) AS porcentaje
    FROM fechas f
    LEFT JOIN (
      SELECT DATE(fecha_hora_ingreso) AS d, COUNT(*) AS c
      FROM ingreso
      GROUP BY DATE(fecha_hora_ingreso)
    ) cnt ON cnt.d = f.d
    ORDER BY fecha;
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [], (err, res) => err ? reject(err) : resolve(
      res.map(r => ({ fecha: r.fecha.toISOString().slice(0,10), porcentaje: Number(r.porcentaje) }))
    ));
  });
}

function reporteOcupacionSemanal(desde) {
  const sql = `
    SELECT 
      CONCAT(YEARWEEK(fecha_hora_ingreso, 1)) AS semana,
      LEAST(100, ROUND(COUNT(*) * 100.0 / GREATEST(1,(SELECT COUNT(*) FROM espacio)), 0)) AS porcentaje
    FROM ingreso
    GROUP BY YEARWEEK(fecha_hora_ingreso, 1)
    ORDER BY semana DESC
    LIMIT 8;
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [], (err, res) => err ? reject(err) : resolve(
      res.reverse().map(r => ({ fecha: String(r.semana), porcentaje: Number(r.porcentaje) }))
    ));
  });
}


function reporteSanciones({ q, desde, hasta, rol }) {
  const params = [];
  let where = '1=1';
  if (q) { where += ' AND (ms.placa_vehiculo LIKE ? OR ms.descripcion LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (desde) { where += ' AND DATE(ms.fecha) >= ?'; params.push(desde); }
  if (hasta) { where += ' AND DATE(ms.fecha) <= ?'; params.push(hasta); }

  const sql = `
    SELECT
      ms.id_multa_sancion AS id,
      DATE(ms.fecha) AS fecha,
      ms.placa_vehiculo AS placa,
      tm.descripcion AS tipo,
      ms.descripcion AS motivo,
      ms.pagada, ms.anulada
    FROM multa_sancion ms
    INNER JOIN tipo_multa tm ON tm.id_tipo_multa = ms.id_tipo_multa
    WHERE ${where}
    ORDER BY ms.fecha DESC, ms.id_multa_sancion DESC
    LIMIT 1000;
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, res) => {
      if (err) return reject(err);
      const rows = res.map(r => ({
        id: r.id,
        fecha: r.fecha.toISOString().slice(0,10),
        placa: r.placa,
        tipo: r.tipo,
        motivo: r.motivo,
        rol: 'Usuario', 
        estado: r.anulada ? 'Anulada' : (r.pagada ? 'Pagada' : 'Pendiente')
      }));
      resolve(rows);
    });
  });
}


function reporteMovimientos({ q, desde, hasta }) {
  const params = [];
  let where = '1=1';
  if (q) { where += ' AND (i.placa LIKE ?)'; params.push(`%${q}%`); }
  if (desde) { where += ' AND DATE(i.fecha_hora_ingreso) >= ?'; params.push(desde); }
  if (hasta) { where += ' AND (DATE(i.fecha_hora_ingreso) <= ? OR DATE(i.fecha_hora_salida) <= ?)'; params.push(hasta, hasta); }

  const sql = `
    SELECT id_evento, fecha, placa, evento, CONCAT(p.nombre, ' · ', e.etiqueta) AS parqueo
    FROM (
      SELECT 
        i.id_ingreso*2    AS id_evento,
        i.fecha_hora_ingreso AS fecha,
        i.placa AS placa,
        'Entrada' AS evento,
        i.id_espacio
      FROM ingreso i
      UNION ALL
      SELECT 
        i.id_ingreso*2+1 AS id_evento,
        i.fecha_hora_salida AS fecha,
        i.placa AS placa,
        'Salida' AS evento,
        i.id_espacio
      FROM ingreso i
      WHERE i.fecha_hora_salida IS NOT NULL
    ) ev
    INNER JOIN espacio e ON e.id_espacio = ev.id_espacio
    INNER JOIN parqueo p ON p.id_parqueo = e.id_parqueo
    WHERE ${where} AND ev.fecha IS NOT NULL
    ORDER BY fecha DESC
    LIMIT 1000;
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, res) => {
      if (err) return reject(err);
      resolve(res.map(r => ({
        id: r.id_evento,
        fecha: r.fecha,    
        placa: r.placa,
        evento: r.evento,
        parqueo: r.parqueo
      })));
    });
  });
}


function reportePagosUsuarios({ desde, hasta, q }) {
  const params = [];
  let where = '1=1';
  if (desde) { where += ' AND DATE(ms.fecha) >= ?'; params.push(desde); }
  if (hasta) { where += ' AND DATE(ms.fecha) <= ?'; params.push(hasta); }
  if (q) { where += ' AND (u.dpi LIKE ? OR u.nombre LIKE ? OR u.apellido LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }

  const sql = `
    SELECT 
      u.usuario,
      u.dpi,
      CONCAT(u.nombre, ' ', u.apellido) AS nombre,
      COUNT(*) AS multas,
      SUM(CASE WHEN ms.pagada=1 THEN 1 ELSE 0 END) AS pagadas,
      SUM(CASE WHEN ms.pagada=0 AND ms.anulada=0 THEN 1 ELSE 0 END) AS pendientes,
      COALESCE(SUM(ms.monto), 0) AS total
    FROM multa_sancion ms
    INNER JOIN usuario u ON u.usuario = ms.usuario
    WHERE ${where}
    GROUP BY u.usuario, u.dpi, u.nombre, u.apellido
    ORDER BY total DESC
    LIMIT 1000;
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, res) => {
      if (err) return reject(err);
      resolve(res.map(r => ({
        usuario: r.nombre,
        dpi: r.dpi,
        multas: Number(r.multas),
        pagadas: Number(r.pagadas),
        pendientes: Number(r.pendientes),
        total: Number(r.total)
      })));
    });
  });
}



function reporteRecaudoMensual(mes) { 
  if (!mes) {
    const now = new Date();
    mes = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  }
  const sql = `
    SELECT COALESCE(SUM(
      (TIMESTAMPDIFF(MINUTE, i.fecha_hora_ingreso, i.fecha_hora_salida) / NULLIF(mt.equivalente_en_minutos,0)) * tc.precio
    ), 0) AS total
    FROM ingreso i
    INNER JOIN espacio e       ON e.id_espacio = i.id_espacio
    INNER JOIN tipo_cobro tc   ON e.tipo_cobro_id = tc.tipo_cobro_id
    INNER JOIN medida_tiempo mt ON mt.medida_tiempo_id = tc.medida_tiempo_id
    WHERE i.fecha_hora_salida IS NOT NULL
      AND DATE_FORMAT(i.fecha_hora_salida, '%Y-%m') = ?;
  `;
  return new Promise((resolve, reject) => {
    connection.query(sql, [mes], (err, res) => err ? reject(err) : resolve(Number(res[0].total || 0)));
  });
}










module.exports ={
  selectAll,
  selectRecord,
  insertRecord,
  removeRecord,
  totalInvertido,
  vehiculosParqueados,
  vehiculosCount,
  getVehiculos,
  validateUser,
  asignarParqueoAutomatico,
  createUser,
  asignarParqueoManual,
  asignarParqueoUsuario,
  obtenerEspaciosDisponibles,
  multasByDpi,
  multasTotalByDpi,
  vehiculosConMultaByDpi,
  pagarMulta,
  apelarMulta,
    registrarVehiculoUsuario,
  desvincularUsuarioVehiculo,
  cerrarIngreso,
  existeVehiculo,
  crearVehiculo,
  vincularUsuarioVehiculo,
  vehiculosUsuario,
  obtenerListadoEspaciosOcupados,
  obtenerListadoEspaciosDisponibles,
  obtenerConfiguracionParqueoId,
  reporteOcupacionDiaria, 
  reporteOcupacionSemanal,
  reporteSanciones,
  reporteMovimientos,
  reportePagosUsuarios,
  reporteRecaudoMensual
};

