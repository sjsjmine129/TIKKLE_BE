const { ExpectedError } = require("./ExpectedError.js");
const { getSSMParameter } = require("ssm.js");
//=========================================Model=======================================================
class Delivery {
  constructor({
    id,
    invoice_number,
    courier_company_code,
    tikkling_id,
    state_id,
    zonecode,
    address,
    detail_address,
    created_at,
    start_delivery_date,
    expected_delivery_date,
    actual_delivery_date,
    courier_company_name,
    db,
  }) {
    this.id = id || null;
    this.invoice_number = invoice_number || null;
    this.courier_company_code = courier_company_code || null;
    this.tikkling_id = tikkling_id || null;
    this.state_id = state_id || null;
    this.zonecode = zonecode || null;
    this.address = address || null;
    this.detail_address = detail_address || null;
    this.created_at = created_at || null;
    this.start_delivery_date = start_delivery_date || null;
    this.expected_delivery_date = expected_delivery_date || null;
    this.actual_delivery_date = actual_delivery_date || null;
    this.courier_company_name = courier_company_name || null;
    this.db = db || null;
  }

  /**
   * @description 객체를 json으로 변환하는 함수
   */

  toJSON() {
    return {
      id: this.id,
      invoice_number: this.invoice_number,
      courier_company_code: this.courier_company_code,
      tikkling_id: this.tikkling_id,
      state_id: this.state_id,
      zonecode: this.zonecode,
      address: this.address,
      detail_address: this.detail_address,
      created_at: this.created_at,
      start_delivery_date: this.start_delivery_date,
      expected_delivery_date: this.expected_delivery_date,
      actual_delivery_date: this.actual_delivery_date,
      courier_company_name: this.courier_company_name,
    };
  }

  /**
   * delivery_info정보를 통해 스마트 택배 api에서 제공하는 배송정보 확인 링크를 생성
   * @returns {string} 배송조회 링크
   */
  async createDeliveryCheckLink() {
    const t_key = await getSSMParameter("t_key");
    return `http://info.sweettracker.co.kr/tracking/5?t_key=${t_key}&t_code=${this.courier_company_code}&t_invoice=${this.invoice_number}`;
  }

