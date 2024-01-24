const { queryDatabase } = require("db.js");

exports.post_product_images = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  const productId = body.productId;

  //-------- check DB --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase("select * from product_images where  product_id = ?", [productId]);
    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_product_images : 🐞${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  const urls = [];

  for (let i = 0; i < sqlResult.length; i++) {
    urls.push(sqlResult[i].product_picture);
  }

  //console.log("urls : ", urls);

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    data: urls,
    detail_code: "00",
    message: "success get product images",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
