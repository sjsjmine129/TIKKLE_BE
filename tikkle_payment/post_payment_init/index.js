const { Tikkle } = require("../../features/Tikkle");
const { User } = require("../../features/User");
const { Response } = require("../../features/Response");
const { DBManager } = require("../../db");
const { Tikkling } = require("../../features/Tikkling");
const { ExpectedError } = require("../../features/ExpectedError");
const { getSSMParameter } = require("ssm.js");

exports.post_payment_init = async (req, res) => {
  const { body, id, returnToken, params } = req;
  const { tikkleAction } = params;
  const { tikkling_id, tikkle_quantity, message } = body;
  //main logic------------------------------------------------------------------------------------------------------------------//
  const db = new DBManager();
  await db.openTransaction();
  try {
    //user정보 가져옴
    const user = await User.createById({ id, db });

    //티클링 객체 생성
    const tikkling = new Tikkling({ id: tikkling_id, db });

    //해당 티클링 락
    await tikkling.lockTikklingForInsertTikkle();

    //티클링 정보 가져오기
    await tikkling.loadActiveTikklingViewByTikklingId();

    if (tikkleAction == "sendtikkle") {
      //요청의 유효성 겅사
      await tikkling.validateSendTikkleRequest({ tikkle_quantity });
    } else if (tikkleAction == "buymytikkle") {
      //요청의 유효성 겅사
      tikkling.validateBuyMyTikkleRequest({ user_id: id, tikkle_quantity });
    } else {
      throw new ExpectedError({
        status: "403",
        message: `잘못된 요청, 해당 기능을 찾을 수 없습니다.`,
        detail_code: "00",
      });
    }
    //티클링이 정보를 받을 수 있는 상태라면 티클 객체 생성
    const tikkle = new Tikkle({ tikkling_id, user_id: id, message, quantity: tikkle_quantity, state_id: 5, db });

    //해당 티클정보를 db에 저장
    await tikkle.initTikklePayment();

    //payment param 객체 생성
    const TIKKLE_API_ADDRESS = await getSSMParameter("TIKKLE_API_ADDRESS");
    const notice_url = `${TIKKLE_API_ADDRESS}/post_payment_finalize/${tikkleAction}`;
    const payment_param = tikkle.createPaymentParam({ user_name: user.name, user_phone: user.phone, notice_url });

    //transaction commit
    await db.commitTransaction();

    return res.status(200).send(Response.create(true, "00", "결제 데이터 저장 완료", payment_param, returnToken));
  } catch (err) {
    await db.rollbackTransaction();
    console.error(`🚨 error -> ⚡️ post_payment_init/${tikkleAction} : 🐞${err}`);
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 에러"));
  }
};
