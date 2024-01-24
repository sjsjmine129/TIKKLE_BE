const { queryDatabase } = require("db.js");

exports.post_product_list = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  let category_id = body.category_id;
  let priceMin = body.priceMin;
  let priceMax = body.priceMax;
  const sortAttribute = body.sortAttribute;
  const sortWay = body.sortWay;
  let search = body.search;
  const getNum = body.getNum;

  //-------- check input --------------------------------------------------------------------------------------//

  //check category_id
  if (category_id == null || typeof category_id !== "number" || !Number.isInteger(category_id) || category_id > 20) {
    // console.log("post_product_list 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "01",
      message: "category_id value is null or invalid",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }
  //check priceMin, priceMax
  if (!priceMin) {
    priceMin = 0;
  }
  if (!priceMax) {
    priceMax = 9999999999;
  }

  if (
    typeof priceMin !== "number" ||
    typeof priceMax !== "number" ||
    !Number.isInteger(priceMin) ||
    !Number.isInteger(priceMax) ||
    priceMin < 0 ||
    priceMax < priceMin ||
    priceMax > 9999999999 ||
    priceMax < 0
  ) {
    // console.log("post_product_list 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "02",
      message: "priceMin or priceMax value is null or invalid",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //check sortAttribute
  if (!sortAttribute || typeof sortAttribute !== "string" || sortAttribute.length > 30) {
    //return invalid
    // console.log(" post_product_list 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "03",
      message: "sortAttribute value is null or invalid",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  if (sortAttribute != "sales_volume" && sortAttribute != "price" && sortAttribute != "views" && sortAttribute != "wishlist_count") {
    //return invalid
    // console.log("post_product_list 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "03",
      message: "sortAttribute value is null or invalid",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //check sortWay
  if (!sortWay || typeof sortWay !== "string" || (sortWay !== "ASC" && sortWay !== "DESC")) {
    //return invalid
    // console.log("post_product_list 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "04",
      message: "sortWay value is null or invalid",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //check search
  if (search && (typeof search !== "string" || search.length > 100)) {
    //return invalid
    // console.log("post_product_list 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "05",
      message: "search value is invalid",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //check getNum
  if (!getNum || typeof getNum !== "number" || !Number.isInteger(getNum) || getNum < 0) {
    // console.log("post_product_list 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "06",
      message: "getNum value is null or invalid",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //-------- check DB --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    let rows;
    if (!search) {
      if (category_id == 0) {
        rows = await queryDatabase(
          `	SELECT p.*, b.brand_name, pc.name AS cat_name, uwl.product_id AS wishlisted
            FROM products p
            INNER JOIN brands b ON p.brand_id = b.id
            INNER JOIN product_category pc ON p.category_id = pc.id
            LEFT JOIN user_wish_list uwl ON p.id = uwl.product_id AND uwl.user_id = ? 
            WHERE p.price BETWEEN ? AND ?
              AND p.is_deleted = 0
            ORDER BY ${sortAttribute} ${sortWay}
            LIMIT 20 OFFSET ?;
          `,
          [id, priceMin, priceMax, (getNum - 1) * 20]
        );
      } else {
        rows = await queryDatabase(
          `	SELECT p.*, b.brand_name, pc.name AS cat_name, uwl.product_id AS wishlisted
            FROM products p
            INNER JOIN brands b ON p.brand_id = b.id
            INNER JOIN product_category pc ON p.category_id = pc.id
            LEFT JOIN user_wish_list uwl ON p.id = uwl.product_id AND uwl.user_id = ? 
            WHERE p.category_id = ?
              AND p.price BETWEEN ? AND ?
              AND p.is_deleted = 0
            ORDER BY ${sortAttribute} ${sortWay}
            LIMIT 20 OFFSET ?;
          `,
          [id, category_id, priceMin, priceMax, (getNum - 1) * 20]
        );
      }
    } else {
      if (category_id == 0) {
        rows = await queryDatabase(
          ` SELECT p.*, b.brand_name, pc.name AS cat_name, uwl.product_id AS wishlisted
          FROM products p
          INNER JOIN brands b ON p.brand_id = b.id
          INNER JOIN product_category pc ON p.category_id = pc.id
          LEFT JOIN user_wish_list uwl ON p.id = uwl.product_id AND uwl.user_id = ? 
          WHERE p.price BETWEEN ? AND ?
            AND p.is_deleted = 0
            AND (p.name  LIKE '%${search}%' OR description LIKE '%${search}%')
          ORDER BY ${sortAttribute} ${sortWay}
          LIMIT 20 OFFSET ?;
        `,
          [id, priceMin, priceMax, (getNum - 1) * 20]
        );
      } else {
        rows = await queryDatabase(
          ` SELECT p.*, b.brand_name, pc.name AS cat_name, uwl.product_id AS wishlisted
          FROM products p
          INNER JOIN brands b ON p.brand_id = b.id
          INNER JOIN product_category pc ON p.category_id = pc.id
          LEFT JOIN user_wish_list uwl ON p.id = uwl.product_id AND uwl.user_id = ? 
          WHERE p.category_id = ?
            AND p.price BETWEEN ? AND ?
            AND p.is_deleted = 0
            AND (p.name  LIKE '%${search}%' OR description LIKE '%${search}%')
          ORDER BY ${sortAttribute} ${sortWay}
          LIMIT 20 OFFSET ?;
        `,
          [id, category_id, priceMin, priceMax, (getNum - 1) * 20]
        );
      }
    }

    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_product_info : 🐞${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  const retData = sqlResult;

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    data: retData,
    detail_code: "00",
    message: "success get product list",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
