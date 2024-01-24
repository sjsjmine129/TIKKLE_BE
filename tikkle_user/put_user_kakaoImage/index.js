const { queryDatabase } = require("db.js");

exports.put_user_kakaoImage = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  const image = body.image;

  //-------- check image --------------------------------------------------------------------------------------//

  if (!image) {
    console.log("put_user_kakaoImage 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "03",
      message: "이미지 없음",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //--------  update image  --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase(
      `	UPDATE users
				SET	image = ?
				WHERE	id = ?
			`,
      [image, id]
    );

    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ put_user_kakaoImage : 🐞 ${err}`);
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
    data: image,
    detail_code: "00",
    message: "success to update image",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
