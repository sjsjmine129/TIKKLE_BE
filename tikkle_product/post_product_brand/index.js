const { Tikkling } = require("../../features/Tikkling");
const { Response } = require("../../features/Response");
const { User } = require("../../features/User");
const { ExpectedError } = require("../../features/ExpectedError");
const { DBManager } = require("../../db");
const { Product, Brand } = require("../../features/Product");

exports.post_product_brand = async (req, res) => {
  const id = req.id;
  const returnToken = req.returnToken;
  const { brand_name_list } = req.body;

  //main logic------------------------------------------------------------------------------------------------------------------//
  const db = new DBManager();
  await db.openTransaction();
  try {
    const list_of_brand = await Brand.checkBrandNameList(brand_name_list, db);

    await db.commitTransaction();

    return res.status(200).send(Response.create(true, "00", "브랜드 id를 성공적으로 불러왔습니다", list_of_brand, returnToken));
  } catch (err) {
    await db.rollbackTransaction();
    console.error(`🚨 error -> ⚡️ post_product_brand : 🐞${err}`);
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 에러"));
  }
};
