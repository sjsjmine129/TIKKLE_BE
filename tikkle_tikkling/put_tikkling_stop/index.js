const { queryDatabase } = require("db.js");

exports.put_tikkling_stop = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;
  //main logic------------------------------------------------------------------------------------------------------------------//
  try {
    //티클링이 상태가 이미 변화했는지 확인
    const check_tikkling = await queryDatabase(`select * from tikkling_detail_view where tikkling_id = ?`, [req.body.tikkling_id]);
    //티클링이 없는 경우
    if (check_tikkling.length == 0) {
      console.log("비정상적 요청-put_tikkling_end: 티클링을 찾을 수 없습니다.");
      const return_body = {
        success: false,
        detail_code: "00",
        message: "비정상적 요청, 티클링을 찾을 수 없습니다.",
        returnToken: null,
      };
      return res.status(404).send(return_body);
    }
    //티클링이 종료된 경우
    else if (check_tikkling[0].terminated_at != null || check_tikkling[0].state_id != 1) {
      console.log("bad_request-put_tikkling_stop: 이미 종료된 티클링에 대해서 중단을 요청");
      const return_body = {
        success: false,
        detail_code: "00",
        message: "이미 종료된 티클링입니다.",
        returnToken,
      };
      return res.status(400).send(return_body);
    } else if (check_tikkling[0].tikkle_count == 0) {
      console.log("bad_request-put_tikkling_stop: 티클링 조각이 없는 티클링에 대해서 중단을 요청");
      const return_body = {
        success: false,
        detail_code: "00",
        message: "티클링 조각이 없는 티클링입니다.",
        returnToken,
      };
      return res.status(401).send(return_body);
    }

    const rows = await queryDatabase("UPDATE tikkling SET state_id = 3 WHERE id = ?;", [req.body.tikkling_id]);

    if (rows.affectedRows == 1) {
      const return_body = {
        success: true,
        detail_code: "00",
        message: `티클링을 성공적으로 중단하였습니다.`,
        returnToken,
      };
      return res.status(200).send(return_body);
    }
  } catch (err) {
    console.error("Failed to connect or execute query:", err);
    console.log("put_tikkling_end에서 에러가 발생했습니다.");
    console.error(`🚨 error -> ⚡️ put_tikkling_end : 🐞${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "서버 에러",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }
};
