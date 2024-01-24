const { ExpectedError } = require("./ExpectedError.js");
const { getSSMParameter } = require("ssm.js");
const axios = require("axios");

class Tikkling {
  constructor({ id, user_id, funding_limit, created_at = null, tikkle_quantity, product_id, terminated_at, state_id, type, resolution_type, tikkle_count, option_combination_id, db }) {
    this.id = id || null;
    this.user_id = user_id || null;
    this.funding_limit = funding_limit || null;
    this.created_at = created_at || null;
    this.tikkle_quantity = tikkle_quantity || null;
    this.product_id = product_id || null;
    this.terminated_at = terminated_at || null;
    this.state_id = state_id || null;
    this.type = type || null;
    this.resolution_type = resolution_type || null;
    this.tikkle_count = tikkle_count || null;
    this.option_combination_id = option_combination_id || null;
    this.db = db;
  }

  updateFromDatabaseResult(dbResult) {
    Object.keys(this).forEach((key) => {
      if (dbResult.hasOwnProperty(key)) {
        this[key] = dbResult[key];
      }
    });
  }
  /**
   * Asynchronously loads the active tikkling view info from the database by Tikkling ID.
   * @returns {Promise<Object>} - A promise that resolves with the results of the query, including affectedRows, insertId, and warningStatus.
   * @throws {ExpectedError} Throws an ExpectedError with status 500 if the database query fails.
   * @memberof Tikkling
   * @instance
   * @async
   * @example
   * const tikkling = new Tikkling({ id: 1 });
   * await tikkling.loadActiveTikklingViewByTikkling_id();
   */
  async loadActiveTikklingViewByUserId() {
    try {
      const rows = await this.db.executeQuery(`SELECT * FROM tikkling_detail_view WHERE user_id = ? AND terminated_at IS NULL`, [this.user_id]);
      if (!Tikkling.checkRowExists(rows)) {
        throw new ExpectedError({
          status: "404",
          message: `비정상적 요청, 티클링이 존재하지 않습니다.`,
          detail_code: "00",
        });
      }
      let active_tikkling = rows[0];
      active_tikkling.id = active_tikkling.tikkling_id;
      this.updateFromDatabaseResult(active_tikkling);
    } catch (error) {
      console.error(`🚨 error -> ⚡️ loadActiveTikklingViewByUserId : 🐞 ${error}`);
      throw error;
    }
  }

