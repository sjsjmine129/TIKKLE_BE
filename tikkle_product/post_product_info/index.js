const { queryDatabase } = require("db.js");

exports.post_product_info = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  const productId = body.productId;

  //-------- check DB --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase(
      // 고시정보 데이터 추가하기(인덱스)
      ` SELECT p.*, b.brand_name, pc.name AS cat_name, uwl.product_id AS wishlisted
  			FROM products p
  			INNER JOIN brands b ON p.brand_id = b.id
  			INNER JOIN product_category pc ON p.category_id = pc.id
  			LEFT JOIN user_wish_list uwl ON p.id = uwl.product_id AND uwl.user_id = ?
  			WHERE p.id = ? ;
  	`,
      [id, productId]
    );
    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.log("post_product_info 에서 에러가 발생했습니다.", err);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  // check data is one
  if (sqlResult.length !== 1) {
    console.log(" post_product_info 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  const retData = sqlResult[0];

  //-------- check DB for product info --------------------------------------------------------------------------//
  let sqlResult_2;

  try {
    // //고시정보 인덱스로 데이터 가져오기
    const category = retData.noti_id;
    // const category = 25;
    let table = "";
    switch (category) {
      case 3:
        table = "notice_bags";
        break;
      case 4:
        table = "notice_fashionaccessories";
        break;
      case 5:
        table = "notice_beddingscurtains";
        break;
      case 6:
        table = "notice_furniture";
        break;
      case 7:
        table = "notice_video_appliances";
        break;
      case 8:
        table = "notice_homeappliances";
        break;
      case 9:
        table = "notice_seasonalappliances";
        break;
      case 10:
        table = "notice_officeequipment";
        break;
      case 11:
        table = "notice_opticalequipment";
        break;
      case 12:
        table = "notice_smallelectronics";
        break;
      case 13:
        table = "notice_portablecommunicationdevices";
        break;
      case 17:
        table = "notice_kitchenware";
        break;
      case 18:
        table = "notice_cosmetics";
        break;
      case 19:
        table = "notice_jewelry_watches";
        break;
      case 24:
        table = "notice_musical_instruments";
        break;
      case 25:
        table = "notice_sports_equipment";
        break;
      default:
        break;
    }

    const columns = await queryDatabase(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ? AND COLUMN_NAME != ? `, [table, "product_id"]);

    // Fetch data from the table
    const rows = await queryDatabase(
      `
      SELECT * 
      FROM ${table} AS t
      WHERE t.product_id = ?`,
      [productId]
    );

    const commentsQuery = await queryDatabase(
      `SELECT COLUMN_NAME, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = ? AND COLUMN_NAME != ?`,
      [table, "product_id"]
    );

    // Create a map of column comments
    const columnCommentsMap = {};
    commentsQuery.forEach((commentRow) => {
      const columnName = commentRow.COLUMN_NAME;
      const columnComment = commentRow.COLUMN_COMMENT;
      columnCommentsMap[columnName] = columnComment;
    });

    // Create an array of objects with {key: value} format using comments as keys
    const data = rows.map((row) => {
      const rowData = {};
      columns.forEach((column) => {
        const columnName = column.COLUMN_NAME;
        const columnComment = columnCommentsMap[columnName]; // Get the comment for the column
        rowData[columnComment] = row[columnName];
      });
      return rowData;
    });

    sqlResult_2 = data;
    // sqlResult_2 = rows;
    //console.log("SQL result : ", sqlResult_2);
  } catch (err) {
    console.log("post_product_info 에서 에러가 발생했습니다.", err);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  // check data is one
  if (sqlResult_2.length !== 1) {
    console.log(" post_product_info 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error: NO DATA",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  const retData_2 = sqlResult_2[0];

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    data: retData,
    //FIXME: 예쁘게...
    data_2: retData_2,
    detail_code: "00",
    message: "success get product info",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
