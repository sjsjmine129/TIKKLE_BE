const { queryDatabase } = require("db.js");

exports.get_user_endTikklings = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  //-------- check DB --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase(
      `SELECT tikkling.id AS tikkling_id, tikkling.user_id, tikkling.resolution_type AS resolution_type, tikkling.type AS tikkling_type, tikkling.funding_limit, tikkling.created_at, tikkling.tikkle_quantity, tikkling.terminated_at, tikkling.product_id, tikkling.terminated_at,
			tikkling.state_id, tikkling_state.name AS state_name, 
			products.name AS product_name, products.price, products.description, products.views,
			products.is_deleted, products.wishlist_count, products.thumbnail_image, brands.brand_name
			FROM tikkling 
			INNER JOIN tikkling_state ON tikkling.state_id = tikkling_state.id
			INNER JOIN products ON tikkling.product_id = products.id
			INNER JOIN brands ON products.brand_id = brands.id
			WHERE user_id = ?
			ORDER BY tikkling.created_at DESC`,
      [id]
    );
    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ get_user_endTikklings : 🐞 ${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  const retData = sqlResult;

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    data: retData,
    detail_code: "00",
    message: "success get user endTikklings",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
