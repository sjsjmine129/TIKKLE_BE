const { getSSMParameter } = require("ssm.js");
const axios = require("axios");
const { ExpectedError } = require("./ExpectedError.js");
const crypto = require("crypto");

//TODO: 매일 밤 12시에 결제 되지 않았고 12시간이 지났으면 해당 결제 실패 처리

class PaymentParam {
  constructor({ user_name, user_phone, amount, merchant_uid, notice_url }) {
    this.pg = getSSMParameter("pg");
    this.pay_method = "trans";
    this.merchant_uid = merchant_uid;
    this.name = "티클";
    this.buyer_name = user_name;
    this.buyer_tel = user_phone;
    //TODO: redirect url 필요한 파라미터인지 다시 체크
    this.m_redirect_url = "https://www.naver.com/";
    this.app_scheme = "example";
    this.amount = amount;
    this.notice_url = notice_url;
  }
}

class Tikkle {
  constructor({ id, tikkling_id, user_id, message, quantity = null, state_id, merchant_uid, created_at = null, db }) {
    this.id = id || null;
    this.tikkling_id = tikkling_id || null;
    this.user_id = user_id || null;
    this.message = message || null;
    this.quantity = quantity;
    this.state_id = state_id || null;
    this.merchant_uid = merchant_uid || this.generateMerchantUid();
    this.amount = quantity * 5000;
    this.created_at = created_at;
    this.db = db;
  }

  updateFromDatabaseResult(dbResult) {
    Object.keys(this).forEach((key) => {
      if (dbResult.hasOwnProperty(key)) {
        this[key] = dbResult[key];
      }
    });
  }

