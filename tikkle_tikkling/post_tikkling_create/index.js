const { Tikkling } = require("../../features/Tikkling");
const { Response } = require("../../features/Response");
const { User } = require("../../features/User");
const { ExpectedError } = require("../../features/ExpectedError");
const { DBManager } = require("../../db");
const { Product } = require("../../features/Product");

exports.post_tikkling_create = async (req, res) => {
  const id = req.id;
  const returnToken = req.returnToken;
  const { funding_limit, tikkle_quantity, product_id, type, product_option } = req.body;

  //main logic------------------------------------------------------------------------------------------------------------------//
  const db = new DBManager();
  await db.openTransaction();
  try {
    const product = await Product.createById({ id: product_id, db });
    await product.loadProductOptions();
    await product.updateSelectedOption(product_option);
    await product.loadSelectedProductOptionCombination();

    const user = await User.createById({ id, db });
    const new_tikkling = new Tikkling({ user_id: id, funding_limit, tikkle_quantity, product_id, type, option_combination_id: product.selected_option_combination.id, db });

    //해당 상품에 대해서 lock
    product.lockProduct();

    //유효성 검사
    await Promise.all([
      //상품 옵션에 대한 유효성 검사
      product.validateProductOption(product_option),
      //상품 수량에 대한 유효성 검사
      product.validateProductOptionCombination(),
      //상품 가격에 대한 유효성 검사
      product.validateProductPrice(tikkle_quantity * 5000),
      //티클링 요청에 대한 유효성 검사 -> 취소
      // new_tikkling.validateCreaetTikklingRequest(),
      //유저에 대한 유효성 검사
      user.validatteUserForStartTikkling(),
    ]);
    let tikkling_id = null;
    [tikkling_id] = await Promise.all([
      //티클링 생성
      new_tikkling.saveTikkling(user.name),
      //상품의 재고를 감소시킴
      product.decreaseProductQuantity(),
      //유저의 티클링 티켓을 감소시킴
      user.decreaseTikkleTicket(),
      //위시리스트 제거
      user.deleteWishlist(product_id),
    ]);

    await db.commitTransaction();

    return res.status(200).send(Response.create(true, "00", "티클링 생성을 성공하였습니다.", { tikkling_id }, returnToken));
  } catch (err) {
    await db.rollbackTransaction();
    console.error(`🚨 error -> ⚡️ post_tikkling_create : 🐞${err}`);
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 에러"));
  }
};
