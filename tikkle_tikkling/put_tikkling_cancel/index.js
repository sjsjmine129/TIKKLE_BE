const { queryDatabase, queryDatabase_multi } = require("db.js");
const { Tikkling } = require("../../features/Tikkling");
const { Response } = require("../../features/Response");
const { User } = require("../../features/User");
const { ExpectedError } = require("../../features/ExpectedError");
const { DBManager } = require("../../db");
const { OptionCombination } = require("../../features/Product");

exports.put_tikkling_cancel = async (req, res) => {
  const id = req.id;
  const returnToken = req.returnToken;
  const { tikkling_id } = req.body;

  //main logic------------------------------------------------------------------------------------------------------------------//
  //FIXME: 티클링취소 직전 티클링 조각이 도착한 경우가 생길 수 있음 조금 더 하나의 트랜잭션으로 처리해야할 필요성이 있음
  const db = new DBManager();
  await db.openTransaction();
  try {
    //티클링 객체 생성
    const tikkling = new Tikkling({ id: tikkling_id, db });

    //티클링 정보 로드
    await tikkling.loadActiveTikklingViewByTikklingId();

    //도착한 티클링 조각이 있는지 확인
    tikkling.assertTikkleCountIsZero();

    //option combination 객체 생성
    const option_combination = new OptionCombination({ id: tikkling.option_combination_id, db });

    //user 객체 생성
    const user = new User({ id, db });

    //티클링 취소, 티클링 티켓 환급, 상품 수량 복구
    await Promise.all([user.increaseTikkleTicket(), option_combination.increaseQuantity(), tikkling.cancelTikkling()]);

    await db.commitTransaction();

    return res.status(200).send(Response.create(true, "00", "티클링 취소를 성공하였습니다.", returnToken));
  } catch (err) {
    await db.rollbackTransaction();
    console.error(`🚨 error -> ⚡️ post_tikkling_create : 🐞${err}`);
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 에러"));
  }
};
