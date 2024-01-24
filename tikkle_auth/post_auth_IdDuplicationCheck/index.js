const { queryDatabase } = require("db.js");

exports.post_auth_IdDuplicationCheck = async (req, res) => {
  const body = req.body;
  const inputId = body.inputId;

  //---- check id format ----//

  if (!inputId || typeof inputId !== "string" || inputId.length > 12 || inputId.length < 5) {
    //return invalid
    console.log("post_auth_IdDuplicationCheck 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "00",
      message: "inputId value is null or invalid: input data again",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //---- check DB there is nick or not ----//

  let sqlResult;

  try {
    const rows = await queryDatabase("select * from users where nick = ?", [inputId]);
    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.log("post_auth_IdDuplicationCheck 에서 에러가 발생했습니다 : ", err);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "Database connection error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //---- return result ----//

  if (sqlResult.length === 0) {
    //no duplication
    const return_body = {
      success: true,
      detail_code: "10",
      message: "No duplication",
      returnToken: null,
    };
    return res.status(200).send(return_body);
  } else {
    //duplication
    const return_body = {
      success: true,
      detail_code: "11",
      message: "Duplicate ID",
      returnToken: null,
    };
    return res.status(200).send(return_body);
  }
};
