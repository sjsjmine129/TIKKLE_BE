const { ExpectedError } = require("./ExpectedError.js");
const crypto = require("crypto");
class InviteEventManager {
  constructor({ db }) {
    this.is_event = true;
    this.invited_user_id = null;
    this.sent_tikkle_id = null;
    this.bonus_tikkle_id = null;
    this.tikkling_id = null;
    this.inviter_user_id = null;
    this.db = db;
  }

  async eventProcessAfterTikkleSent(merchant_uid, tikkling_obj, tikkle) {
    try {
      // 이벤트가 진행중인지 확인
      if (this.is_event === false) return;
      // 해당 티클의 정보를 가져옴
      await this._getSentTikkleInfoByMerchantUid(merchant_uid);
      // 자기 자신에게 보낸 티클이라면 보너스 티클을 전송하지 않음
      if (this.invited_user_id === this.inviter_user_id) return;
      // 해당 유저가 이벤트에 참여한 이력이 있는지 확인
      const userAttendedEvent = await this._checkUserAttendanceForEvent(this.invited_user_id);
      // 만약에 없다면 보너스 티클을 전송
      if (userAttendedEvent === false) {
        // 전체 보너스 티클이 200만원 이상이라면 보너스 티클을 전송하지 않음
        const bonus_tikkle_amount = await this._carculateBonusTikkleAmount();
        if (bonus_tikkle_amount >= 2000000) {
          return;
        }
        if (bonus_tikkle_amount < 2000000) {
          // 보너스 티클을 전송
          await this._sendBonusTikkle();
          // 전송한 보너스 티클을 event table에 기록
          await this._markBonusTikkle();
          await tikkling_obj.checkAndUpdateTikklingStateToEnd({ tikkle_quantity: tikkle.quantity + 1 });
        }
      }
      return;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ eventProcessAfterTikkleSent : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }

  async eventProcessAfterTikkleRefunded(sent_tikkle_id) {
    try {
      this.sent_tikkle_id = sent_tikkle_id;
      // 엮여있는 보너스 티클을 취소
      await this._cancelBonusTikkleOfTikkle();
    } catch (error) {
      console.error(`🚨 error -> ⚡️ eventProcessAfterTikkleRefunded : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }

  async eventProcessBeforeTikklingRefund(tikkling_id) {
    try {
      this.tikkling_id = tikkling_id;
      //보너스 티클은 취소
      await this._cancelBonusTikkleOfTikkling();
    } catch (error) {
      console.error(`🚨 error -> ⚡️ eventProcessAfterTikkleRefunded : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }

  async _getSentTikkleInfoByMerchantUid(merchant_uid) {
    try {
      const rows = await this.db.executeQuery("SELECT sending_tikkle.id as sent_tikkle_id, sending_tikkle.tikkling_id as tikkling_id, sending_tikkle.user_id as invited_user_id, tikkling.user_id as inviter_user_id FROM sending_tikkle inner join tikkling on sending_tikkle.tikkling_id = tikkling.id WHERE merchant_uid = ?", [merchant_uid]);
      this.sent_tikkle_id = rows[0].sent_tikkle_id;
      this.tikkling_id = rows[0].tikkling_id;
      this.invited_user_id = rows[0].invited_user_id;
      this.inviter_user_id = rows[0].inviter_user_id;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ _getSentTikkleInfoByMerchantUid : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }

  //tikkle구매유저가 이전에 티클을 구매한 이력이 있는지 확인
  async _checkUserAttendanceForEvent() {
    try {
      const rows = await this.db.executeQuery("SELECT * FROM user_invite_event_attandance WHERE invited_user_id = ?", [this.invited_user_id]);
      if (rows.length === 0) {
        return false;
      }
      if (rows.length > 0) {
        return true;
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ _checkUserAttendanceForEvent : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }

  //보너스 티클을 전송
  async _sendBonusTikkle() {
    try {
      const message = "1+1이벤트 보너스 티클!";
      const quantity = 1;
      const user_id = 0;

      const timestamp = new Date().getTime();
      const data = `${user_id}${this.sent_tikkle_id}${timestamp}`;
      const merchant_uid = crypto.createHash("md5").update(data).digest("hex");

      const rows = await this.db.executeQuery("SELECT tikkling_id FROM sending_tikkle WHERE id = ?", [this.sent_tikkle_id]);

      const tikkling_id = rows[0].tikkling_id;
      const result = await this.db.executeQuery("INSERT INTO sending_tikkle (tikkling_id, user_id, message, quantity, merchant_uid) VALUES (?, ?, ?, ?, ?)", [
        tikkling_id,
        user_id,
        message,
        quantity,
        merchant_uid,
      ]);
      this.bonus_tikkle_id = result.insertId;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ _sendBonusTikkle : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }

  //전송한 보너스 티클을 event table에 기록
  async _markBonusTikkle() {
    try {
      await this.db.executeQuery("INSERT INTO user_invite_event_attandance (invited_user_id, sending_tikkle_id, bonus_tikkle_id) VALUES (?, ?, ?)", [
        this.invited_user_id,
        this.sent_tikkle_id,
        this.bonus_tikkle_id,
      ]);
    } catch (error) {
      console.error(`🚨 error -> ⚡️ _markBonusTikkle : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }

  //환급시 티클링에 대한 보너스 티클을 결제 취소 처리
  async _cancelBonusTikkleOfTikkling() {
    try {
      await this.db.executeQuery("UPDATE sending_tikkle SET state_id = 3 WHERE tikkling_id = ? AND user_id = 0", [this.tikkling_id]);
    } catch (error) {
      console.error(`🚨 error -> ⚡️ _cancelBonusTikkleOfTikkling : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }
  //
  async _cancelBonusTikkleOfTikkle() {
    try {
      const rows = await this.db.executeQuery("SELECT * FROM user_invite_event_attandance WHERE sending_tikkle_id = ?;", [this.sent_tikkle_id]);
      if (rows.length === 0) return;
      const bonus_tikkle_id = rows[0].bonus_tikkle_id;
      await this.db.executeQuery("UPDATE sending_tikkle SET state_id = 3 WHERE id = ?", [bonus_tikkle_id]);
    } catch (error) {
      console.error(`🚨 error -> ⚡️ _cancelBonusTikkleOfTikkle : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }

  //제공한 보너스 티클이 얼마인지 확인
  async _carculateBonusTikkleAmount() {
    try {
      const rows = await this.db.executeQuery("SELECT * FROM sending_tikkle WHERE user_id = 0 AND state_id in (1, 2)");
      return rows.length * 5000;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ _carculateBonusTikkleAmount : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }
}

module.exports = { InviteEventManager };
