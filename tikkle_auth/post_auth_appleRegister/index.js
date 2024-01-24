const { queryDatabase } = require("db.js");

exports.post_auth_appleRegister = async (req, res) => {
  const body = req.body;
  const apple_id = body.apple_id;
  const phone = body.phone;

  //---- check DB there is number or not ----//

  let sqlResult;

  try {
    const rows = await queryDatabase("select * from users where phone = ?", [phone]);
    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.log(" post_auth_appleRegister 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "02",
      message: "Database connection error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //---- return result ----//

  if (sqlResult.length != 1) {
    console.log(" post_auth_appleRegister 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "02",
      message: "Database connection error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  } else if (sqlResult[0].apple_id != null) {
    console.log(" post_auth_appleRegister 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "33",
      message: "already registered apple_id",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //----------- update apple_id --------------------------------------//
  let sqlResult_update;

  try {
    const rows = await queryDatabase(
      `	UPDATE users
			SET	apple_id = ?
			WHERE	phone = ?
		`,
      [apple_id, phone]
    );

    sqlResult_update = rows;
  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_auth_appleRegister : 🐞 ${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  const return_body = {
    success: true,
    detail_code: "00",
    message: "update apple id",
    returnToken: null,
  };
  return res.status(200).send(return_body);
};
