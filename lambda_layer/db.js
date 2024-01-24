const mysql = require("mysql2/promise");
const { getSSMParameter } = require("ssm.js");

async function getDatabaseCredentials() {
  const host = "61.109.238.126";
  const user = "HeungkyuLee";
  const password = "GpRYnSzxuv59";
  const database = "tikkle_db_dev";
  return { host, user, password, database, multipleStatements: true};
}

async function queryDatabase_multi(sql, params) {
  let connection;
  try {
    const credentials = await getDatabaseCredentials();
    connection = await mysql.createConnection(credentials);
    const [rows] = await connection.query(sql, params);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

async function queryDatabase(sql, params) {
  let connection;
  try {
    const credentials = await getDatabaseCredentials();
    connection = await mysql.createConnection(credentials);
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

exports.queryDatabase_multi = queryDatabase_multi;
exports.queryDatabase = queryDatabase;
exports.getDatabaseCredentials = getDatabaseCredentials;