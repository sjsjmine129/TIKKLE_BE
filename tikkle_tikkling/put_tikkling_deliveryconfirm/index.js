const { queryDatabase, queryDatabase_multi } = require("db.js");
const { Tikkling } = require("../../features/Tikkling");
const { Response } = require("../../features/Response");
const { User } = require("../../features/User");
const { Delivery } = require("../../features/Delivery");
const { ExpectedError } = require("../../features/ExpectedError");
const { DBManager } = require("../../db");
const { OptionCombination } = require("../../features/Product");

exports.put_tikkling_deliveryconfirm = async (req, res) => {
  const id = req.id;
  const returnToken = req.returnToken;
  const { tikkling_id } = req.body;

  //main logic------------------------------------------------------------------------------------------------------------------//
  const db = new DBManager();
  await db.openTransaction();
  try {
    //배송정보 객체 생성
    const delivery_info = new Delivery({ tikkling_id, db: db });
    await delivery_info.loadDeliveryInfoByTikklingId();
    await delivery_info.updateDeliveryToConfirmed();
    await db.commitTransaction();

    return res.status(200).send(Response.create(true, "00", "배송정보 수령처리를 성공하였습니다.", returnToken));
  } catch (err) {
    await db.rollbackTransaction();
    console.error(`🚨 error -> ⚡️ put_tikkling_deliveryconfirm : 🐞${err}`);
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 에러"));
  }
};
