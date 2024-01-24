const { queryDatabase } = require("db.js");

exports.put_product_viewIncrease = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  const productId = body.productId;

  //-------- check input --------------------------------------------------------------------------------------//

  //check productId
  if (!productId || typeof productId !== "number" || !Number.isInteger(productId)) {
    // console.log("put_product_viewIncrease 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "00",
      message: "productId value is null or invalid",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //-------- increase view  --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase("UPDATE products SET  views =  views + ? WHERE id = ?", [1, productId]);

    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ put_product_viewIncrease : 🐞${err}`);
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
    data: sqlResult,
    detail_code: "00",
    message: "success increase product view",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
