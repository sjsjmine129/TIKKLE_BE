const { queryDatabase } = require("db.js");

exports.post_product_inputInfo = async (req, res) => {
  const id = req.id;
  const returnToken = req.returnToken;
  const { data, table_id } = req.body;

  let table = "";
  switch (table_id) {
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
  //main logic------------------------------------------------------------------------------------------------------------------//
  //-------- check DB --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const columns = Object.keys(data);
    const values = Object.values(data);

    const placeholders = Array.from({ length: columns.length }, () => "?").join(", ");
    const query = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;

    const rows = await queryDatabase(query, values);
    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.log("post_product_inputInfo 에서 에러가 발생했습니다.", err);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error 1 ",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  const ret = sqlResult;

  //-------- check DB --------------------------------------------------------------------------------------//

  let sqlResult_2;

  try {
    const rows = await queryDatabase(
      `
      UPDATE products
      SET noti_id = ?
      WHERE id = ?;
    `,
      [table_id, data.product_id]
    );
    sqlResult_2 = rows;
    //console.log("SQL result : ", sqlResult_2);
  } catch (err) {
    console.log("post_product_inputInfo 에서 에러가 발생했습니다.", err);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error 22 ",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  const ret_2 = sqlResult_2;

  const return_body = {
    success: true,
    data: ret_2,
    detail_code: "00",
    message: "success get product info",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
