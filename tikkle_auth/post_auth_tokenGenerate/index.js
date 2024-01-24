const jwt = require("jsonwebtoken");
const { queryDatabase } = require("db.js");
const { getSSMParameter } = require("ssm.js");

exports.post_auth_tokenGenerate = async (req, res) => {
	const body = req.body;
	const userId = body.id;

	//---- check user id ----//

	//check input value
	if (typeof userId !== "number" || isNaN(userId)) {
		console.log("post_auth_tokenGenerate 에서 에러가 발생했습니다.");
		const return_body = {
			success: false,
			detail_code: "01",
			message: "id value is null or invalid",
			returnToken: null,
		};
		return res.status(400).send(return_body);
	} else {
		const idString = userId.toString();
		if (idString.length > 11) {
			console.log("post_auth_tokenGenerate 에서 에러가 발생했습니다.");
			const return_body = {
				success: false,
				detail_code: "00",
				message: "id value is null or invalid",
				returnToken: null,
			};
			return res.status(400).send(return_body);
		}
	}

	//---- check database ----//

	let sqlResult;

	try {
		const rows = await queryDatabase("SELECT * FROM users WHERE id = ?", [
			userId,
		]);
		sqlResult = rows;

		//console.log("SQL result : ", sqlResult);
	} catch (err) {
		console.log("post_auth_tokenGenerate 에서 에러가 발생했습니다 : ", err);
		const return_body = {
			success: false,
			detail_code: "02",
			message: "Database connection error",
			returnToken: null,
		};
		return res.status(500).send(return_body);
	}

	// no data
	if (sqlResult.length !== 1) {
		console.log("post_auth_tokenGenerate 에서 에러가 발생했습니다.");
		const return_body = {
			success: false,
			detail_code: "03",
			message: "There is no user of input id",
			returnToken: null,
		};
		return res.status(404).send(return_body);
	}

	// deleted user
	// console.log("type: ", typeof sqlResult);
	// console.log("data: ", sqlResult[0].is_deleted);

	if (sqlResult[0].is_deleted === 1) {
		console.log("post_auth_tokenGenerate 에서 에러가 발생했습니다.");
		const return_body = {
			success: false,
			detail_code: "04",
			message: "Deleted user",
			returnToken: null,
		};
		return res.status(404).send(return_body);
	}

	//---- generate tokken ----//

	let accessToken = null;
	let refreshToken = null;

	// generate token
	try {
		accessToken = await generateAccessToken(userId);
		refreshToken = await generateRefreshToken(userId);
	} catch (error) {
		console.log("post_auth_tokenGenerate 에서 에러가 발생했습니다.");
		const return_body = {
			success: false,
			detail_code: "05",
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
