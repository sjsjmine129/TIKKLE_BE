const { queryDatabase } = require("db.js");

exports.get_tikkling_friendinfo = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  //main logic------------------------------------------------------------------------------------------------------------------//

  try {
    const rows = await queryDatabase(
      `SELECT 
      atv.*, 
      u.id AS user_id, 
      u.name AS user_name, 
      u.birthday, 
      u.nick, 
      u.phone, 
      u.gender, 
      u.image AS friend_image, 
      u.address, 
      u.detail_address, 
      u.is_tikkling 
      FROM tikkling_detail_view atv
      JOIN users u ON atv.user_id = u.id
      WHERE atv.state_id = 1 and u.id IN (
      SELECT fr.friend_user_id 
      FROM friends_relation fr 
      WHERE fr.central_user_id = ? AND fr.relation_state_id IN (1, 2));`,
      [id]
    );

    const return_body = {
      success: true,
      data: rows,
      detail_code: "00",
      message: "친구의 티클링 정보 조회 성공",
      returnToken,
    };
    return res.status(200).send(return_body);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_tikkling_friendinfo : 🐞${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "서버 에러",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }
};
