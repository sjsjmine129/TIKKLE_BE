const { Response } = require("../../features/Response");
const { DBManager } = require("../../db");
const { Delivery } = require("../../features/Delivery");
const { Refund } = require("../../features/Refund");
const { ExpectedError } = require("../../features/ExpectedError");

exports.get_tikkling_refundinfo = async (req, res) => {
  const id = req.id;
  const returnToken = req.returnToken;
  const { tikkling_id } = req.params;
  //main logic------------------------------------------------------------------------------------------------------------------//
  const db = new DBManager();
  await db.openTransaction();
  try {
    const refund = new Refund({ db: db, tikkling_id: tikkling_id });
    
    // api를 호출한 유저의 가장 최근 배송목록 확인
    if (Number(tikkling_id) <= 0) {
      throw new ExpectedError({
        status: 400,
        detail_code: "01",
        message: "잘못된 요청입니다.",
      });
    }

    if (Number(tikkling_id) >= 1) {
      await refund.loadDataByTikklingId();
    }
    await db.commitTransaction();
    //TODO: 이부분 내장함수화
    refund.db = null;
    return res.status(200).send(Response.create(true, "00", "성공적으로 환급정보를 조회하였습니다.", {refund:refund}, returnToken));
  } catch (err) {
    console.error(`🚨 error -> ⚡️ get_tikkling_refundinfo : 🐞${err}`);

    await db.rollbackTransaction();
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 에러"));
  }
};
