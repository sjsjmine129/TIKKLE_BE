const { queryDatabase } = require("db.js");

exports.post_auth_phoneCheck = async (req, res) => {
	const body = req.body;
	const phone = body.phone;

	//---- check number format ----//

	const numericPattern = /^\d+$/;

	// Check if the string matches the numeric pattern and its length is between 9 and 12
	if (
		!phone ||
		typeof phone !== "string" ||
		phone.length < 9 ||
		phone.length > 11 ||
		!numericPattern.test(phone)
	) {
		//return invalid

		console.log("post_auth_phoneCheck 에서 에러가 발생했습니다.");
		const return_body = {
			success: false,
			detail_code: "00",
			message: "phone number value is null or invalid : input data again",
			returnToken: null,
		};
		return res.status(400).send(return_body);
	}

	//---- check DB there is number or not ----//

	let sqlResult;

	try {
		const rows = await queryDatabase("select * from users where phone = ?", [
			phone,
		]);
		sqlResult = rows;
		//console.log("SQL result : ", sqlResult);
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

	//---- return result ----//

	if (sqlResult.length === 1) {
		//already sign in
		const return_body = {
			success: true,
			detail_code: "10",
			message: "login",
			returnToken: null,
			userId: sqlResult[0].id,
		};
		return res.status(200).send(return_body);
	} else if (sqlResult.length === 0) {
		//not sign in

		const return_body = {
			success: true,
			detail_code: "11",
			message: "sign up",
			returnToken: null,
		};
		return res.status(200).send(return_body);
	} else {
		console.log(" post_auth_phoneCheck 에서 에러가 발생했습니다.");
		const return_body = {
			success: false,
			detail_code: "03",
			returnToken: null,
			message: "many same number",
		};
		return res.status(500).send(return_body);
	}
};
