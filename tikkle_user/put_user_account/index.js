const { queryDatabase } = require("db.js");
const crypto = require("crypto");
const { getSSMParameter } = require("ssm.js");

exports.put_user_account = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  const bank_code = body.bank_code;
  const account = body.account;

  //-------- check account --------------------------------------------------------------------------------------//

  //check productId
  if (
    !bank_code ||
    !account ||
    typeof bank_code !== "number" || // Check if bank_code is a number
    !Number.isInteger(bank_code) ||
    typeof account !== "string"
  ) {
    console.log("put_user_account의 입력 데이터에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "00",
      message: "input value is null or invalid",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //-------- encrypt account --------------------------------------------------------------------------------------//
  const algorithm = "aes-256-cbc"; // Use the same algorithm that was used for encryption
  const accountkeyHex = await getSSMParameter("accountkeyHex");
  const accountivHex = await getSSMParameter("accountivHex");

  const key = Buffer.from(accountkeyHex, "hex");
  const iv = Buffer.from(accountivHex, "hex");
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  // console.log("key : ", key);
  // console.log("iv : ", iv);

  let encryptedAccount = cipher.update(account, "utf-8", "hex");
  encryptedAccount += cipher.final("hex");

  //console.log("Encrypted Data:", encryptedAccount);

  //--------  update account  --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase(
      `	UPDATE users
				SET	bank_code = ?,	account = ?
				WHERE	id = ?
			`,
      [bank_code, encryptedAccount, id]
    );

    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ put_user_account : 🐞 ${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    detail_code: "00",
    message: "success to update account info",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
