const { Tikkle } = require("../../features/Tikkle");
const { User } = require("../../features/User");
const { Response } = require("../../features/Response");
const { Notice } = require("../../features/Notice");
const { DBManager } = require("../../db");
const { queryDatabase } = require("db.js");
const { InviteEventManager } = require("../../features/InviteEventManager");

exports.put_payment_refund = async (req, res) => {
  const { body, id, returnToken } = req;
  const { merchant_uid, reason } = body;

  const db = new DBManager();
  await db.openTransaction();
  let receive_user_id;
  let tikkling_id;
  let send_user_id;

  //main logic------------------------------------------------------------------------------------------------------------------//
  try {
    //Tikkle 생성

    const tikkle_info = await Tikkle.getTikkleByMerchantUid({
      merchant_uid,
      db,
    });

    //payment 객체 생성
    const tikkle = new Tikkle({ ...tikkle_info, db });
    tikkling_id = tikkle.tikkling_id;
    send_user_id = tikkle.user_id;
    //DB상의 결제정보와 비교
    tikkle.compareStoredTikkleData({ user_id: id });

    //환불 가능한 티클인지 확인
    await tikkle.checkTikkleCanRefund();

    //포트원 토큰 가져오기
    const port_one_token = await Tikkle.getPortOneApiToken();

    // //결제 환불 처리 in Tikkle DB (sendingTikkle state = 3, payment state = PAYMENT_CANCELLED)
    await tikkle.updateTikkleToRefund();
    // TODO: event끝난뒤 제거
    const user_invite_event_manager = new InviteEventManager({ db });
    await user_invite_event_manager.eventProcessAfterTikkleRefunded(tikkle.id);
    //만약 종료된 상태였다면 티클링 재개
    receive_user_id = await tikkle.restart_tikkling();

    // //아이엠 포트 결제 취소
    await tikkle.callPortOneCancelPaymentAPI({
      port_one_token: port_one_token,
      reason: reason,
    });

    await db.commitTransaction();

    //-------- send notification --------------------------------------------------------------------------------------//
    //console.log("sned noti ", receive_user_id, tikkling_id, send_user_id);
    if (receive_user_id != null) {
      try {
        //보내는 사람 정보
        try {
          const rows = await queryDatabase("select * from users where id = ?", [send_user_id]);
          sqlResult = rows;
          //console.log("SQL result : ", sqlResult);
        } catch (err) {
          console.log("1. send notification 에서 에러가 발생했습니다.", err);
        }

        // check data is one
        if (sqlResult.length !== 1) {
          console.log("2. send notification 에서 에러가 발생했습니다.", err);
        }

        const name = sqlResult[0].name;

        //DB에 알림 저장
        message = name + "님이 티클을 환불하여 티클이 재개되었어요.";

        title = "티클링 재개";
        link = "link_for_5";
        deep_link = "tikkle://tikklingDetail/" + tikkling_id.toString();
        source_user_id = send_user_id;

        const notiDB = await queryDatabase(
          `INSERT INTO notification
        (user_id, message, is_deleted, is_read, notification_type_id, deep_link, link, meta_data, source_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [receive_user_id, message, 0, 0, 10, deep_link, link, null, source_user_id]
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

        await fcm_send(device_token, "티클링 재개", message, deep_link);
      } catch {}
    }

    //     //리텅
    return res.status(200).send(Response.create(true, "00", "결제 환불 처리 완료", null, returnToken));
  } catch (err) {
    await db.rollbackTransaction();

    console.error(`🚨 error -> ⚡️ put_payment_refund : 🐞 ${err}`);
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 : 결제 환불 처리 실패"));
  }
};
