const { getSSMParameter } = require("ssm.js");
const { ExpectedError } = require("./ExpectedError.js");

class User {
  constructor({
    id = null,
    name,
    birthday,
    nick = " ",
    phone,
    is_deleted = false,
    gender,
    image = "https://d2da4yi19up8sp.cloudfront.net/profile/profile.png",
    zonecode = null,
    address = null,
    detail_address = null,
    created_at = null,
    is_tikkling = false,
    device_token = null,
    tikkling_ticket = 2,
    account = null,
    bank_code = null,
    last_present_amount = null,
    funnel = "meta_ad",
    source_tikkling_id = null,
    db,
  }) {
    this.id = id;
    this.name = name;
    this.birthday = birthday;
    this.nick = nick;
    this.phone = phone;
    this.is_deleted = is_deleted;
    this.gender = gender;
    this.image = image;
    this.zonecode = zonecode;
    this.address = address;
    this.detail_address = detail_address;
    this.created_at = created_at;
    this.is_tikkling = is_tikkling;
    this.device_token = device_token;
    this.tikkling_ticket = tikkling_ticket;
    this.account = account;
    this.bank_code = bank_code;
    this.funnel = source_tikkling_id ? "share_link" : funnel;
    this.source_tikkling_id = source_tikkling_id;
    this.db = db;
    this.last_present_amount = last_present_amount;
  }

  /**
   * Asynchronously creates a new user with the given ID.
   * @param {number} id - User ID
   * @returns {Promise<User>} - A promise that resolves with a new User instance.
   * @throws {ExpectedError} Throws an ExpectedError with status 500 if the database query fails.
   * @memberof User
   * @static
   * @async
   * @example
   * const user = await User.createById(1);
   * // => User { id: 1, name: '홍길동', ... }
   */
  static createById = async ({ id, db }) => {
    try {
      const query = `SELECT * FROM users WHERE id = ?`;
      const [user] = await db.executeQuery(query, [id]);
      return new User({ ...user, db });
    } catch (error) {
      console.error(`🚨 error -> createById : 🐞${error}`);
      throw error;
    }
  };

  async updateLastPresentAmount(last_present_amount) {
    try {
      const result = await this.db.executeQuery(`UPDATE users SET last_present_amount = ? WHERE id = ?`, [last_present_amount, this.id]);
      if (result.affectedRows !== 1) {
        throw new ExpectedError({
          status: 500,
          detail_code: "00",
          message: "last_present_amount 수정 실패",
        });
      }
      this.last_present_amount = last_present_amount;
      return;
      
    }
    catch (error) {
      console.error(`🚨 error -> updateLastPresentAmount : 🐞${error}`);
      throw error;
    }
  }


