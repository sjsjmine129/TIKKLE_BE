const { queryDatabase } = require("db.js");

exports.post_user_friend = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  const friendId = body.friendId;

  //-------- is the friendId valid? --------------------------------------------------------------------------------------//

  if (id === friendId) {
    // console.log("post_user_friend 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "00",
      message: "You cannot be friend yourself",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //-------- get friend data & check,   post friend data to DB if there is no friend data --------------------------------------------------------------------------------------//

  const insertQuery = `INSERT INTO friends_relation (central_user_id, friend_user_id, relation_state_id)
	SELECT ?, ?, ?
	WHERE NOT EXISTS (
		SELECT 1
		FROM friends_relation
		WHERE central_user_id = ? AND friend_user_id = ?
	);`;

  const values1 = [id, friendId, 1, id, friendId];
  const values2 = [friendId, id, 2, friendId, id];

  let ret1 = null;
  let ret2 = null;

  try {
    //데이터 없으면 추가
    ret1 = await queryDatabase(insertQuery, values1);

    //데이터 없으면 추가
    ret2 = await queryDatabase(insertQuery, values2);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_user_friend : 🐞 ${err}`);

    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //-------- return result --------------------------------------------------------------------------------------//

  // console.log("ret1 : ", ret1);
  // console.log("ret2 : ", ret2);

  if (ret1.affectedRows !== 1) {
    const return_body = {
      success: true,
      detail_code: "10",
      message: "already friend",
      returnToken: returnToken,
    };
    return res.status(200).send(return_body);
  } else {
    const return_body = {
      success: true,
      detail_code: "11",
      message: "success post user friend",
      returnToken: returnToken,
    };
    return res.status(200).send(return_body);
  }
};
