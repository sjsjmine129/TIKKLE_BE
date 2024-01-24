const { Tikkling } = require("../../features/Tikkling");
const { Tikkle } = require("../../features/Tikkle");
const { Response } = require("../../features/Response");
const { ExpectedError } = require("../../features/ExpectedError");
const { DBManager } = require("../../db");
const { queryDatabase } = require("db.js");
const { fcm_send, fcm_send_many } = require("fcm.js");
const { InviteEventManager } = require("../../features/InviteEventManager");

exports.post_payment_finalize = async (req, res) => {
  const { body, id, returnToken, params } = req;
  const { tikkleAction } = params;
  const { merchant_uid, imp_uid, status } = body;
  //main logic------------------------------------------------------------------------------------------------------------------//
  const db = new DBManager();
  await db.openTransaction();

  let receive_user_id;
  let tikkling_id;
  let send_user_id;

  try {
    //티클 객체 생성
    const tikkle_info = await Tikkle.getTikkleByMerchantUid({ merchant_uid, db });

    const tikkle = new Tikkle({ ...tikkle_info, db });

    //결제 이전인지 확인
    tikkle.assertTikkleIsNotPaid();

    //티클링 객체 생성
    const tikkling = new Tikkling({ id: tikkle.tikkling_id, db });

    //해당 티클링 락
    await tikkling.lockTikklingForInsertTikkle();
    //티클링 정보 가져오기
    await tikkling.loadActiveTikklingViewByTikklingId();

    //티클링이 티클을 받을 수 있는 상태인지 검사
    if (tikkleAction == "sendtikkle") {
      await tikkling.validateSendTikkleRequest({ tikkle_quantity: tikkle.quantity });
      await tikkling.checkAndUpdateTikklingStateToEnd({ tikkle_quantity: tikkle.quantity });
    } else if (tikkleAction == "buymytikkle") {
      tikkling.validateBuyMyTikkleRequest({ user_id: tikkle.user_id, tikkle_quantity: tikkle.quantity });
    }

    receive_user_id = tikkling.user_id;
    tikkling_id = tikkling.id;
    send_user_id = tikkle.user_id;

    //DB상 결제 완료 처리
    // 보너스티클이 전체 티클 개수를 초과하면 미지급
    // 보너스 티클이 만약 마지막 조각이라면 티클링 (완료)중단처리
    // 나의 티클 결제일경우 미지급
    await tikkle.completeTikklePayment();
    if (tikkleAction == "sendtikkle") {
      if (parseInt(tikkle.quantity) + parseInt(tikkling.tikkle_count) < parseInt(tikkling.tikkle_quantity)) {
        // TODO: event가 끝난 뒤 제거
        const invite_event_manager = new InviteEventManager({ db });
        await invite_event_manager.eventProcessAfterTikkleSent(merchant_uid, tikkling, tikkle);
        // await tikkling.checkAndUpdateTikklingStateToEnd({ tikkle_quantity: tikkle.quantity + 1 });
      }
    }
    //줄 수 있을 때만 제공

    //트랜잭션 종료
    await db.commitTransaction();
  } catch (err) {
    //티클 정보 가져오기
    const tikkle_info = await Tikkle.getTikkleByMerchantUid({ merchant_uid, db });

    //티클 객체 생성
    const tikkle = new Tikkle({ ...tikkle_info, db });

    //확실한 결제 직후의 상태
    if (tikkle.state_id == 5) {
      //포트원 토큰 가져오기
      const port_one_token = await Tikkle.getPortOneApiToken();

      //포트원 환불 api 호출
      await tikkle.callPortOneCancelPaymentAPI({ reason: "buymytikkle 처리중 에러", port_one_token });
    }

    //트랜잭션 롤백
    await db.rollbackTransaction();

    console.error(`🚨 error -> ⚡️ post_payment_finalize/${tikkleAction} : 🐞${err}`);
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 에러"));
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

  return res.status(200).send(Response.create(true, "00", "결제 데이터 저장 완료"));
};
