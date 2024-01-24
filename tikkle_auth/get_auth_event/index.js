const { queryDatabase } = require("db.js");
const { getSSMParameter } = require("ssm.js");

exports.get_auth_event = async (req, res) => {
  const body = req.body;

  //---- check ssm there is number or not ----//
  let get = "event";
  let image = "event_image";

  const event = await getSSMParameter(get);
  const image_url = await getSSMParameter(image);

  //---- return result ----//

  if (!event || !image_url) {
    console.log("get_auth_event 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "99",
      message: "요청을 처리할 수 없습니다.",
      returnToken: null,
    };
    return res.status(401).send(return_body);
  }

  const return_body = {
    success: true,
    detail_code: "00",
    message: "event get success",
    data: { event: event, image_url: image_url },
    returnToken: null,
  };
  return res.status(200).send(return_body);
};
