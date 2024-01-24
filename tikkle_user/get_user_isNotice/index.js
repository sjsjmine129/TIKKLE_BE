const { queryDatabase } = require("db.js");

exports.get_user_isNotice = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  //-------- check DB --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase(
      `	SELECT *
				FROM notification
				WHERE user_id = ? AND is_read = 0
				ORDER BY created_at DESC;`,
      [id]
    );
    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ get_user_isNotice : 🐞 ${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  const retlen = sqlResult.length;

  //-------- return result --------------------------------------------------------------------------------------//

  if (retlen === 0) {
    const return_body = {
      success: true,
      detail_code: "10",
      message: "No notification!",
      data: { is_notification: false },
      returnToken: returnToken,
    };
    return res.status(200).send(return_body);
  } else {
    const return_body = {
      success: true,
      detail_code: "11",
      message: "There is notification you should read!",
      data: { is_notification: true },
      returnToken: returnToken,
    };
    return res.status(200).send(return_body);
  }
};
