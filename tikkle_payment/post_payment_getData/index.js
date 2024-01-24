const { Tikkle } = require("../../features/Tikkle");
const { User } = require("../../features/User");
const { Response } = require("../../features/Response");
const axios = require("axios");

exports.post_payment_getData = async (req, res) => {
  const { body, id, returnToken } = req;
  const { merchant_uid } = body;

  //-------- get portone token 2 --------------------------------------------------------------------------------------//
  let Authorization = null;
  try {
    Authorization = await Tikkle.getPortOneApiToken();
  } catch (err) {
    console.error(`🚨 error -> ⚡️ post_payment_getData : 🐞${err}`);
    if (err.status) {
      return res.status(err.status).send(createResponseBody(false, err.detail_code, err.message));
    }

    return res.status(500).send(createResponseBody(false, "00", "서버 에러"));
  }

  //-------- call port one AI for data --------------------------------------------------------------------------------------//
  let result = null;

  try {
    const axios_result = await axios({
      url: "https://api.iamport.kr/payments/find/" + merchant_uid,
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: Authorization,
      },
    });

    // console.log("RES : ", axios_result.data);
    result = axios_result.data.response;
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send(createResponseBody(false, "01", "서버 에러"));
  }

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    data: result,
    detail_code: "00",
    message: "success get product info",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
