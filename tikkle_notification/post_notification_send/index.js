const { queryDatabase } = require("db.js");
const { fcm_send, fcm_send_many } = require("fcm.js");

exports.post_notification_send = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  let receive_user_id = body.receive_user_id;
  const notification_type_id = body.notification_type_id;
  const tikkling_id = body.tikkling_id;
  let title = "알림";

  //-------- get user data from DB --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase("select * from users where id = ?", [id]);
    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.log("post_notification_send 에서 에러가 발생했습니다.", err);
    const return_body = {
      success: false,
      detail_code: "02",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  // check data is one
  if (sqlResult.length !== 1) {
    console.log("post_notification_send 에서 에러가 발생했습니다.", err);
    const return_body = {
      success: false,
      detail_code: "02",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  const name = sqlResult[0].name;
  const profile = sqlResult[0].image;
  //console.log("name : ", name);

  //-------- check notification_type_id and make message --------------------------------------------------------------------------------------//
  const meta_data = profile;

  let message;
  let deep_link;
  let link;
  let source_user_id;

  if (notification_type_id === 1) {
    message = name + "님이 가입했어요.";
    title = "새로운 친구";
    link = "link_for_1";
    deep_link = "tikkle://notification";
    source_user_id = id;
    //
  } else if (notification_type_id === 3) {
    message = name + "님의 티클링이 시작되었어요.";
    title = "✨ 티클링 시작";
    link = "link_for_3";
    source_user_id = id;
    deep_link = "tikkle://tikklingDetail/" + tikkling_id.toString();
    //
  } else if (notification_type_id === 5) {
    message = name + "님이 보낸 티클을 확인해보세요.";
    if (receive_user_id == id) {
      message = "직접 구매한 티클을 확인해보세요.";
    }
    title = "🎁 티클 선물";
    link = "link_for_5";
    deep_link = "tikkle://tikklingDetail/" + tikkling_id.toString();
    source_user_id = id;
    //
  } else if (notification_type_id === 6) {
    message = "티클링 상품 교환이 완료되었어요.";
    link = "link_for_6";
    title = "📦 배송 시작";
    deep_link = "tikkle://main";
    source_user_id = id;
    receive_user_id = id;
    //
  } else if (notification_type_id === 8) {
    message = name + "님이 티클을 환불했어요.";
    title = "환불된 티클";
    link = "dlink_for_8";
    deep_link = "tikkle://tikklingDetail/" + receive_user_id.toString();
    source_user_id = id;

    //receive_user_id 대신 tikkling id 가오는 상황이라 쿼리로 바꿔줌
    let sqlResult_tikkling;

    try {
      const rows = await queryDatabase("select user_id from tikkling where id = ?", [receive_user_id]);
      sqlResult_tikkling = rows;
      //console.log("SQL result : ", sqlResult_tikkling);
    } catch (err) {
      console.log("post_notification_send 에서 에러가 발생했습니다.", err);
      const return_body = {
        success: false,
        detail_code: "02",
        message: "SQL error",
        returnToken: null,
      };
      return res.status(500).send(return_body);
    }

    receive_user_id = sqlResult_tikkling[0].user_id;

    if (receive_user_id == id) {
      message = "직접 구매하신 티클의 환불이 완료되었어요.";
    }
    //
  } else if (notification_type_id === 9) {
    message = "티클링 환급 신청이 완료되었어요.";
    title = "💵 환급 신청 완료";
    deep_link = "tikkle://notification";
    link = "link_for_9";
    source_user_id = id;
    receive_user_id = id;
  } else {
  }

  //-------- get friend ID from DB or set receive user ID --------------------------------------------------------------------------------------//
  let receiver;

  if (notification_type_id === 1 && receive_user_id === null) {
    try {
      const rows = await queryDatabase(
        `
			SELECT friend_user_id  
			FROM friends_relation 
			WHERE central_user_id = ? 
				AND relation_state_id = 2
			`,
        [id]
      );
      receiver = rows;
      // console.log("SQL result : ", receiver);
    } catch (err) {
      console.log("post_notification_send 에서 에러가 발생했습니다.", err);
      const return_body = {
        success: false,
        detail_code: "02",
        message: "SQL error",
        returnToken: null,
      };
      return res.status(500).send(return_body);
    }
  } else if (notification_type_id === 3) {
    try {
      const rows = await queryDatabase(
        `
			SELECT friend_user_id  
			FROM friends_relation 
			WHERE central_user_id = ? 
				AND relation_state_id <> 3
			`,
        [id]
      );
      receiver = rows;
      // console.log("SQL result : ", receiver);
    } catch (err) {
      console.log("post_notification_send 에서 에러가 발생했습니다.", err);
      const return_body = {
        success: false,
        detail_code: "02",
        message: "SQL error",
        returnToken: null,
      };
      return res.status(500).send(return_body);
    }
  } else if ((notification_type_id === 1 && receive_user_id !== null) || notification_type_id === 5 || notification_type_id === 6 || notification_type_id === 8 || notification_type_id === 9) {
    receiver = [];
    const a = { friend_user_id: receive_user_id };
    receiver.push(a);
  }

  //console.log("reciver : ", receiver);

  //-------- add notification data to DB --------------------------------------------------------------------------------------//

  if (receiver.length > 0) {
    let notificationValues = "";
    for (let i = 0; i < receiver.length; i++) {
      notificationValues += "(";
      notificationValues += `${receiver[i].friend_user_id},`;
      notificationValues += `'${message}', `;
      notificationValues += `0, `;
      notificationValues += `0, `;
      notificationValues += `${notification_type_id}, `;
      notificationValues += `'${deep_link}', `;
      notificationValues += `'${link}', `;
      notificationValues += `'${meta_data}', `;
      notificationValues += `${source_user_id} `;
      notificationValues += ")";
      if (i < receiver.length - 1) notificationValues += ", ";
    }

    console.log("notification : ", notificationValues);

    await queryDatabase(
      `INSERT INTO notification
			(user_id, message, is_deleted, is_read, notification_type_id, deep_link, link, meta_data, source_user_id) 
			VALUES ${notificationValues}`
    );
  }

  //-------- send notification by FCM --------------------------------------------------------------------------------------//

  if (!(notification_type_id == 1 && receive_user_id === null) && notification_type_id !== 3) {
    //resiver 1명
    let token_sqlResult;

    try {
      const rows = await queryDatabase("select * from users where id = ?", [receive_user_id]);
      token_sqlResult = rows;
      //console.log("SQL result : ", token_sqlResult);
    } catch (err) {
      console.log("post_notification_send token확인 에서 에러가 발생했습니다.", err);
      const return_body = {
        success: false,
        detail_code: "02",
        message: "SQL error",
        returnToken: null,
      };
      return res.status(500).send(return_body);
    }

    // check data is one
    if (token_sqlResult.length !== 1) {
      console.log("post_notification_send token확인 에서 에러가 발생했습니다.", err);
      const return_body = {
        success: false,
        detail_code: "02",
        message: "SQL error",
        returnToken: null,
      };
      return res.status(500).send(return_body);
    }

    const device_token = token_sqlResult[0].device_token;

    //send notification
    await fcm_send(device_token, "알림", message, deep_link);
  } else if (notification_type_id === 3) {
    //resiver 여러명
    const device_tokens = [];

    try {
      const temp_token = await queryDatabase(
        `
			SELECT users.device_token
			FROM friends_relation
			LEFT JOIN users ON users.id = friends_relation.friend_user_id
			WHERE central_user_id = ? 
				AND relation_state_id <> 3
			`,
        [id]
      );

      for (let i = 0; i < temp_token.length; i++) {
        if (temp_token[i].device_token !== null) {
          device_tokens.push(temp_token[i].device_token);
        }
      }
    } catch (err) {
      console.log("post_notification_send 에서 에러가 발생했습니다.", err);
      const return_body = {
        success: false,
        detail_code: "02",
        message: "SQL error",
        returnToken: null,
      };
      return res.status(500).send(return_body);
    }

    //알림 보내기
    if (device_tokens.length > 0) {
      // console.log("@@@SQL result : ", device_tokens);
      console.log("@@@ : ", deep_link);
      await fcm_send_many(device_tokens, title, message, deep_link);
    }
  } else {
  } //일단 1인 경우는 알림 x

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    detail_code: "00",
    message: "send notification success!",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
