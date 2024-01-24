const { queryDatabase } = require("db.js");

exports.delete_user_wishlist = async (req, res) => {
  const body = req.body;
  const productId = body.productid;

  const id = req.id;
  const returnToken = req.returnToken;

  //-------- delete data from DB --------------------------------------------------------------------------------------//
  let sqlResult = null;

  const deleteQuery = `
    	DELETE FROM user_wish_list 
    	WHERE user_id = ? AND product_id = ?
		`;

  const values = [id, productId];

  try {
    const rows = await queryDatabase(deleteQuery, values);
    sqlResult = rows;
  } catch (err) {
    console.error(`🚨 error -> ⚡️ delete_user_whishlist : 🐞 ${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "Database post error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  // console.log("result : ", sqlResult);

  const retData = sqlResult;

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    data: retData,
    detail_code: "00",
    message: "success delete user wishlist",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