  async loadActiveTikklingViewByTikklingId() {
    try {
      const rows = await this.db.executeQuery(`SELECT * FROM tikkling_detail_view WHERE tikkling_id = ? AND terminated_at IS NULL`, [this.id]);
      if (!Tikkling.checkRowExists(rows)) {
        throw new ExpectedError({
          status: "404",
          message: `비정상적 요청, 활성화된 티클링이 존재하지 않습니다.`,
          detail_code: "00",
        });
      }
      let active_tikkling = rows[0];
      active_tikkling.id = active_tikkling.tikkling_id;
      this.updateFromDatabaseResult(active_tikkling);
    } catch (error) {
      console.error(`🚨 error -> ⚡️ loadActiveTikklingViewByTikklingId : 🐞 ${error}`);
      throw error;
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
   * check if the request is valid
   * @returns {void}
   * @throws {ExpectedError} Throws an ExpectedError with status 403 if the request is invalid.
   * @memberof Tikkling
   * @instance
   * @example
   * const tikkling = new Tikkling({ id: 1 });
   * await tikkling.loadActiveTikklingViewByTikkling_id();
   * tikkling.validateBuyMyTikkleRequest();
   * // => throw ExpectedError with status 403 if the request is invalid.
   */
  validateBuyMyTikkleRequest({ user_id, tikkle_quantity }) {
    try {
      if (parseInt(this.tikkle_quantity) != parseInt(this.tikkle_count) + parseInt(tikkle_quantity)) {
        throw new ExpectedError({
          status: "403",
          message: `남은 티클의 구매 수량이 정확하지 않습니다.`,
          detail_code: "03",
        });
      }
      if (this.user_id !== user_id) {
        throw new ExpectedError({
          status: "403",
          message: `비정상적 요청, 해당 티클링의 소유자가 아닙니다.`,
          detail_code: "00",
        });
      }
      if (parseInt(this.tikkle_quantity) == parseInt(this.tikkle_count)) {
        throw new ExpectedError({
          status: "403",
          message: `이미 모든 티클을 수집한 티클링입니다.`,
          detail_code: "01",
        });
      } else if (this.state_id !== 3 && this.state_id != 5) {
        throw new ExpectedError({
          status: "403",
          message: `비정상적 요청, 아직 티클링이 중단되지 않았거나 이미 종료되었습니다.`,
          detail_code: "02",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ validateBuyMyTikkleRequest : 🐞 ${error}`);
      throw error;
    }
  }

  assertTikklingIsStopped() {
    try {
      if (this.state_id == 1) {
        throw new ExpectedError({
          status: "403",
          message: `비정상적 요청, 아직 진행중인 티클링입니다. 먼저 중단한 뒤 해당 api를 요청하세요`,
          detail_code: "01",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ assertMyTikklingIsNotEnded : 🐞 ${error}`);
      throw error;
    }
  }

  assertTikklingisMine({ user_id }) {
    try {
      if (this.user_id !== user_id) {
        throw new ExpectedError({
          status: "401",
          message: `비정상적 요청, 해당 티클링의 소유자가 아닙니다.`,
          detail_code: "00",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ validateMyTikkling : 🐞 ${error}`);
      throw error;
    }
  }

  validateSendMessageRequest({ sent_user_id }) {
    try{
      if (this.user_id == sent_user_id) {
        throw new ExpectedError({
          status: "403",
          message: `비정상적 요청, 자신에게 티클을 보낼 수 없습니다.`,
          detail_code: "00",
        });
      }
      if (this.terminated_at != null) {
        throw new ExpectedError({
          status: "403",
          message: `비정상적 요청, 티클링이 진행중이 아닙니다.`,
          detail_code: "01",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ validateSendMessageRequest : 🐞 ${error}`);
      throw error;

    }
      

  }

  async validateSendTikkleRequest({ tikkle_quantity }) {
    try {
      //티클링이 현재 진행중인지 확인
      if (this.state_id !== 1) {
        throw new ExpectedError({
          status: "403",
          message: `티클링이 진행중이 아닙니다.`,
          detail_code: "01",
        });
      }
      //보내려는 티클 수량을 받을 수 있는지 확인
      if (parseInt(this.tikkle_quantity) < parseInt(this.tikkle_count) + parseInt(tikkle_quantity)) {
        throw new ExpectedError({
          status: "403",
          message: `티클을 받을 수 있는 수량을 초과하였습니다.${typeof this.tikkle_quantity} ${typeof this.tikkle_count} ${typeof tikkle_quantity}`,
          detail_code: "02",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ validateSendTikkleRequest : 🐞 ${error}`);
      throw error;
    }
  }

  /**
   * Asynchronously lock tikkling row for insert tikkle
   */
  async lockTikklingForInsertTikkle() {
    try {
      this.db.executeQuery(`SELECT * FROM tikkling WHERE id = ? FOR UPDATE;`, [this.id]);
    } catch (error) {
      console.error(`🚨 error -> ⚡️ lockTikklingForInsertTikkle : 🐞 ${error}`);
      throw error;
    }
  }

  async checkAndUpdateTikklingStateToEnd({ tikkle_quantity }) {
    try {
      if (parseInt(this.tikkle_quantity) == parseInt(this.tikkle_count) + parseInt(tikkle_quantity)) {
        await this.db.executeQuery(`UPDATE tikkling SET state_id = 4 WHERE id = ?;`, [this.id]);
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ checkAndUpdateTikklingStateToEnd : 🐞 ${error}`);
      throw error;
    }
  }

  async buyMyTikkle({ merchant_uid }) {
    try {
      const results = await this.db.executeQuery(`INSERT INTO sending_tikkle (tikkling_id, user_id, quantity, merchant_uid) VALUES (?, ?, ?, ?); `, [
        this.id,
        this.user_id,
        this.tikkle_quantity - this.tikkle_count,
        merchant_uid,
      ]);
      if (results.affectedRows == 0) {
        console.error(`🚨 error -> ⚡️ buyMyTikkle : 🐞 티클의 구매가 이루어지지않음`);
        throw new ExpectedError({
          status: "500",
          message: `서버에러`,
          detail_code: "00",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ buyMyTikkle : 🐞 ${error}`);
      throw error;
    }
  }

  /**
   * Asynchronously check validation of create tikkling request
   * @returns {void}
   * @throws {ExpectedError} Throws an ExpectedError with status 403 if the request is invalid.
   * @memberof Tikkling
   * @instance
   * @async
   * @example
   * const new_tikkling = new Tikkling({ user_id: id, funding_limit, tikkle_quantity, product_id, type, db });
   * tikkling.validateBuyMyTikkleRequest();
   * // => throw ExpectedError with status 403 if the request is invalid.
   *
   */
  async validateCreaetTikklingRequest() {
    try {
      //funding_limit 검증
      const difUnit = 8;
      const today = new Date();
      const funding_limit = new Date(this.funding_limit);
      const diff = funding_limit.getTime() - today.getTime();
      const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
      if (diffDays > difUnit || diffDays < 0) {
        throw new ExpectedError({
          status: "403",
          message: `잘못된 요청, 티클링 마감일은 ${difUnit}일 이내여야 합니다. 이를 수정하고 싶다면 diffUnit의 변경을 요청해주세요`,
          detail_code: "04",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ validateSendTikkleRequest : 🐞 ${error}`);
      throw error;
    }
  }

  async createShareLink(tikkling_id, user_name) {
    try{
      const FIREBASE_WEB_API_KEY = await getSSMParameter("FIREBASE_WEB_API_KEY");
      const uriKey = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${FIREBASE_WEB_API_KEY}`;
      const result = await axios({
        method: 'post',
        url: uriKey,
        data: {
          dynamicLinkInfo: {
            domainUriPrefix: 'https://tikkle.lifoli.co.kr',
            link: `https://tikkle.lifoli.co.kr/tikkling/${tikkling_id}`,
            androidInfo: {
              androidPackageName: 'com.tikkle_revive_ios',
            },
            iosInfo: {
              iosBundleId: 'org.reactjs.native.example.tikkle-revive-ios',
              iosAppStoreId: '6471217574',
            },
            socialMetaTagInfo: {
              socialTitle: `${user_name}님의 티클링!`,
              socialDescription: `${user_name}님의 티클링을 확인해보세요!`,
              socialImageLink:
                'https://d2da4yi19up8sp.cloudfront.net/share_link_image.jpg',
            },
          },
          suffix: {
            option: 'SHORT',
          },
        },
      });
      return result.data.shortLink;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ createShareLink : 🐞 ${error}`);
      throw error;
    }
  }
  /**
   * 티클링 생성
   * @returns {void}
   * @throws {ExpectedError} Throws an ExpectedError with status 403 if the request is invalid.
   * @memberof Tikkling
   * @instance
   * @async
   * @return {number} - 생성된 티클링의 id
   * @example
   * const new_tikkling = new Tikkling({ user_id: id, funding_limit, tikkle_quantity, product_id, type, db });
   * new_tikkling.saveTikkling();
   * // => throw ExpectedError with status 403 if the request is invalid.
   */
  async saveTikkling(user_name) {
    try {
      const results = await this.db.executeQuery(`INSERT INTO tikkling (user_id, funding_limit, tikkle_quantity, product_id, type, option_combination_id) VALUES (?, ?, ?, ?, ?, ?); `, [
        this.user_id,
        this.funding_limit,
        this.tikkle_quantity,
        this.product_id,
        this.type,
        this.option_combination_id,
      ]);
      //tikkling_id와 user_name을 이용하여 share_link 생성
      const share_link = await this.createShareLink(results.insertId, user_name);
      //tikkling에 share_linke 추가
      await this.db.executeQuery(`UPDATE tikkling SET share_link = ? WHERE id = ?;`, [share_link, results.insertId]);
      if (results.affectedRows == 0) {
        console.error(`🚨 error -> ⚡️ createTikkling : 🐞 티클링 생성 실패`);
        throw error;
      }
      return results.insertId;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ createTikkling : 🐞 ${error}`);
      throw error;
    }
  }

  //받은 티클이 0인지 확인
  assertTikkleCountIsZero() {
    try {
      if (this.tikkle_count != 0) {
        throw new ExpectedError({
          status: "401",
          message: `티클을 받은 상태입니다.`,
          detail_code: "00",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ assertTikkleCountIsZero : 🐞 ${error}`);
      throw error;
    }
  }

  //받은 티클이 0인지 확인
  assertTikkleCountIsNotZero() {
    try {
      if (this.tikkle_count == 0) {
        throw new ExpectedError({
          status: "401",
          message: `티클을 받지 않은 상태입니다.`,
          detail_code: "00",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ assertTikkleCountIsZero : 🐞 ${error}`);
      throw error;
    }
  }

  decreaseTikklingTicket() {
    try {
      this.db.executeQuery(`UPDATE users SET tikkling_ticket = tikkling_ticket - 1 WHERE id = ?`, [this.user_id]);
    } catch (error) {
      console.error(`🚨 error -> ⚡️ decreaseTikkleQuantity : 🐞 ${error}`);
      throw error;
    }
  }

  async increaseTikklingTicket() {
    try {
      await this.db.executeQuery(`UPDATE users SET tikkling_ticket = tikkling_ticket + 1 WHERE id = ?`, [this.user_id]);
    } catch (error) {
      console.error(`🚨 error -> ⚡️ increaseTikklingTicket : 🐞 ${error}`);
      throw error;
    }
  }

  async decreaseOptionCombinationQuantity() {
    try {
      await this.db.executeQuery(`UPDATE option_combination SET quantity = quantity + 1 WHERE id = ?`, [this.option_combination_id]);
    } catch (error) {
      console.error(`🚨 error -> ⚡️ increaseOptionCombinationQuantity : 🐞 ${error}`);
      throw error;
    }
  }

  increaseOptionCombinationQuantity() {
    try {
      this.db.executeQuery(`UPDATE option_combination SET quantity = quantity + 1 WHERE id = ?`, [this.option_combination_id]);
    } catch (error) {
      console.error(`🚨 error -> ⚡️ increaseOptionCombinationQuantity : 🐞 ${error}`);
      throw error;
    }
  }

  //티클링을 취소상태로 만드는 함수
  async cancelTikkling() {
    try {
      if (this.state_id && this.terminated_at && this.resolution_type) {
        this.state_id = 2;
        this.terminated_at = new Date();
        this.resolution_type = "cancel";
      }
      const results = await this.db.executeQuery(`UPDATE tikkling SET state_id = 2, terminated_at = now(), resolution_type = 'cancel' WHERE id = ?;`, [this.id]);
      if (results.affectedRows == 0) {
        console.error(`🚨 error -> ⚡️ cancelTikkling : 🐞 티클링 취소 실패`);
        throw error;
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ cancelTikkling : 🐞 ${error}`);
      throw error;
    }
  }

  async updateTikklingToRefund() {
    try {
      const results = await this.db.executeQuery(`UPDATE tikkling SET terminated_at = now(), resolution_type = 'refund' WHERE id = ?;`, [this.id]);
      if (results.affectedRows == 0) {
        throw error;
      }
      this.resolution_type = "refund";
    } catch (error) {
      console.error(`🚨 error -> ⚡️ updateTikklingToRefund : 🐞 ${error}`);
      throw error;
    }
  }

  async updateTikklingToGoods() {
    try {
      const results = await this.db.executeQuery(`UPDATE tikkling SET terminated_at = now(), resolution_type = 'goods' WHERE id = ?;`, [this.id]);
      if (results.affectedRows == 0) {
        throw error;
      }
      this.resolution_type = "goods";
    } catch (error) {
      console.error(`🚨 error -> ⚡️ updateTikklingToRefund : 🐞 ${error}`);
      throw error;
    }
  }

  async assertAllTikkleIsArrived() {
    try {
      if (this.tikkle_count != this.tikkle_quantity) {
        throw new ExpectedError({
          status: "400",
          message: `아직 모든 티클이 도착하지 않았습니다.`,
          detail_code: "01",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ assertAllTikkleIsArrived : 🐞 ${error}`);
      throw error;
    }
  }

  async updateAllTikkleToUsed() {
    try {
      const result = await this.db.executeQuery(`UPDATE sending_tikkle SET state_id = 2 WHERE tikkling_id = ? AND state_id = 1;`, [this.id]);
      if (result.affectedRows == 0) {
        throw new ExpectedError({
          status: "400",
          message: `사용할 수 있는 티클이 없습니다.`,
          detail_code: "01",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ updateTikklingToUsed : 🐞 ${error}`);
      throw error;
    }
  }
  async updateAllTikkleToRefund() {
    try {
      const result = await this.db.executeQuery(`UPDATE sending_tikkle SET state_id = 4 WHERE tikkling_id = ? AND state_id = 1;`, [this.id]);
      if (result.affectedRows == 0) {
        throw new ExpectedError({
          status: "400",
          message: `사용할 수 있는 티클이 없습니다.`,
          detail_code: "01",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ updateTikklingToUsed : 🐞 ${error}`);
      throw error;
    }
  }
}

module.exports = { Tikkling };
