const { queryDatabase } = require("db.js");

exports.get_user_paymentHistory = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  //-------- check DB --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase(
      `	SELECT st.id AS sending_id, st.created_at AS send_at, st.message, st.quantity AS send_quantity, st.merchant_uid AS merchant_uid,
								st.tikkling_id, t.type AS tikkling_type ,t.funding_limit, t.created_at AS tikkling_created_at , t.tikkle_quantity, t.terminated_at AS tikkling_terminated_at,
								sts.id AS tikkle_state_id , sts.name AS tikkle_state_name,
								t.state_id, ts.name AS state_name,
								t.product_id, p.name AS product_name, p.price AS product_price, p.thumbnail_image AS product_image,
								st.user_id AS receiver_id, u.name AS user_name, u.nick AS user_nick, u.image AS user_image, b.brand_name
				FROM sending_tikkle as st
				INNER JOIN tikkling as t ON st.tikkling_id = t.id
				INNER JOIN tikkling_state as ts ON t.state_id = ts.id
				INNER JOIN products as p ON t.product_id = p.id
				INNER JOIN brands as b ON p.brand_id = b.id
				INNER JOIN users as u ON t.user_id = u.id
				INNER JOIN sending_tikkle_state as sts ON st.state_id = sts.id
				WHERE st.user_id = ? and st.state_id != 5 and st.state_id != 6
				ORDER BY st.created_at DESC
			`,
      [id]
    );
    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ get_user_paymentHistory : 🐞 ${err}`);
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
    message: "success get user paymentHistory",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
