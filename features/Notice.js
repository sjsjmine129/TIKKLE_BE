const { queryDatabase, queryDatabase_multi } = require("db.js");
const { getSSMParameter } = require("ssm.js");
const axios = require("axios");
const { ExpectedError } = require("./ExpectedError.js");

class Notice {
  constructor({ type_id, receive_user_id, send_user_id }) {
    this.type_id = type_id;
    this.send_user_id = send_user_id;
    this.deep_link = "deep_link";
    this.link = "link";

    this.sender_name = null; //쿼리로 가져옴
    this.message = null; //정보로 조합
    this.receive_user_id = receive_user_id || null; //대신 티클링 아이디가 오는 경우 존재
  }

  /**
	 * 결제 취소 알림 정보 세팅 & 알림 보냄
	 * @example
	 * 		const notice = new Notice({
					type_id: 9,
					receive_user_id: id,
					send_user_id: id,
				});

				await notice.sendPayCancleNoti(merchant_uid);
	 */
  async sendPayCancleNoti(merchant_uid) {
    //----------- set data ----------------------------------------------------------------------//
    this.type_id = 9;
    this.receive_user_id = this.send_user_id;

    let sqlResult;
    try {
      const rows = await queryDatabase("select * from sending_tikkle where merchant_uid = ?", [merchant_uid]);
      sqlResult = rows;
    } catch (err) {
      console.error(`🚨 error -> ⚡️getUserById : 🐞${err}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러: class Notice sendPayCancleNoti 쿼리 에러`,
        detail_code: "00",
      });
    }

    if (sqlResult[0].user_id !== this.send_user_id) {
      console.error(`🚨 error -> ⚡️getUserById : 🐞본인의 결제가 아님`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러: class Notice sendPayCancleNoti 본인의 결제가 아님`,
        detail_code: "01",
      });
    } else if (sqlResult[0].state_id !== 3) {
      console.error(`🚨 error -> ⚡️getUserById : 🐞환불된 결제가 아님`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러: class Notice sendPayCancleNoti 환불된 결제가 아님`,
        detail_code: "02",
      });
    }

    this.message = sqlResult[0].created_at + "에 결제된 티클의 결제가 서버 문제로 취소 되었어요";

    //----------- send ----------------------------------------------------------------------//
    try {
      await queryDatabase(
        `INSERT INTO notification
					(user_id, message, is_deleted, is_read, notification_type_id, deep_link, link, meta_data, source_user_id)
					VALUES (?, ?, 0, 0, 9, ?, ?, ?, ?)`,
        [this.receive_user_id, this.message, this.deep_link, this.link, null, this.send_user_id]
      );
    } catch (err) {
      console.error(`🚨 error -> ⚡️getUserById : 🐞${err}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러: class Notice sendPayCancleNoti 에러 전송 쿼리 실패`,
        detail_code: "03",
      });
    }
  }

  /**
   * 알림 보내기
   */
  async send() {}

  /**
   *
   * @returns Notice 객체의 모든 데이터를 str로 반환
   */
  async printData() {
    // console.log("type_id : ", this.type_id);
    // console.log("send_user_id : ", this.send_user_id);
    // console.log("tikkling_id : ", this.tikkling_id);
    // console.log("receive_user_id : ", this.receive_user_id);
    // console.log("deep_link : ", this.deep_link);
    // console.log("link : ", this.link);
    // console.log("sender_name : ", this.sender_name);
    // console.log("message : ", this.message);

    return (
      "type_id : " +
      this.type_id +
      "\n" +
      "send_user_id : " +
      this.send_user_id +
      "\n" +
      "tikkling_id : " +
      this.tikkling_id +
      "\n" +
      "receive_user_id : " +
      this.receive_user_id +
      "\n" +
      "deep_link : " +
      this.deep_link +
      "\n" +
      "link : " +
      this.link +
      "\n" +
      "sender_name : " +
      this.sender_name +
      "\n" +
      "message : " +
      this.message +
      "\n"
    );
  }

  /////
}

module.exports = { Notice };
