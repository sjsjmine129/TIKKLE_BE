const { queryDatabase } = require("db.js");
const crypto = require("crypto");
const { getSSMParameter } = require("ssm.js");

exports.get_user_deleteUser = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  //-------- change delete state in 1  --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase(
      `	UPDATE users
				SET	 is_deleted = ?
				WHERE	id = ?
			`,
      [1, id]
    );

    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ get_user_deleteUser : 🐞 ${err}`);
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
    data: null,
    detail_code: "00",
    message: "success to delete user",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
