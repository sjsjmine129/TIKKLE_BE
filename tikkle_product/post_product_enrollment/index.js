const { Tikkling } = require("../../features/Tikkling");
const { Response } = require("../../features/Response");
const { User } = require("../../features/User");
const { ExpectedError } = require("../../features/ExpectedError");
const { DBManager } = require("../../db");
const { Product, Brand } = require("../../features/Product");

exports.post_product_enrollment = async (req, res) => {
  const id = req.id;
  const returnToken = req.returnToken;
  const { product_list } = req.body;
  //main logic------------------------------------------------------------------------------------------------------------------//
  const db = new DBManager();
  await db.openTransaction();
  try {
    //모든 상품 등록
    let flag;
    let product_obj_list = await Promise.all(
      product_list.map(async (product) => {
        const is_uploaded = await Product.checkIsUploaded(product.name, db);
        //이미 업로드 된 것은 Null로 반환
        if (is_uploaded) {
          return null;
        }
        // 업로드 된 적이 없으면 새로 등록
        const new_product = await Product.createUnregisteredProduct(product, db);
        return new_product;
      })
    );

    //이미 등록되어 null값으로 반환된 상품들 제거
    product_obj_list = product_obj_list.filter((product) => product !== null);
    // const product_obj_list = await Product.createProductList(product_list, db);
    // console.log(product_obj_list);
    //옵션들 등록
    for (const product_obj of product_obj_list) {
      await product_obj.product_options.formatOptionList();
      await product_obj.product_options.formatCombinationList();
      await product_obj.product_options.uploadProductOptions();
      await product_obj.product_options.uploadProductOptionCombinations();
    }
    await db.commitTransaction();

    return res.status(200).send(Response.create(true, "00", "상품을 성공적으로 추가하였습니다.", null, returnToken));
  } catch (err) {
    await db.rollbackTransaction();
    console.error(`🚨 error -> ⚡️ post_product_enrollment : 🐞${err}`);
    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 에러"));
  }
};