  validateSendMessageRequest() {
    try {
      if (this.state_id !== 7) {
        throw new ExpectedError({
          status: "403",
          message: `메세지 전송용 티클은 state_id가 7이어야 합니다.`,
          detail_code: "00",
        });
      }
      if (this.message == null) {
        throw new ExpectedError({
          status: "403",
          message: `메세지 전송용 티클은 메세지가 필요합니다.`,
          detail_code: "00",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ validateSendMessageRequest : 🐞${error}`);
      throw error;
    }
  }

  /**
   * 티클 결제정보를 결제 대기 상태로 DB에 저장
   * @returns {Promise<Object>} - A promise that resolves with the results of the query, including affectedRows, insertId, and warningStatus.
   * @throws {ExpectedError} Throws an ExpectedError with status 500 if the database query fails.
   * @memberof Tikkle
   * @instance
   * @async
   * @example
   * const tikkle = new Tikkle({ tikkling_id: 1, user_id: 1, message: '티클 메시지', quantity: 1, state_id: 5 });
   * await tikkle.initTikklePayment();
   */
  async initTikklePayment() {
    try {
      if (this.state_id != 5) {
        console.error(`🚨 error -> ⚡️ getUserById : 🐞 ${"미결제 상태의 티클만 해당 함수를 호출가능"}`);
        throw new Error("서버에러");
      }
      return await this.db.executeQuery(`INSERT INTO sending_tikkle (tikkling_id, user_id, message, quantity, state_id,  merchant_uid) VALUES (?, ?, ?, ?, ?, ?)`, [
        this.tikkling_id,
        this.user_id,
        this.message,
        this.quantity,
        this.state_id,
        this.merchant_uid,
      ]);
    } catch (err) {
      console.error(`🚨 error -> ⚡️ getUserById : 🐞 ${err}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러 :getUserById`,
        detail_code: "00",
      });
    }
  }

  async increaseTikklingTicket() {
    try {
      const result = await this.db.executeQuery(`UPDATE users SET tikkling_ticket = tikkling_ticket + 1 WHERE id = ?`, [this.user_id]);
      if (result.affectedRows == 0) {
        throw new ExpectedError({
          status: "500",
          message: `서버에러`,
          detail_code: "00",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ increaseTikklingTicket : 🐞${error}`);
      throw error;
    }
  }
  
  async sendMessage() {
    try {
      const result = await this.db.executeQuery(`INSERT INTO sending_tikkle (tikkling_id, user_id, message, quantity, state_id,  merchant_uid) VALUES (?, ?, ?, ?, ?, ?)`, [
        this.tikkling_id,
        this.user_id,
        this.message,
        this.quantity,
        this.state_id,
        this.merchant_uid,
      ]);
      if (result.affectedRows == 0) {
        throw new ExpectedError({
          status: "500",
          message: `서버에러`,
          detail_code: "00",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ sendMessage : 🐞${error}`);
      throw error;
    }
  }

  /**
	 * Asynchronously updates the sending_tikkle state_id to 6, "결제 실패" in the database.
	 * @returns {Promise<Object>} - A promise that resolves with the results of the query, including affectedRows, insertId, and warningStatus.
	 * @throws {ExpectedError} Throws an ExpectedError with status 500 if the database query fails.
	 * @memberof Payment
	 * @instance
	 * @async
	 * @example
	 * const payment = new Payment({ user_id: 1, amount: 10000 });

	 * await payment.updateTikkleToFail();
	 * // => { affectedRows: 1, insertId: 1, warningStatus: 0 }
	 * // => sending_tikkle.state_id = 6
	 */
  async updateTikkleToFail() {
    try {
      const result = await this.db.executeQuery(`UPDATE sending_tikkle SET state_id = 6 WHERE merchant_uid = ?`, [this.merchant_uid]);
      if (result.affectedRows == 0) {
        throw new ExpectedError({
          status: "500",
          message: `서버에러 : updateTikkleToFail`,
          detail_code: "00",
        });
      } else {
        this.state_id = 6;
      }
    } catch (err) {
      console.error(`🚨 error -> ⚡️ updatePaymentToCancle : 🐞 ${err}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러 : updateTikkleToFail`,
        detail_code: "00",
      });
    }
  }

  /**
   * Asynchronously updates the sending_tikkle state_id to 3, "환불" in the database.
   * @returns {Promise<Object>} - A promise that resolves with the results of the query, including affectedRows, insertId, and warningStatus.
   * @throws {ExpectedError} Throws an ExpectedError with status 500 if the database query fails.
   * @memberof Payment
   * @instance
   * @async
   * @example
   * const payment = new Payment({ user_id: 1, amount: 10000 });
   * await payment.updateTikkleToRefund();
   * // => { affectedRows: 1, insertId: 1, warningStatus: 0 }
   * // => sending_tikkle.state_id = 3
   */
  async updateTikkleToRefund() {
    try {
      const result = await this.db.executeQuery(`UPDATE sending_tikkle SET state_id = 3 WHERE merchant_uid = ?`, [this.merchant_uid]);

      if (result.affectedRows == 0) {
        console.error(`🚨 error -> ⚡️ updateTikkleToRefund : 🐞 ${"데이터가 DB상에 반영되지 않음"}`);
        throw new ExpectedError({
          status: "500",
          message: `서버에러 : updateTikkleToRefund 쿼리결과`,
          detail_code: "00",
        });
      } else {
        this.state_id = 3;
      }
    } catch (err) {
      console.error(`🚨 error -> ⚡️ updateTikkleToRefund : 🐞 ${err}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러: updateTikkleToRefund 쿼리`,
        detail_code: "00",
      });
    }
  }

  /**
   *      //state 가 4이고 terminate 가 없으면 state->4
   * @returns {Promise<Object>} - A promise that resolves with the results of the query, including affectedRows, insertId, and warningStatus.
   * @throws {ExpectedError} Throws an ExpectedError with status 500 if the database query fails.
   * @memberof Payment
   * @instance
   * @async
   * @example
   * const payment = new Payment({ user_id: 1, amount: 10000 });
   * await payment.updateTikkleToRefund();
   * // => { affectedRows: 1, insertId: 1, warningStatus: 0 }
   * // => sending_tikkle.state_id = 3
   */
  async restart_tikkling() {
    try {
      //console.log("this.tikkling_id: ", this.tikkling_id);
      const result = await this.db.executeQuery(`SELECT * FROM tikkling  WHERE id = ?`, [this.tikkling_id]);

      const res = result[0];
      // console.log("res: ", res.user_id);
      // funding_limit의 날짜가 오늘보다 이후일때만 재개
      if (res.state_id == 4 && res.terminated_at == null && res.funding_limit > new Date().getTime()) {
        const temp = await this.db.executeQuery(`UPDATE tikkling SET state_id = 1 WHERE id = ?`, [this.tikkling_id]);

        if (temp.affectedRows == 0) {
          console.error(`🚨 error -> ⚡️ restart_tikkling : 🐞 ${"데이터가 DB상에 반영되지 않음"}`);
          throw new ExpectedError({
            status: "500",
            message: `서버에러 : restart_tikkling 쿼리결과`,
            detail_code: "00",
          });
        }
        return res.user_id;
      } else {
        return null;
      }
    } catch (err) {
      console.error(`🚨 error -> ⚡️ restart_tikkling : 🐞 ${err}`);
      throw err;
    }
  }

  /**
   * Asynchronously updates the sending_tikkle state_id to 6, "결제 실패" in the database.
   * @returns {Promise<Object>} - A promise that resolves with the results of the query, including affectedRows, insertId, and warningStatus.
   * @throws {ExpectedError} Throws an ExpectedError with status 500 if the database query fails.
   * @memberof Tikkle
   * @instance
   * @async
   * @example
   * const Tikkle = new Tikkle({ user_id: 1, amount: 10000 });
   * await Tikkle.updateTikkleToFail();
   * // => { affectedRows: 1, insertId: 1, warningStatus: 0 }
   * // => sending_tikkle.state_id = 6
   */
  async updateTikkleToFail() {
    try {
      const result = await this.db.executeQuery(`UPDATE sending_tikkle SET state_id = 6 WHERE merchant_uid = ?`, [this.merchant_uid]);

      if (result.affectedRows == 0) {
        console.error(`🚨 error -> ⚡️ updateTikkleToFail : 🐞 ${"데이터가 DB상에 반영되지 않음"}`);
        throw new ExpectedError({
          status: "500",
          message: `서버에러 : updateTikkleToFail 쿼리결과`,
          detail_code: "00",
        });
      } else {
        this.state_id = 3;
      }
    } catch (err) {
      console.error(`🚨 error -> ⚡️ updateTikkleToFail : 🐞 ${err}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러: updateTikkleToFail 쿼리`,
        detail_code: "00",
      });
    }
  }

  /**
   * create payment info
   * @param {string} user_name
   * @param {string} user_phone_number
   * @returns {PaymentParam}
   * @memberof Payment
   * @instance
   * @example
   * const payment = new Payment({ user_id: 1, amount: 10000 });
   * payment.createPaymentParam('홍길동', '01012345678');
   */
  createPaymentParam({ user_name, user_phone, notice_url }) {
    const amount = this.amount;
    const merchant_uid = this.merchant_uid;
    return new PaymentParam({
      user_name,
      user_phone,
      amount,
      merchant_uid,
      notice_url,
    });
  }

  /**
   * Asynchronously update sending_tikkle state_id to 1, "미사용" in the database.
   * @returns {Promise<Object>} - A promise that resolves with the results of the query, including affectedRows, insertId, and warningStatus.
   * @throws {ExpectedError} Throws an ExpectedError with status 500 if the database query fails.
   * @memberof Payment
   * @instance
   * @async
   * @example
   * const payment = new Payment({ user_id: 1, amount: 10000 });
   * await payment.completeTikklePayment();
   * // => { affectedRows: 1, insertId: 1, warningStatus: 0 }
   * // => sending_tikkle.state_id = 1
   */
  async completeTikklePayment() {
    try {
      const result = await this.db.executeQuery(`UPDATE sending_tikkle SET state_id = 1 WHERE merchant_uid = ?`, [this.merchant_uid]);
      if (result.affectedRows == 0) {
        throw new ExpectedError({
          status: "500",
          message: `서버에러`,
          detail_code: "00",
        });
      } else {
        this.state_id = 1;
      }
    } catch (err) {
      console.error(`🚨 error -> ⚡️ completeTikklePayment : 🐞 ${err}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러:completeTikklePayment`,
        detail_code: "00",
      });
    }
  }

  /**
	 * Compare stored payment info and request payment info.
	 * @param {string} user_id - The merchant UID to compare.
	 * @param {string} amount - The amount to compare.
	 *
	 * @returns {void}
	 * @throws {ExpectedError} Throws an ExpectedError with status 401 if the request is invalid.
	 * @memberof Payment
	 * @instance
	 * @example
	 * const payment = new Payment({ user_id: 1, amount: 10000 });

	 * payment.compareStoredTikkleData({merchant_uid, amount});
	 * // => throw ExpectedError with status 401 if the request is invalid.
	 */
  compareStoredTikkleData({ user_id }) {
    if (this.user_id !== user_id) {
      console.error(`🚨 error -> ⚡️ compareStoredTikkleData : 🐞사용자가 일치하지 않습니다.`);
      throw new ExpectedError({
        status: "401",
        message: `비정상적 접근 : 다른 사용자의 결제 정보`,
        detail_code: "00",
      });
    }
  }

  //

  static async getTikkleByMerchantUid({ merchant_uid, db }) {
    try {
      const rows = await db.executeQuery(`SELECT * FROM sending_tikkle WHERE merchant_uid = ?`, [merchant_uid]);
      if (!Tikkle.checkRowExists(rows)) {
        console.error(`🚨 error -> ⚡️ getTikkleByMerchantUid : 🐞 ${"사용자가 존재하지 않는 티클을 검색하였습니다."}`);
        throw new ExpectedError({
          status: "403",
          message: `비정상적 접근 : 존재하지 않는 티클`,
          detail_code: "00",
        });
      }
      return rows[0];
    } catch (err) {
      console.error(`🚨 error -> ⚡️ getTikkleByMerchantUid : 🐞 ${err}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러`,
        detail_code: "00",
      });
    }
  }

  static checkRowExists(rows) {
    if (rows.length == 0) {
      console.error(`🚨 error -> ⚡️ checkRowExists : 🐞 쿼리의 결과가 존재하지 않음`);
      return false;
    }
    return true;
  }

  /**
   * generate merchant_uid
   * @returns {string} - merchant_uid
   * @memberof Payment
   * @instance
   * @example
   * const payment = new Payment({ user_id: 1, amount: 10000 });
   * payment.generateMerchantUid();
   * // => 'tikkling_1581234567890'
   */
  generateMerchantUid(userID, productID) {
    // 입력 파라미터를 하나의 문자열로 합칩니다.
    const timestamp = new Date().getTime();
    const data = `${userID}${productID}${timestamp}`;

    const hash = crypto.createHash("md5").update(data).digest("hex");

    return hash;
  }

  /**
	 * Asynchronously gets the payment api token from iamport.
	 * @returns {Promise<string>} - A promise that resolves with the access_token.
	 * @throws {ExpectedError} Throws an ExpectedError with status 500 if the database query fails.
	 * @memberof Payment
	 * @instance
	 * @async
	 * @example

	 * const token = await Payment.getPortOneApiToken();
	 */
  static async getPortOneApiToken() {
    try {
      const imp_key = await getSSMParameter("imp_key");
      const imp_secret = await getSSMParameter("imp_secret");

      const axios_ret = await axios({
        url: "https://api.iamport.kr/users/getToken",
        method: "post",
        headers: { "Content-Type": "application/json" },
        data: {
          imp_key: imp_key,
          imp_secret: imp_secret,
        },
      });

      const response = axios_ret.data;

      return "Bearer " + response.response.access_token;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ getPortOneApiToken : 🐞import token get error`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러: 아임포트 토큰 가져오기 실패`,
        detail_code: "00",
      });
    }
  }

  //port one의 특정 결제 취소 api를 호출
  async callPortOneCancelPaymentAPI({ port_one_token, reason }) {
    try {
      const response = await axios({
        url: "https://api.iamport.kr/payments/cancel",
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: port_one_token,
        },
        data: {
          merchant_uid: this.merchant_uid,
          checksum: this.amount,
          reason,
        },
      });
      //FIXME: 조건 수정 요함
      if (!response.data) {
        console.error(`🚨 error -> ⚡️ callPortOneCancelPaymentAPI : 🐞import token get error`);
        throw new ExpectedError({
          status: "500",
          message: `서버에러 : 아임포트 결제 취소 실패`,
          detail_code: "07",
        });
      }
    } catch (err) {
      console.error(`🚨 error -> ⚡️ callPortOneCancelPaymentAPI : 🐞 ${err}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러 아임포트 결제 취소 실패`,
        detail_code: "07",
      });
    }
  }

  /**
   * 결제 환불 전에 완료된 결제인지 확인
   * @throws {ExpectedError} Throws an ExpectedError with status 500 if payment state is not "PAYMENT_COMPLETED".
   * @memberof Payment
   * @instance
   * @async
   * @example
   * await tikkle.checkTikkleCanRefund();
   */
  async checkTikkleCanRefund() {
    try {
      if (this.state_id !== 1) {
        console.error(`🚨 error -> ⚡️ checkTikkleCanRefund : 🐞payment state is not 1`);
        throw new ExpectedError({
          status: "403",
          message: `사용 혹은 결제되지 않은 티클에 대한 환불 신청`,
          detail_code: "01",
        });
      }
    } catch (err) {
      console.error(`🚨 error -> ⚡️ checkTikkleCanRefund : 🐞 ${err}`);
      throw new ExpectedError({
        status: "500",
        message: `서버에러 : checkTikkleCanRefund`,

        detail_code: "00",
      });
    }
  }

  assertTikkleIsNotPaid() {
    try {
      if (this.state_id !== 5) {
        throw new ExpectedError({
          status: "403",
          message: `비정상적 접근 : 결제가 완료된 티클`,
          detail_code: "00",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ assertTikkleIsNotPaid : 🐞${error}`);
      throw error;
    }
  }
}

module.exports = { Tikkle };
