const mysql = require("mysql2/promise");
const { getDatabaseCredentials } = require("db.js");

class DBManager {
  /**
   * @description 트랜잭션을 열고, connection을 반환한다.
   * @returns {Promise<Connection>}
   * @memberof DBManager
   * @example
   * const db = new DBManager();
   * await db.openTransaction();
   * try {
   * const result = await db.executeQuery(sql, params);
   * await db.commitTransaction();
   * }
   * catch(err) {
   * await db.rollbackTransaction();
   * }
   */
  async openTransaction() {
    const credentials = await getDatabaseCredentials();
    console.log(credentials);
    this.connection = await mysql.createConnection(credentials);
    await this.connection.beginTransaction();
  }
  /**
   * @description 쿼리를 실행한다.
   * @returns {Promise<Connection>}
   * @memberof DBManager
   * @example
   * const db = new DBManager();
   * await db.openTransaction();
   * try {
   * const result = await db.executeQuery(sql, params);
   * await db.commitTransaction();
   * }
   * catch(err) {
   * await db.rollbackTransaction();
   * }
   */
  async executeQuery(sql, params) {
    const [rows] = await this.connection.execute(sql, params);
    return rows;
  }
  /**
   * @description 트랜잭션을 커밋하고, connection을 종료한다.
   * @returns {Promise<Connection>}
   * @memberof DBManager
   * @example
   * const db = new DBManager();
   * await db.openTransaction();
   * try {
   * const result = await db.executeQuery(sql, params);
   * await db.commitTransaction();
   * }
   * catch(err) {
   * await db.rollbackTransaction();
   * }
   */
  async commitTransaction() {
    console.log("commit");
    await this.connection.commit();
    await this.connection.end();
  }
  /**
   * @description 트랜잭션을 롤백하고, connection을 종료한다.
   * @returns {Promise<Connection>}
   * @memberof DBManager
   * @example
   * const db = new DBManager();
   * await db.openTransaction();
   * try {
   * const result = await db.executeQuery(sql, params);
   * await db.commitTransaction();
   * }
   * catch(err) {
   * await db.rollbackTransaction();
   * }
   */
  async rollbackTransaction() {
    await this.connection.rollback();
    await this.connection.end();
  }
}

module.exports = { DBManager };