  async registerUser() {
    try {
      const result = await this.db.executeQuery(`INSERT INTO users 
      (name, birthday, nick, phone, gender, image, address, detail_address, is_tikkling, tikkling_ticket, funnel)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        this.name,
        this.birthday,
        this.nick,
        this.phone,
        this.gender,
        this.image,
        this.address,
        this.detail_address,
        this.is_tikkling,
        this.tikkling_ticket,
        this.funnel,
      ])
      if (result.affectedRows !== 1) {
        throw new ExpectedError({
          status: 500,
          detail_code: "00",
          message: "유저 등록 실패",
        });
      }
      this.id = result.insertId;
    }
    catch (error) {
      console.error(`🚨 error -> ⚡️ registerUser : 🐞${error}`);
      throw error;
    }
  }

  async logIfUserFromTikkling() {
    try {
      if (this.source_tikkling_id) {
        const result = await this.db.executeQuery(`INSERT INTO shared_tikkling_signup_log (tikkling_id, user_id) VALUES (?, ?)`, [this.source_tikkling_id, this.id]);
        if (result.affectedRows !== 1) {
          throw new ExpectedError({
            status: 500,
            detail_code: "00",
            message: "유저 등록 실패",
          });
        }
      }
    }
    catch (error) {
      console.error(`🚨 error -> logIfUserFromTikkling : 🐞${error}`);
      throw error;
    }
  }

  async validateUserForRegister() {
    try {
      //유저 이름 유효성 검증
      if (!this.name || typeof this.name !== "string" || this.name.length > 30) {
        //return invalid
        throw new ExpectedError({
          status: "400",
          message: `비정상적 요청, 이름 데이터가 올바르지 않습니다.`,
          detail_code: "01",
        });
      }

      //유저 생일 유효성 검증
      const parsedDate = new Date(this.birthday);
      if (isNaN(parsedDate) || Object.prototype.toString.call(parsedDate) !== "[object Date]") {
        throw new ExpectedError({
          status: "400",
          message: `비정상적 요청, 생일 데이터가 올바르지 않습니다.`,
          detail_code: "02",
        });
      }

      // Check if the string matches the numeric pattern and its length is between 9 and 12
      const numericPattern = /^\d+$/;
      if (!this.phone || typeof this.phone !== "string" || this.phone.length < 9 || this.phone.length > 11 || !numericPattern.test(this.phone)) {
        throw new ExpectedError({
          status: "400",
          message: `비정상적 요청, 전화번호 데이터가 올바르지 않습니다.`,
          detail_code: "05",
        });
      }
      // 성별 데이터 체크
      if (!this.gender || typeof this.gender !== "string" || !(this.gender === "male" || this.gender === "female" || this.gender === "others")) {
        throw new ExpectedError({
          status: "400",
          message: `비정상적 요청, 성별 데이터가 올바르지 않습니다.`,
          detail_code: "06",
        });
      }

      //닉네임 유효성 검증
      // if (!this.nick || typeof this.nick !== "string" || this.nick.length > 30) {
      //   throw new ExpectedError({
      //     status: "400",
      //     message: `비정상적 요청, 닉네임 데이터가 올바르지 않습니다.`,
      //     detail_code: "04",
      //   });
      // }
    }
    catch (error) {
      console.error(`🚨 error -> validateUserForRegister : 🐞${error}`);
      throw error;
    }
  }

  async restrictUserUnder14() {
    try {
      const dob = new Date(this.birthday);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();

      // Check if birthday hasn't occurred yet this year
      if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 14) {
        throw new ExpectedError({
          status: "400",
          message: `회원가입 실패, 만 14세 미만은 가입할 수 없습니다.`,
          detail_code: "03",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> restrictUserForRegister : 🐞${error}`);
      throw error;
    }
  }
  

  async validatteUserForStartTikkling() {
    try {
      // 현재 티클링이 진행중인지 확인
      if (this.is_tikkling) {
        throw new ExpectedError({
          status: "403",
          message: `비정상적 요청, 이미 티클링중인 유저입니다.`,
          detail_code: "01",
        });
      }
      // 티클링 티켓이 남아있는지 확인
      if (this.tikkling_ticket == 0) {
        throw new ExpectedError({
          status: "403",
          message: `비정상적 요청, 티클링 티켓이 없습니다.`,
          detail_code: "02",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ validatteUser : 🐞 ${error}`);
      throw error;
    }
  }
  async decreaseTikkleTicket() {
    try {
      if (this.tikkling_ticket) {
        this.tikkling_ticket -= 1;
      }
      const query = `UPDATE users SET tikkling_ticket = tikkling_ticket - 1 WHERE id = ?`;
      await this.db.executeQuery(query, [this.id]);
    } catch (error) {
      console.error(`🚨 error -> decreaseTikkleTicket : 🐞${error}`);
      throw error;
    }
  }

  async increaseTikkleTicket() {
    try {
      if (this.tikkling_ticket) {
        this.tikkling_ticket += 1;
      }
      const query = `UPDATE users SET tikkling_ticket = tikkling_ticket + 1 WHERE id = ?`;
      await this.db.executeQuery(query, [this.id]);
    } catch (error) {
      console.error(`🚨 error -> decreaseTikkleTicket : 🐞${error}`);
      throw error;
    }
  }

  async deleteWishlist(product_id) {
    try {
      const query = `DELETE FROM user_wish_list WHERE user_id = ? AND product_id = ?`;
      await this.db.executeQuery(query, [this.id, product_id]);
    } catch (error) {
      console.error(`🚨 error -> deleteWishlist : 🐞${error}`);
      throw error;
    }
  }

  validateAddress() {
    try {
      if (
        !this.zonecode ||
        !this.address ||
        !this.detail_address ||
        typeof this.zonecode !== "string" ||
        typeof this.address !== "string" ||
        typeof this.detail_address !== "string" ||
        this.zonecode.length !== 5 ||
        this.address.length > 250 ||
        this.detail_address.length > 250
      ) {
        throw new ExpectedError({
          status: "400",
          message: `비정상적 요청, 주소 데이터가 올바르지 않습니다.`,
          detail_code: "05",
        });
      }
    } catch (error) {
      console.error(`🚨 error -> validateAddress : 🐞${error}`);
      throw error;
    }
  }
}

module.exports = { User };
