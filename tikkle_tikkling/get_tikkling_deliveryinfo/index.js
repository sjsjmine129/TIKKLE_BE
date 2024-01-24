const { Response } = require("../../features/Response");
const { DBManager } = require("../../db");
const { Delivery } = require("../../features/Delivery");
const { ExpectedError } = require("../../features/ExpectedError");

exports.get_tikkling_deliveryinfo = async (req, res) => {
  const id = req.id;
  const returnToken = req.returnToken;
  const { tikkling_id } = req.params;
  //main logic------------------------------------------------------------------------------------------------------------------//
  const db = new DBManager();
  await db.openTransaction();
  try {
    const delivery_info = new Delivery({ db: db });
    // api를 호출한 유저의 가장 최근 배송목록 확인
    if (Number(tikkling_id) === 0) {
      await delivery_info.getRecentDeliveryInfoOfUser(id);
    }
    if (Number(tikkling_id) >= 1) {
      await delivery_info.getDeliveryInfoByTikklingId(tikkling_id);
    }

    const delivery_check_link = await delivery_info.createDeliveryCheckLink();
    await db.commitTransaction();

    return res.status(200).send(Response.create(true, "00", "성공적으로 배송정보를 조회하였습니다.", { delivery_info: delivery_info.toJSON(), delivery_check_link }, returnToken));
  } catch (err) {
    await db.rollbackTransaction();
    console.error(`🚨 error -> ⚡️ get_tikkling_deliveryinfo : 🐞${err}`);
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 에러"));
  }
};
