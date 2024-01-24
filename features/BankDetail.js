const { queryDatabase, queryDatabase_multi } = require("db.js");
const { getSSMParameter } = require("ssm.js");
const crypto = require("crypto");
const { ExpectedError } = require("./ExpectedError.js");

class BankDetail {
  constructor({ bank_code, bank_name, account, db }) {
    this.bank_code = bank_code || null;
    this.bank_name = bank_name || null;
    this.account = account || null;
    this.db = db || null;
  }

  async validateBankData() {}

  async encryptAccount() {
    try {
      const algorithm = "aes-256-cbc"; // Use the same algorithm that was used for encryption
      const accountkeyHex = await getSSMParameter("accountkeyHex");
      const accountivHex = await getSSMParameter("accountivHex");

      const key = Buffer.from(accountkeyHex, "hex");
      const iv = Buffer.from(accountivHex, "hex");
      const cipher = crypto.createCipheriv(algorithm, key, iv);

      let encryptedAccount = cipher.update(this.account, "utf-8", "hex");
      encryptedAccount += cipher.final("hex");
      this.account = encryptedAccount;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = { BankDetail };
