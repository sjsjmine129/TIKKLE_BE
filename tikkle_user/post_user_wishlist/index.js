const { queryDatabase } = require("db.js");

exports.post_user_wishlist = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  const productId = body.productId;

  //-------- get product data & check --------------------------------------------------------------------------------------//

  let sqlResult;

  const insertQuery = `
	INSERT INTO user_wish_list (user_id, product_id) 
	SELECT ?, p.id
	FROM products p 
	WHERE p.id = ? AND p.is_deleted = 0`;

  const values = [id, productId];

  try {
    const rows = await queryDatabase(insertQuery, values);
    sqlResult = rows;
    //console.log("SQL result : ", sqlResult.insertId);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_user_wishlist : 🐞 ${err}`);
    const return_body = {
      success: false,
      detail_code: "01",
      message: "SQL error : while insert into user_wish_list",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  // console.log("result : ", sqlResult);
  const retData = sqlResult;

  if (sqlResult.affectedRows === 0) {
    // console.log("post_user_wishlist 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "02",
      message: "deleted product or already exist in wishlist",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //-------- add wishlist_count  --------------------------------------------------------------------------------------//

  try {
    const rows = await queryDatabase("UPDATE products SET wishlist_count = wishlist_count + ? WHERE id = ?", [1, productId]);

    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_user_wishlist : 🐞 ${err}`);
    const return_body = {
      success: false,
      detail_code: "03",
      message: "SQL error: while update wishlist_count",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    data: retData,
    detail_code: "00",
    message: "success post user wishlist",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
