const { queryDatabase, queryDatabase_multi } = require("db.js");
const { Response } = require("../../features/Response");
const { ExpectedError } = require("../../features/ExpectedError");
const { Tikkling } = require("../../features/Tikkling");
const { Tikkle } = require("../../features/Tikkle");
const { DBManager } = require("../../db");

exports.post_tikkling_sendtikkle = async (req, res) => {
  const { body, id, returnToken } = req;
  const { merchant_uid, imp_uid, status } = body;
  //main logic------------------------------------------------------------------------------------------------------------------//
  const db = new DBManager();
  await db.openTransaction();
  try {
    //결제정보 가져오기
    const tikkle_info = await Tikkle.getTikkleByMerchantUid({
      merchant_uid,
      db,
    });
    //payment 객체 생성
    const tikkle = new Tikkle({ ...tikkle_info, db });
    //DB상의 결제정보와 비교
    tikkle.compareStoredTikkleData({ user_id: id });
    //tikkling 객체 생성
    const tikkling = new Tikkling({ user_id: id });
    //티클링 정보 가져오기
    await tikkling.loadActiveTikklingViewByUserId();
    //줄 수 있는 상태인지 확인
    const check_tikkling = await queryDatabase(
      `SELECT t.id AS tikkling_id, t.user_id AS user_id, t.tikkle_quantity AS total_tikkle_quantity, IFNULL((SELECT SUM(s.quantity) FROM sending_tikkle s WHERE s.tikkling_id = ?), 0) AS received_tikkle_quantity, t.state_id 
      FROM tikkling t 
      WHERE t.id = ?;`,
      [req.body.tikkling_id, req.body.tikkling_id]
    );

    if (check_tikkling.length == 0) {
      const return_body = {
        success: false,
        detail_code: "00",
        message: "잘못된 요청, 티클링을 찾을 수 없습니다.",
        returnToken: null,
      };
      return res.status(404).send(return_body);
    } else if (check_tikkling[0].state_id != 1) {
      const return_body = {
        success: false,
        detail_code: "01",
        message: "티클을 보낼 수 없습니다. (티클을 줄 수 있는 상태가 아닙니다.)",
        returnToken,
      };
      return res.status(403).send(return_body);
    } else if (check_tikkling[0].total_tikkle_quantity < check_tikkling[0].received_tikkle_quantity + req.body.quantity) {
      const return_body = {
        success: false,
        detail_code: "02",
        message: "티클을 보낼 수 없습니다. (줄 수 있는 티클링 조각 수 초과)",
        returnToken,
      };
      return res.status(403).send(return_body);
    }
    //줄 수 있는 상태라면 티클 전송
    const results = await queryDatabase_multi(
      `CALL insert_sending_tikkle(?, ?, ?, ?, @success);
      select @success as success;`,
      [req.body.tikkling_id, id, req.body.tikkle_quantity, req.body.message]
    );

    let ticket_message = "자신의 티클 보내기에서는 티켓을 받을 수 없습니다.";
    let detail_code = "01";
    //보내는 사람과 받는 사람이 다를 때 티켓 지급 및 알림
    if (check_tikkling[0].user_id != id) {
      const [is_already_send, sender_info] = await queryDatabase_multi(
        `SELECT id FROM sending_tikkle WHERE tikkling_id = ? AND user_id = ?;
        SELECT name, image FROM users WHERE id = ?;
        `,

        [req.body.tikkling_id, id, id]
      );
      ticket_message = "이미 티켓을 지급 받았습니다.";
      detail_code = "02";
      //티클을 처음 보낼때만 티켓을 1개 지급
      if (is_already_send.length == 1) {
        await queryDatabase(`UPDATE users SET  tikkling_ticket =  tikkling_ticket + 1 WHERE id = ?;`, [id]);
        ticket_message = "티클링 티켓 1개를 획득하였습니다.";
        detail_code = "03";
      }

      /* 알림 보내기는 send notification 에서 */
      // //티클을 보낼 때마다 알림을 보냄
      // await queryDatabase(
      // 	`INSERT INTO notification (user_id, notification_type_id, message, meta_data, source_user_id) VALUES (?, ?, ?, ?, ?);`,

      // 	[
      // 		check_tikkling[0].user_id,
      // 		5,
      // 		`${sender_info[0].name}님이 보낸 티클을 확인해보세요.`,
      // 		`${sender_info[0].image}`,
      // 		id,
      // 	]
      // );
    }

    const success = results[1][0].success;
    if (success === 1) {
      const return_body = {
        success: true,
        detail_code,
        message: `티클을 성공적으로 보냈습니다. ${ticket_message}}`,
        returnToken,
      };
      return res.status(200).send(return_body);
    } else {
      const return_body = {
        success: false,
        detail_code: "03",
        message: "티클전송중 타인이 먼저 티클전송을 하였습니다. 티클을 보낼 수 없습니다. (줄 수 있는 티클링 조각 수 초과 or 티클을 줄 수 있는 상태가 아닙니다.)",
        returnToken,
      };
      return res.status(403).send(return_body);
    }
  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_tikkling_sendtikkle : 🐞${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "서버 에러",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }
};
