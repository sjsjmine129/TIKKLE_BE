const { queryDatabase } = require("db.js");

exports.post_product_id = async (req, res) => {
  const id = req.id;
  const returnToken = req.returnToken;
  const { p_name } = req.body;

  //main logic------------------------------------------------------------------------------------------------------------------//
  //-------- check DB --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase(
      // 고시정보 데이터 추가하기(인덱스)
      ` SELECT p.id
        FROM products p
        WHERE p.name = ? ;
    `,
      [p_name]
    );
    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.log("post_product_id 에서 에러가 발생했습니다.", err);
    const return_body = {
      success: false,
      detail_code: "00",
      data: err,
      message: "SQL error 1 ",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  // check data is one
  if (sqlResult.length !== 1) {
    console.log(" post_product_id 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "00",
      data: sqlResult,
      p_name: p_name,
      message: "SQL error 2 ",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  const ret = sqlResult[0];

  const return_body = {
    success: true,
    data: ret,
    detail_code: "00",
    p_name: p_name,
    message: "success get product info",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
