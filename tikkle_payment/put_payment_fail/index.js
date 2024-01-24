const { Tikkle } = require("../../features/Tikkle");
const { User } = require("../../features/User");
const { Response } = require("../../features/Response");
const { DBManager } = require("../../db");

exports.put_payment_fail = async (req, res) => {
  const { body, id, returnToken } = req;
  const { merchant_uid } = body;

  const db = new DBManager();
  await db.openTransaction();

  //main logic------------------------------------------------------------------------------------------------------------------//
  try {
    //payment를 생성
    const tikkle_info = await Tikkle.getTikkleByMerchantUid({ merchant_uid, db });

    //payment 객체 생성
    const tikkle = new Tikkle({ ...tikkle_info, db });

    //DB상의 결제정보와 비교
    tikkle.compareStoredTikkleData({ user_id: id });

    //결제 실패 처리
    await tikkle.updateTikkleToFail();

    await db.commitTransaction();

    return res.status(200).send(Response.create(true, "00", "결제 실패 처리 완료", null, returnToken));
  } catch (err) {
    await db.rollbackTransaction();

    console.error(`🚨 error -> ⚡️ put_payment_fail : 🐞 ${err}`);
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 에러"));
  }
};
