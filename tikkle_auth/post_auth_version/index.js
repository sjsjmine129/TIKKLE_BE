const { queryDatabase } = require("db.js");
const { getSSMParameter } = require("ssm.js");

exports.post_auth_version = async (req, res) => {
  const body = req.body;
  const os = body.os;
  const version = body.version;

  //---- check inspection_time ----//
  let inspection;
  try {
    inspection = await getSSMParameter("inspection_time");
  } catch (err) {
    console.log("get_notification_list 에서 에러가 발생했습니다.", err);
    const return_body = {
      success: false,
      detail_code: "01",
      message: "SSM error : check parameter error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //---- check DB  ----//
  let sqlResult;

  try {
    const rows = await queryDatabase(
      `	SELECT *
        FROM invalid_version 
        WHERE os = ? AND version = ?
			`,
      [os, version]
    );
    sqlResult = rows;
  } catch (err) {
    console.log("get_notification_list 에서 에러가 발생했습니다.", err);
    const return_body = {
      success: false,
      detail_code: "01",
      message: "SQL error : check DB error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  const retData = sqlResult;

  //---- return result ----//

  if (retData.length > 0) {
    const return_body = {
      success: true,
      data: {
        inspection_time: inspection,
      },
      detail_code: "10",
      message: "이 앱 버전은 더 이상 지원되지 않습니다.",
      returnToken: null,
    };
    return res.status(201).send(return_body);
  }

  const return_body = {
    success: true,
    data: {
      inspection_time: inspection,
    },
    detail_code: "00",
    message: "이 앱 버전은 지원됩니다.",
    returnToken: null,
  };
  return res.status(200).send(return_body);
};
