const { ActionFunnelLogManager } = require("./features/ActionFunnelLogManager");
const { DBManager } = require("./db");
exports.actionFunnelLogger = async (req, res, next) => {
  const db = new DBManager();
  await db.openTransaction();
  try {
    const user_id = req.id;

    const funnel_log_manager = await ActionFunnelLogManager.createActionFunnelLogManager({ user_id, db });

    // console.error(req.path);
    // console.error(req.method);
    // console.error(req.route);
    if (req.route == "/post_product_list") {
      if (req.body.search == null || req.body.search == undefined || req.body.search == "") {
        await funnel_log_manager.logControllInterface(req.route);
      } else {
        await funnel_log_manager.logControllInterface("/post_product_search");
      }
    } else {
      await funnel_log_manager.logControllInterface(req.route);
    }
    await db.commitTransaction();
  } catch (error) {
    await db.rollbackTransaction();
    //return invalid when token is invalid
    console.error(`🚨 error -> ⚡️ actionFunnelLogger : 🐞${error}`);
  }

  next();
};
