const { queryDatabase } = require("db.js");

exports.put_friend_block = async (req, res) => {
  //재설정하고자 하는 친구의 user_id

  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  //main logic------------------------------------------------------------------------------------------------------------------//
  //TODO: 로직 분리
  try {
    const target_friend_id = body.friend_id;
    const blocked = body.blocked;

    //이미 차단한 친구라면 차단을 해제, 아니라면 차단
    let result;
    if (blocked) {
      result = await queryDatabase(
        `UPDATE friends_relation
         SET relation_state_id = 1
         WHERE central_user_id = ? and friend_user_id = ?`,
        [id, target_friend_id]
      );
    } else {
      result = await queryDatabase(
        `UPDATE friends_relation 
         SET relation_state_id = 3
         WHERE central_user_id = ? and friend_user_id = ?`,
        [id, target_friend_id]
      );
    }

    //해당 친구가 존재하지 않음
    if (result.affectRows == 0) {
      console.log("비정상적 요청-put_friend_block: 해당 친구가 존재하지 않습니다.");
      const return_body = {
        success: false,
        detail_code: "00",
        message: "비정상적 요청, 해당 친구가 존재하지 않습니다.",
        returnToken,
      };
      return res.status(404).send(return_body);
    }

    const return_body = {
      success: true,
      detail_code: "00",
      message: "친구 차단 혹은 해제 성공",
      returnToken,
    };
    return res.status(200).send(return_body);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_friend_block : 🐞${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "서버 에러",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }
};
