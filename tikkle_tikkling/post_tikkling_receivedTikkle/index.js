const { queryDatabase } = require("db.js");

exports.post_tikkling_receivedTikkle = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  //main logic------------------------------------------------------------------------------------------------------------------//

  try {
    const tikkling_id = req.body ? req.body.tikkling_id : null;
    const parsedId = parseInt(tikkling_id, 10);
    if (isNaN(parsedId)) {
      const return_body = {
        success: false,
        detail_code: "00",
        message: "잘못된 요청, tikkling_id는 숫자여야 합니다.",
        returnToken: null,
      };
      return res.status(400).send(return_body);
    }
    const rows = await queryDatabase(
      `SELECT sending_tikkle.*,
			users.id,
			users.NAME,
			users.image
			FROM   sending_tikkle
			INNER JOIN users ON sending_tikkle.user_id = users.id
			WHERE  sending_tikkle.tikkling_id = ? AND sending_tikkle.state_id in (1, 2, 3, 4); `,
      [body.tikkling_id]
    );
    const return_body = {
      success: true,
      data: rows,
      detail_code: "00",
      message: "특정 티클링의 받은 티클 정보 조회 성공",
      returnToken,
    };
    return res.status(200).send(return_body);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_tikkling_receivedTikkle : 🐞${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      returnToken: null,
      message: "서버 에러",
    };
    return res.status(500).send(return_body);
  }
};
