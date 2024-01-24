const { queryDatabase } = require("db.js");

exports.put_user_address = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  const zonecode = body.zonecode;
  const address = body.address;
  const detail_address = body.detail_address;

  //-------- check address --------------------------------------------------------------------------------------//

  //check productId
  if (
    !zonecode ||
    !address ||
    !detail_address ||
    typeof zonecode !== "string" ||
    typeof address !== "string" ||
    typeof detail_address !== "string" ||
    zonecode.length !== 5 ||
    address.length > 250 ||
    detail_address.length > 250
  ) {
    console.log("put_user_addressd의 입력 데이터에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "00",
      message: "address value is null or invalid",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //--------  update address  --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase(
      `	UPDATE users
				SET	zonecode = ?,	address = ?, detail_address = ?
				WHERE	id = ?
			`,
      [zonecode, address, detail_address, id]
    );

    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ put_user_address : 🐞 ${err}`);
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
    detail_code: "00",
    message: "success to update address",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
