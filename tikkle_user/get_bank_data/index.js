const { queryDatabase } = require("db.js");

exports.get_bank_data = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  //-------- get bank data --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase("select * from bank", []);
    sqlResult = rows;
    // console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ get_bank_data : 🐞 ${err}`);
    const return_body = {
      success: false,
      detail_code: "01",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  // check data is one
  if (sqlResult.length === 0) {
    console.error(`🚨 error -> ⚡️ get_bank_data : 🐞 bankdata db조회 실패`);
    const return_body = {
      success: false,
      detail_code: "01",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    data: sqlResult,
    detail_code: "00",
    message: "success get bank info",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
