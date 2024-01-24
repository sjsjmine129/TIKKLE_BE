const { Tikkling } = require("../../features/Tikkling");
const { Response } = require("../../features/Response");
const { User } = require("../../features/User");
const { ExpectedError } = require("../../features/ExpectedError");
const { DBManager } = require("../../db");
const { Product, Brand } = require("../../features/Product");

exports.get_product_options = async (req, res) => {
  const id = req.id;
  const returnToken = req.returnToken;
  const { product_id } = req.params;

  const db = new DBManager();
  await db.openTransaction();
  try {
    const product = new Product({ id: product_id, db });
    await product.loadProductOptions();
    //db객체 전부 삭제
    // TODO: 함수화 시켜서 사용하기
    for (const category of Object.keys(product.product_options.formatted_option)) {
      for (const option of product.product_options.formatted_option[category]) option.db = null;
    }

    const product_options = await product.product_options.getFormattedOption();
    return res.status(200).send(Response.create(true, "00", "성공적으로 상품 옵션을 조회하였습니다.", product_options, returnToken));
  } catch (err) {
    console.error(`🚨 error -> ⚡️ get_product_options : 🐞${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }
};
