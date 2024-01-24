const { getSSMParameter } = require("ssm.js");
const crypto = require("crypto");
const { ExpectedError } = require("./ExpectedError.js");

class Refund {
  constructor({ id, tikkling_id, bank_code, account, created_at, state_id, expected_refund_amount, actual_refund_amount, refund_date, db }) {
    this.id = id || null;
    this.tikkling_id = tikkling_id || null;
    this.bank_code = bank_code || null;
    this.account = account || null;
    this.created_at = created_at || null;
    this.state_id = state_id || null;
    this.expected_refund_amount = expected_refund_amount || null;
    this.actual_refund_amount = actual_refund_amount || null;
    this.refund_date = refund_date || null;
    this.db = db || null;
  }

  async saveRefund() {
    try {
      const result = await this.db.executeQuery(`INSERT INTO refund (tikkling_id, bank_code, account, expected_refund_amount) VALUES (?, ?, ?, ?)`, [
        this.tikkling_id,
        this.bank_code,
        this.account,
        this.expected_refund_amount,
      ]);
      this.id = result.insertId;
    } catch (error) {
      throw error;
    }
  }

  async loadDataByTikklingId() {
    try {
      const rows = await this.db.executeQuery(`SELECT * FROM refund WHERE tikkling_id = ?`, [this.tikkling_id]);
      if (rows.length === 0) {
        throw new ExpectedError({
          status: 404,
          detail_code: "01",
          message: "해당 티클링에 대한 환불 정보를 찾을 수 없습니다.",
        });
      }
      const refund = rows[0];
      this.id = refund.id;
      this.tikkling_id = refund.tikkling_id;
      this.bank_code = refund.bank_code;
      this.account = refund.account;
      this.created_at = refund.created_at;
      this.state_id = refund.state_id;
      this.expected_refund_amount = refund.expected_refund_amount;
      this.actual_refund_amount = refund.actual_refund_amount;
      this.refund_date = refund.refund_date;

      return;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ loadDataByTikklingId : 🐞${error}`);
      throw error;
    }
  }
}

module.exports = { Refund };