  updateDelivery(row_of_delivery) {
    try {
      this.id = row_of_delivery.id;
      this.invoice_number = row_of_delivery.invoice_number;
      this.courier_company_code = row_of_delivery.courier_company_code;
      this.tikkling_id = row_of_delivery.tikkling_id;
      this.state_id = row_of_delivery.state_id;
      this.zonecode = row_of_delivery.zonecode;
      this.address = row_of_delivery.address;
      this.detail_address = row_of_delivery.detail_address;
      this.created_at = row_of_delivery.created_at;
      this.start_delivery_date = row_of_delivery.start_delivery_date;
      this.expected_delivery_date = row_of_delivery.expected_delivery_date;
      this.actual_delivery_date = row_of_delivery.actual_delivery_date;
      this.courier_company_name = row_of_delivery.courier_company_name;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ updateDelivery : 🐞객체의 모든 값이 전달되지 않았습니다.`);
      throw ExpectedError({
        status: 500,
        detail_code: "00",
        message: "서버에러",
      });
    }
  }

  async loadDeliveryInfoByTikklingId() {
    try {
      if (this.tikkling_id == null) {
        throw new ExpectedError({
          status: 500,
          detail_code: "00",
          message: "tikkling_id가 없습니다.",
        });
      }
      const rows = await this.db.executeQuery(
        `
      SELECT delivery_info.*, courier_company.name as courier_company_name
      FROM delivery_info as delivery_info
      INNER JOIN courier_company AS courier_company ON delivery_info.courier_company_code = courier_company.code
      WHERE tikkling_id = ?`,
        [this.tikkling_id]
      );

      if (rows.length === 0) {
        throw new ExpectedError({
          status: 404,
          detail_code: "01",
          message: "해당 티클링의 시작된 배송 기록이 없습니다.",
        });
      }
      this.updateDelivery(rows[0]);
    } catch (error) {
      console.error(`🚨 error -> ⚡️ loadDeliveryInfoByTikklingId : 🐞${error}`);
      throw error;
    }
  }

  /**
   * 유저아이디를 받고 해당 유저의 가장 최근 티클링에 대한 배송정보를 가져옴
   * @param {number} user_id
   * @returns {void}
   * @async
   *
   */
  async getRecentDeliveryInfoOfUser(user_id) {
    try {
      const rows = await this.db.executeQuery(
        `
      SELECT delivery_info.*, courier_company.name as courier_company_name
      FROM delivery_info as delivery_info 
      INNER JOIN (SELECT * FROM tikkling WHERE user_id = ?) AS user_tikkling ON delivery_info.tikkling_id = user_tikkling.id 
      INNER JOIN (SELECT * FROM courier_company) AS courier_company ON delivery_info.courier_company_code = courier_company.code
      ORDER BY delivery_info.created_at DESC LIMIT 1`,
        [user_id]
      );
      if (rows.length === 0) {
        throw new ExpectedError({
          status: 404,
          detail_code: "01",
          message: "해당 유저의 배송 기록이 없습니다.",
        });
      }
      this.updateDelivery(rows[0]);
      return;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ getRecentDeliveryInfoOfUser : 🐞${error}`);
      throw error;
    }
  }

  async updateDeliveryToConfirmed() {
    try {
      if(this.tikkling_id == null){
        throw new ExpectedError({
          status: 500,
          detail_code: "00",
          message: "tikkling_id가 없습니다.",
        });
      }
      if (this.state_id == 4) {
        throw new ExpectedError({
          status: 400,
          detail_code: "00",
          message: "이미 수령처리된 배송정보입니다.",
        }); 
      }
      const result = await this.db.executeQuery(`UPDATE delivery_info SET state_id = 4, actual_delivery_date = NOW() WHERE tikkling_id = ?`, [this.tikkling_id]);
      
      if (result.affectedRows === 0) {
        throw new ExpectedError({
          status: 500,
          detail_code: "00",
          message: "배송 정보 저장 실패",
        });
      }
      this.state_id = 4;
      return;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ updateDeliveryToConrimed : 🐞${error}`);
      throw error;
    }
  }

  /**
   * @description 주어진 티클링 아이디에 해당하는 배송정보를 가져오는 함수
   * @param {number} tikkling_id
   * @returns
   */

  async getDeliveryInfoByTikklingId(tikkling_id) {
    try {
      const rows = await this.db.executeQuery(
        `
      SELECT delivery_info.*, courier_company.name as courier_company_name 
      FROM delivery_info 
      INNER JOIN courier_company on delivery_info.courier_company_code = courier_company.code
      WHERE tikkling_id = ?`,
        [tikkling_id]
      );
      if (rows.length === 0) {
        throw new ExpectedError({
          status: 404,
          etail_code: "02",
          message: "해당 티클링의 배송 기록이 없습니다.",
        });
      }
      this.updateDelivery(rows[0]);
      return;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ getDeliveryInfoByTikklingId : 🐞${error}`);
      throw error;
    }
  }

  async saveDeliveryData() {
    try {
      const result = await this.db.executeQuery(`INSERT INTO delivery_info (tikkling_id, state_id, zonecode, address, detail_address) VALUES (?, ?, ?, ?, ?)`, [
        this.tikkling_id,
        this.state_id,
        this.zonecode,
        this.address,
        this.detail_address,
      ]);
      if (result.affectedRows === 0) {
        throw new ExpectedError({
          status: 500,
          detail_code: "00",
          message: "배송 정보 저장 실패",
        });
      }
      this.id = result.insertId;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ saveDeleveryData : 🐞${error}`);
      throw error;
    }
  }
}

//=========================================Repository=======================================================

module.exports = { Delivery };
