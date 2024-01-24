const { queryDatabase } = require("db.js");
const crypto = require("crypto");
const { getSSMParameter } = require("ssm.js");

exports.get_user_info = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  let sqlResult;

  try {
    const rows = await queryDatabase("select * from users where id = ?", [id]);
    sqlResult = rows;
    console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.log("get_user_info 에서 에러가 발생했습니다.", err);
    const return_body = {
      success: false,
      detail_code: "01",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  // check data is one
  if (sqlResult.length !== 1) {
    console.error(`🚨 error -> ⚡️ get_user_info : 🐞 ${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  // console.log("sqlResult : ", sqlResult);
  //-------- decode account --------------------------------------------------------------------------------------//
  if (sqlResult[0].account !== null) {
    const encryptedData = sqlResult[0].account;
    const algorithm = "aes-256-cbc"; // Use the same algorithm that was used for encryption

    const accountkeyHex = await getSSMParameter("accountkeyHex");
    const accountivHex = await getSSMParameter("accountivHex");

    const iv = Buffer.from(accountivHex, "hex");
    const key = Buffer.from(accountkeyHex, "hex");

    // Decryption
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decryptedData = decipher.update(encryptedData, "hex", "utf-8");
    decryptedData += decipher.final("utf-8");

    sqlResult[0].account = decryptedData;
  }

  // //--------  bank_code --------------------------------------------------------------------------------------//

  if (sqlResult[0].bank_code !== null) {
    const bank_code = sqlResult[0].bank_code;

    const bank_name = await queryDatabase("select * from bank where  bank_code = ?", [bank_code]);

    sqlResult[0].bank_name = bank_name[0].bank_name;
  } else {
    sqlResult[0].bank_name = null;
  }

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    data: sqlResult[0],
    detail_code: "00",
    message: "success get user info",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
