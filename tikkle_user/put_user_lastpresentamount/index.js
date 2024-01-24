const { queryDatabase, queryDatabase_multi } = require("db.js");
const { Tikkling } = require("../../features/Tikkling");
const { Response } = require("../../features/Response");
const { User } = require("../../features/User");
const { Delivery } = require("../../features/Delivery");
const { ExpectedError } = require("../../features/ExpectedError");
const { DBManager } = require("../../db");
const { OptionCombination } = require("../../features/Product");

exports.put_user_lastpresentamount = async (req, res) => {
  const id = req.id;
  const returnToken = req.returnToken;
  const { last_present_amount } = req.body;

  //main logic------------------------------------------------------------------------------------------------------------------//
  const db = new DBManager();
  await db.openTransaction();
  try {
    //유저 객체 생성
    const user = await User.createById({ id, db });
  
    //유저의 last_present_amount수정
    await user.updateLastPresentAmount(req.body.last_present_amount);
    await db.commitTransaction();

    return res.status(200).send(Response.create(true, "00", "유저의 마지막 선물 금액 수정에 성공하였습니다.", returnToken));
  } catch (err) {
    await db.rollbackTransaction();
    console.error(`🚨 error -> ⚡️ put_user_lastpresentamount : 🐞${err}`);
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 에러"));
  }
};
