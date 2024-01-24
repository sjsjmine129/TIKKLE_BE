const { queryDatabase, queryDatabase_multi } = require("db.js");
const { Response } = require("../../features/Response");
const { ExpectedError } = require("../../features/ExpectedError");
const { Tikkling } = require("../../features/Tikkling");
const { Tikkle } = require("../../features/Tikkle");
const { DBManager } = require("../../db");
const { User } = require("../../features/User");
const { send } = require("process");

exports.post_tikkling_sendmessage = async (req, res) => {
  const { body, returnToken } = req;
  const { message, tikkling_id } = body;
  let id = 28;
  //main logic------------------------------------------------------------------------------------------------------------------//
  const db = new DBManager();
  await db.openTransaction();
  let receive_user_id;
  let send_user_id;
  try {
    //티클링 객체 생성
    const tikkling = new Tikkling({ id: tikkling_id, db });
    
    //해당 티클링 락
    await tikkling.lockTikklingForInsertTikkle();
    
    //티클링 정보 가져오기
    await tikkling.loadActiveTikklingViewByTikklingId();

    //티클링 검증
    tikkling.validateSendMessageRequest({ sent_user_id:id });

    //tikkle 객체 생성
    const tikkle = new Tikkle({ tikkling_id, user_id: id, message, quantity: 0, state_id: 7, db });

    //티클 검증
    tikkle.validateSendMessageRequest();
    
    // 메세지 전송
    await tikkle.sendMessage();

    // 티켓 1개 지급
    await tikkle.increaseTikklingTicket();
    receive_user_id = tikkling.user_id;
    send_user_id = tikkle.user_id;
    await db.commitTransaction();

  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_tikkling_sendmessage : 🐞${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "서버 에러",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }
  //-------- send notification --------------------------------------------------------------------------------------//
  // console.log("sned noti ", receive_user_id, tikkling_id, send_user_id);
  try {
    //보내는 사람 정보
    try {
      const rows = await queryDatabase("select * from users where id = ?", [send_user_id]);
      sqlResult = rows;
      //console.log("SQL result : ", sqlResult);
    } catch (err) {
      console.log("post_notification_send 에서 에러가 발생했습니다.", err);
    }

    // check data is one
    if (sqlResult.length !== 1) {
      console.log("post_notification_send 에서 에러가 발생했습니다.", err);
    }

    const name = sqlResult[0].name;

    //DB에 알림 저장
    message = name + "님이 보낸 티클을 확인해보세요.";
    if (send_user_id == receive_user_id) {
      message = "직접 구매한 티클을 확인해보세요.";
    }
    title = "티클 선물 🎁";
    link = "link_for_5";
    deep_link = "tikkle://tikklingDetail/" + tikkling_id.toString();
    source_user_id = send_user_id;

    const notiDB = await queryDatabase(
      `INSERT INTO notification
    (user_id, message, is_deleted, is_read, notification_type_id, deep_link, link, meta_data, source_user_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [receive_user_id, message, 0, 0, 5, deep_link, link, null, source_user_id]
    );
    // console.log("notiDB : ", notiDB);

    ////푸시 알림
    //resiver 1명
    let token_sqlResult;

    try {
      const rows = await queryDatabase("select * from users where id = ?", [receive_user_id]);
      token_sqlResult = rows;
      //console.log("SQL result : ", token_sqlResult);
    } catch (err) {
      console.log("post_notification_send token확인 에서 에러가 발생했습니다.", err);
    }

    // check data is one
    if (token_sqlResult.length !== 1) {
      console.log("post_notification_send token확인 에서 에러가 발생했습니다.", err);
    }

    const device_token = token_sqlResult[0].device_token;

    //send notification

    await fcm_send(device_token, "알림", message, deep_link);
  } catch {}

  return res.status(200).send(Response.create(true, "00", "메세지 데이터 저장 완료"));
};




//알림보내기 로직 구현 요함