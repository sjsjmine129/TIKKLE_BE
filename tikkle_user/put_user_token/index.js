const { queryDatabase } = require("db.js");
const crypto = require("crypto");
const { getSSMParameter } = require("ssm.js");

exports.put_user_token = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  const token = body.token;

  //-------- check account --------------------------------------------------------------------------------------//

  //check productId
  if (!token || typeof token !== "string") {
    console.log("put_user_token의 입력 데이터에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "00",
      message: "input value is null or invalid",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //--------  update token  --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase(
      `	UPDATE users
				SET	device_token = ?
				WHERE	id = ?
			`,
      [token, id]
    );

    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ put_user_token : 🐞 ${err}`);
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
    message: "success to update token info",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
