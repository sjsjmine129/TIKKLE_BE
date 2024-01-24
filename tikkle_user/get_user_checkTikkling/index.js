const { queryDatabase } = require("db.js");

exports.get_user_checkTikkling = async (req, res) => {
  const body = req.body;

  const id = req.id;
  const returnToken = req.returnToken;

  //-------- check DB --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase("SELECT * FROM tikkling WHERE user_id = ? AND terminated_at IS NULL;", [id]);
    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ get_user_checkTikkling : 🐞 ${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //-------- if tikkling --------------------------------------------------------------------------------------//
  if (sqlResult.length !== 0) {
    const return_body = {
      success: true,
      data: sqlResult[0].id,
      detail_code: "10",
      message: "Tikkling",
      returnToken: returnToken,
    };
    return res.status(200).send(return_body);
  }

  //-------- return --------------------------------------------------------------------------------------//
  const return_body = {
    success: true,
    data: 0,
    detail_code: "11",
    message: "Not Tikkling",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
