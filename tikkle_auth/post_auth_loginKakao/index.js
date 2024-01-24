const { queryDatabase } = require("db.js");
const jwt = require("jsonwebtoken");
const { getSSMParameter } = require("ssm.js");
/**
 * 카카오톡으로 로그인시 카카오톡 id있는지 확인하고 있으면 로그인, 없으면 전화번호 있는지 확인하고 계정 통합 or 회원가입
 * @param {*} req
 * @param {*} res
 * @returns
 */
exports.post_auth_loginKakao = async (req, res) => {
  const body = req.body;

  const name = body.name;

  //TODO : 카카오 회원가입시 생일이 없는 경우
  let birthday = body.birthday;
  if (birthday == "0000-00-00") {
    birthday = "2023-12-13";
  }

  const phone = body.phone;
  const gender = body.gender;
  const source_tikkling_id = body.source_tikkling_id;
  const kakao_email = body.kakao_email;
  let kakao_image = body.kakao_image;

  if (kakao_image == null) {
    kakao_image = "https://d2da4yi19up8sp.cloudfront.net/profile/profile.png";
  }

  // console.log("body : ", body);

  //-------- check if kakao id exists in DB --------------------------------------------------------------------------------------//

  let sqlResult_kakao;

  try {
    const rows = await queryDatabase("select * from users where kakao_email = ?", [kakao_email]);
    sqlResult_kakao = rows;
  } catch (err) {
    console.log(" post_auth_loginKakao 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "00",
      message: "Database connection error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  if (sqlResult_kakao.length >= 1 && sqlResult_kakao[0].is_deleted === 1) {
    console.log("post_auth_appleLogin 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "04",
      message: "Deleted user",
      returnToken: null,
    };
    return res.status(404).send(return_body);
  }

  //카카오 회원인 경우
  if (sqlResult_kakao.length === 1) {
    const userId = sqlResult_kakao[0].id;

    let accessToken = null;
    let refreshToken = null;

    // generate token
    try {
      accessToken = await generateAccessToken(userId);
      refreshToken = await generateRefreshToken(userId);
    } catch (error) {
      console.log("post_auth_loginKakao 에서 에러가 발생했습니다.");
      const return_body = {
        success: false,
        detail_code: "12",
        message: "cannot make token",
        returnToken: null,
      };
      return res.status(500).send(return_body);
    }

    //---- return success ----//

    const return_body = {
      success: true,
      data: JSON.stringify({
        accessToken: accessToken,
        refreshToken: refreshToken,
      }),
      detail_code: "00",
      message: "success to generate token",
      returnToken: null,
    };
    return res.status(200).send(return_body);
  } else if (sqlResult_kakao.length != 0) {
    console.log(" post_auth_loginKakao 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "00",
      message: "Database connection error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //-------- 카카오 회원이 아닌 경우 check phone number --------------------------------------------------------------------------------------//
  // Check if the string matches the numeric pattern and its length is between 9 and 12
  const numericPattern = /^\d+$/;
  if (!phone || typeof phone !== "string" || phone.length < 9 || phone.length > 11 || !numericPattern.test(phone)) {
    //return invalid
    console.log(" post_auth_loginKakao 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "05",
      message: "phone value is null or invalid : input phone again",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  let sqlResult_phone;

  try {
    const rows = await queryDatabase("select * from users where phone = ?", [phone]);
    sqlResult_phone = rows;
    //console.log("SQL result : ", sqlResult_phone);
  } catch (err) {
    console.log(" post_auth_phoneCheck 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "02",
      message: "Database connection error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //아예 등록된 번호가 아닌 경우 새로 회원가입
  if (sqlResult_phone.length === 0) {
    //-------- check data format --------------------------------------------------------------------------------------//

    //check name
    if (!name || typeof name !== "string" || name.length > 30) {
      //return invalid
      console.log("ERROR : name value is null or invalid");
      const return_body = {
        success: false,
        detail_code: "01",
        message: "input name again",
        returnToken: null,
      };
      return res.status(400).send(return_body);
    }

    //check birthday
    const parsedDate = new Date(birthday);
    if (isNaN(parsedDate) || Object.prototype.toString.call(parsedDate) !== "[object Date]") {
      //return invalid
      console.log(" post_auth_loginKakao 에서 에러가 발생했습니다.");
      const return_body = {
        success: false,
        detail_code: "02",
        message: "birthday value is null or invalid : input birthday again",
        returnToken: null,
      };
      return res.status(400).send(return_body);
    }

    if (!isUserAgeValid(birthday)) {
      console.log("post_auth_loginKakao 에서 에러가 발생했습니다.");
      const return_body = {
        success: false,
        detail_code: "03",
        message: "if your age is under 14 you cannot use this servise!",
        returnToken: null,
      };
      return res.status(400).send(return_body);
    }

    //check gender
    if (!gender || typeof gender !== "string" || !(gender === "male" || gender === "female" || gender === "others")) {
      //return invalid
      console.log("post_auth_loginKakao 에서 에러가 발생했습니다.");
      const return_body = {
        success: false,
        detail_code: "06",
        message: "gender value is null or invalid : input gender again",
        returnToken: null,
      };
      return res.status(400).send(return_body);
    }

    //-------- add user data to DB --------------------------------------------------------------------------------------//

    let sqlResult;

    const insertQuery = `
		INSERT INTO users 
		(name, birthday, nick, phone, gender, image, address, detail_address, is_tikkling, tikkling_ticket, funnel, kakao_email)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	  `;
    let funnel;
    if (source_tikkling_id) {
      funnel = "share_link";
    } else {
      funnel = "meta_ad";
    }

    const values = [name, birthday, " ", phone, gender, kakao_image, null, null, false, 2, funnel, kakao_email];

    try {
      const rows = await queryDatabase(insertQuery, values);
      sqlResult = rows;
      if (source_tikkling_id) {
        const insertQuery_2 = `
      INSERT INTO shared_tikkling_signup_log (tikkling_id, user_id)
      VALUES (?, ?)
      `;
        const values = [source_tikkling_id, sqlResult.insertId];
        await queryDatabase(insertQuery_2, values);
      }

      //console.log("SQL result : ", sqlResult.insertId);
    } catch (err) {
      console.log("🚨 post_auth_loginKakao 에서 에러가 발생했습니다.");
      const return_body = {
        success: false,
        detail_code: "00",
        message: err,
        returnToken: null,
      };
      return res.status(500).send(return_body);
    }

    //-------- make token ----------------------------------------------------------------//

    const userId_2 = sqlResult.insertId;

    let accessToken = null;
    let refreshToken = null;

    // generate token
    try {
      accessToken = await generateAccessToken(userId_2);
      refreshToken = await generateRefreshToken(userId_2);
    } catch (error) {
      console.log("post_auth_loginKakao 에서 에러가 발생했습니다.");
      const return_body = {
        success: false,
        detail_code: "12",
        message: "cannot make token",
        returnToken: null,
      };
      return res.status(500).send(return_body);
    }

    //---- return success ----//

    const return_body = {
      success: true,
      data: JSON.stringify({
        accessToken: accessToken,
        refreshToken: refreshToken,
      }),
      detail_code: "01",
      message: "sign up and login success!",
      returnToken: null,
    };
    return res.status(200).send(return_body);

    //
    //회원가입이 다른 걸로 되어있는 경우
  } else if (sqlResult_phone.length === 1) {
    if (sqlResult_phone[0].is_deleted === 1) {
      console.log("post_auth_appleLogin 에서 에러가 발생했습니다.");
      const return_body = {
        success: false,
        detail_code: "04",
        message: "Deleted user",
        returnToken: null,
      };
      return res.status(404).send(return_body);
    }

    if (sqlResult_phone[0].kakao_email != null) {
      console.log("post_auth_appleLogin 에서 에러가 발생했습니다.");
      const return_body = {
        success: false,
        detail_code: "22",
        message: "Already kakao user",
        returnToken: null,
      };
      return res.status(400).send(return_body);
    }

    const phone_userID = sqlResult_phone[0].id;

    let sqlResult_update;

    try {
      const rows = await queryDatabase(
        `	UPDATE users
				SET	kakao_email = ?
				WHERE	id = ?
			`,
        [kakao_email, phone_userID]
      );

      sqlResult_update = rows;
    } catch (err) {
      console.error(`🚨 error -> ⚡️ put_user_nick : 🐞 ${err}`);
      const return_body = {
        success: false,
        detail_code: "00",
        message: "SQL error",
        returnToken: null,
      };
      return res.status(500).send(return_body);
    }

    let accessToken = null;
    let refreshToken = null;

    // generate token
    try {
      accessToken = await generateAccessToken(phone_userID);
      refreshToken = await generateRefreshToken(phone_userID);
    } catch (error) {
      console.log("post_auth_loginKakao 에서 에러가 발생했습니다.");
      const return_body = {
        success: false,
        detail_code: "12",
        message: "cannot make token",
        returnToken: null,
      };
      return res.status(500).send(return_body);
    }

    //---- return success ----//

    const return_body = {
      success: true,
      data: JSON.stringify({
        accessToken: accessToken,
        refreshToken: refreshToken,
      }),
      detail_code: "02",
      message: "updata kakao email and login success!",
      returnToken: null,
    };
    return res.status(200).send(return_body);

    //
  } else {
    console.log(" post_auth_phoneCheck 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "02",
      message: "Database connection error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }
};

const generateAccessToken = async (id) => {
  const issuer = await getSSMParameter("issuer");
  const accessTokenSecret = await getSSMParameter("accessTokenSecret");

  const accessTokenPayload = {
    id,
    iat: Math.floor(Date.now() / 1000), // Issued At timestamp in seconds
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // Expiration time in seconds (15 minutes)
    iss: issuer, // Use the environment variable directly
    // Add any additional claims as needed
  };

  // Generate the access token
  const accessToken = jwt.sign(accessTokenPayload, accessTokenSecret);

  return accessToken;
};

// Helper function to generate a refresh token
const generateRefreshToken = async (id) => {
  const issuer = await getSSMParameter("issuer");
  const refreshTokenSecret = await getSSMParameter("refreshTokenSecret");

  const refreshTokenPayload = {
    id,
    iat: Math.floor(Date.now() / 1000), // Issued At timestamp in seconds
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // Expiration time in seconds (30 days)
    iss: issuer,
  };

  // Generate the refresh token
  const refreshToken = jwt.sign(refreshTokenPayload, refreshTokenSecret);

  return refreshToken;
};

function isUserAgeValid(dateOfBirth) {
  // Convert dateOfBirth string to a Date object
  const dob = new Date(dateOfBirth);

  // Calculate current date
  const currentDate = new Date();

  // Calculate age
  let age = currentDate.getFullYear() - dob.getFullYear();

  // Check if birthday hasn't occurred yet this year
  if (currentDate.getMonth() < dob.getMonth() || (currentDate.getMonth() === dob.getMonth() && currentDate.getDate() < dob.getDate())) {
    age--;
  }

  // Compare age with minimum age requirement (14)
  return age >= 14;
}
