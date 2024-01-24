const { ExpectedError } = require("./ExpectedError.js");

class ActionFunnelLogManager {
  constructor({ user_id, db }) {
    this.user_id = user_id;
    this.signup = false;
    this.move_to_home = false;
    this.move_to_product = false;
    this.move_to_product_detail = false;
    this.search_product = false;
    this.start_tikkling = false;
    this.send_tikkle = false;
    this.db = db;
  }

  static async createActionFunnelLogManager({ user_id, db }) {
    try {
      const action_funnel_log_manager = new ActionFunnelLogManager({ user_id, db });
      await action_funnel_log_manager.getUserLog();
      return action_funnel_log_manager;
    } catch (error) {
      console.error(`🚨 error -> ⚡️ createActionFunnelLogManager : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }

  async markFunnelLog(action) {
    try {
      switch (action) {
        case "signup":
          this.signup = true;
          break;
        case "move_to_home":
          console;
          this.move_to_home = true;
          break;
        case "move_to_product":
          this.move_to_product = true;
          break;
        case "move_to_product_detail":
          this.move_to_tikkling = true;
          break;
        case "search_product":
          this.search_product = true;
          break;
        case "start_tikkling":
          this.start_tikkling = true;
          break;
        case "send_tikkle":
          this.send_tikkle = true;
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ markFunnelLog : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }
  async getUserLog() {
    try {
      const user_logs = await this.db.executeQuery(`SELECT * FROM funnel_log WHERE user_id = ?`, [this.user_id]);
      const log_id_dic = {
        1: "signup",
        2: "move_to_home",
        3: "move_to_product",
        4: "move_to_product_detail",
        5: "search_product",
        6: "start_tikkling",
        8: "send_tikkle",
      };
      for (const log of user_logs) {
        await this.markFunnelLog(log_id_dic[log.funnel_action_id]);
      }
      if (this.signup == false) {
        await this.db.executeQuery(`INSERT INTO funnel_log (user_id, funnel_action_id) VALUES (?, ?)`, [this.user_id, 1]);
        this.signup = true;
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ getUserLog : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }

  async logControllInterface(route) {
    try {
      switch (route) {
        case "/post_auth_registerUser":
          if (this.signup == false) {
            this.signup = true;
            await this.db.executeQuery(`INSERT INTO funnel_log (user_id, funnel_action_id) VALUES (?, ?)`, [this.user_id, 1]);
          }
          break;

        case "/get_user_myWishlist":
          if (this.move_to_home == false) {
            this.move_to_tikkling = true;
            await this.db.executeQuery(`INSERT INTO funnel_log (user_id, funnel_action_id) VALUES (?, ?)`, [this.user_id, 2]);
          }
          break;
        case "/post_product_list":
          if (this.move_to_product == false) {
            this.move_to_home = true;
            await this.db.executeQuery(`INSERT INTO funnel_log (user_id, funnel_action_id) VALUES (?, ?)`, [this.user_id, 3]);
          }

          break;
        case "/post_product_info":
          if (this.move_to_product_detail == false) {
            this.move_to_product_detail = true;
            await this.db.executeQuery(`INSERT INTO funnel_log (user_id, funnel_action_id) VALUES (?, ?)`, [this.user_id, 4]);
          }
          break;

        case "/post_product_search":
          if (this.search_product == false) {
            this.search_product = true;
            await this.db.executeQuery(`INSERT INTO funnel_log (user_id, funnel_action_id) VALUES (?, ?)`, [this.user_id, 5]);
          }
          break;
        case "/post_tikkling_create":
          if (this.start_tikkling == false) {
            this.start_tikkling = true;
            await this.db.executeQuery(`INSERT INTO funnel_log (user_id, funnel_action_id) VALUES (?, ?)`, [this.user_id, 6]);
          }
          break;
        case "/post_payment_init/:tikkleAction":
          if (this.send_tikkle == false) {
            this.send_tikkle = true;
            await this.db.executeQuery(`INSERT INTO funnel_log (user_id, funnel_action_id) VALUES (?, ?)`, [this.user_id, 8]);
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`🚨 error -> ⚡️ logControllInterface : 🐞 ${error}`);
      throw new ExpectedError(error);
    }
  }
}

module.exports = { ActionFunnelLogManager };
