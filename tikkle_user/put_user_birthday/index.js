const { queryDatabase } = require("db.js");

exports.put_user_birthday = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  const birthday = body.birthday;

  //-------- check birthday --------------------------------------------------------------------------------------//
  //check birthday
  const parsedDate = new Date(birthday);
  if (isNaN(parsedDate) || Object.prototype.toString.call(parsedDate) !== "[object Date]") {
    //return invalid
    console.log(" put_user_birthday 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "02",
      message: "birthday value is null or invalid : input birthday again",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  if (!isUserAgeValid(birthday)) {
    console.log("post_auth_registerUser 에서 에러가 발생했습니다.");
    const return_body = {
      success: false,
      detail_code: "03",
      message: "if your age is under 14 you cannot use this servise!",
      returnToken: null,
    };
    return res.status(400).send(return_body);
  }

  //--------  update birthday  --------------------------------------------------------------------------------------//

  let sqlResult;

  try {
    const rows = await queryDatabase(
      `	UPDATE users
				SET	birthday = ?
				WHERE	id = ?
			`,
      [birthday, id]
    );

    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.error(`🚨 error -> ⚡️ put_user_birthday : 🐞 ${err}`);
    const return_body = {
      success: false,
      detail_code: "00",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    data: birthday,
    detail_code: "00",
    message: "success to update birthday",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
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
