const { queryDatabase } = require("db.js");

exports.get_friend_data = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  //main logic------------------------------------------------------------------------------------------------------------------//

  try {
    //차단된 친구 목록
    let rows;
    let message;
    let detail_code;
    if (req.params.mode === "block") {
      rows = await queryDatabase(
        `SELECT u.id, u.name, u.image, u.nick, fr.relation_state_id 
        FROM users u 
        INNER JOIN friends_relation fr ON u.id = fr.friend_user_id 
        WHERE fr.relation_state_id = 3 AND fr.central_user_id = ? AND u.is_deleted = 0
        ORDER BY u.name;`,
        [id]
      );
      message = "차단된 친구 목록 조회 성공";
      detail_code = "01";
      //차단되지 않은 친구 목록
    } else if (req.params.mode === "unblock") {
      rows = await queryDatabase(
        `SELECT u.id, u.name, u.image, u.nick, fr.relation_state_id 
        FROM users u 
        INNER JOIN friends_relation fr ON u.id = fr.friend_user_id 
        WHERE fr.relation_state_id != 3 AND fr.central_user_id = ? AND u.is_deleted = 0
        ORDER BY u.name;`,
        [id]
      );
      message = "차단되지 않은 친구 목록 조회 성공";
      detail_code = "02";
      //확인한 친구에 대해 모두 친구로 전환
      await queryDatabase("UPDATE friends_relation SET relation_state_id = 1 WHERE relation_state_id = 2 AND central_user_id = ?", [id]);
    } else {
      // parameter잘못된 mode를 전송
      console.log("비정상적 요청-get_friend_data: 잘못된 mode를 parameter로 전송했습니다.");
      const return_body = {
        success: false,
        detail_code: "00",
        message: "비정상적 요청, 잘못된 유효하지 않은 mode를 parameter로 전송했습니다.",
        returnToken: null,
      };
      return res.status(400).send(return_body);
    }

    const return_body = {
      success: true,
      detail_code,
      message,
      data: rows,
      returnToken,
    };
    return res.status(200).send(return_body);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_friend_data : 🐞${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "서버 에러",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }
};
