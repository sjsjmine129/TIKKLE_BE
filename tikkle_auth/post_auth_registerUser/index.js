
const { User } = require("../../features/User");
const { Response } = require("../../features/Response");
const { DBManager } = require("../../db");


exports.post_auth_registerUser = async (req, res) => {
  const { body } = req;
  const { name, birthday, nick, phone, gender, source_tikkling_id } = body;

  //main logic------------------------------------------------------------------------------------------------------------------//
  const db = new DBManager();
  await db.openTransaction();
  try {

    //유저 객체 생성
    const user = new User({ name, birthday, nick, phone, gender, source_tikkling_id, db });
    //유저 정보 검증
    await user.validateUserForRegister();
    // 14세 미만 유저 제한
    await user.restrictUserUnder14();

    // 유저 등록
    await user.registerUser();

    // 티클링 공유 유저 로깅
    await user.logIfUserFromTikkling();

    await db.commitTransaction();

    return res.status(200).send(Response.create(true, "00", "sign up success!", user.id, null));
  } catch (err) {
    await db.rollbackTransaction();
    console.error(`🚨 error -> ⚡️ post_auth_registerUser : 🐞${err}`);
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message, null, null));
    } else {
      return res.status(500).send(Response.create(false, "00", "서버 에러", null, null));
    }
  }
};