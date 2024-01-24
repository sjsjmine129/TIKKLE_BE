const { checkToken } = require("token.js");

exports.get_auth_checkToken = async (req, res) => {
	const headers = req.headers;
	const authorization = headers.authorization;
	const [accessToken, refreshToken] = authorization.split(",");

	// console.log("headers : ", headers);
	// console.log("accessToken : ", accessToken);
	// console.log("refreshToken : ", refreshToken);

	//---- check token is exist ----//

	const maxLength = 500;

	//check input value
	if (
		!accessToken ||
		!refreshToken ||
		typeof accessToken !== "string" ||
		typeof refreshToken !== "string" ||
		accessToken.length > maxLength ||
		refreshToken.length > maxLength
	) {
		//return invalid
		console.log("get_auth_checkToken 에서 에러가 발생했습니다.");
		const return_body = {
			success: false,
			detail_code: "99",
			message: "the token value is null or invalid : Log in again",
			returnToken: null,
		};
		return res.status(401).send(return_body);
	}

	//---- check token is valid & refresh Access token ----//

	const tokenCheck = await checkToken(accessToken, refreshToken);

	//return invalid when token is invalid
	if (tokenCheck.statusCode !== 200) {
		console.log("get_auth_checkToken 에서 에러가 발생했습니다.", err);
		const return_body = {
			success: false,
			detail_code: "99",
			message: "the token value is null or invalid : Log in again",
			returnToken: null,
		};
		return res.status(401).send(return_body);
	}

	const returnBody = JSON.parse(tokenCheck.body);
	// console.log("tokenCheck : ", typeof returnBody);

	//---- return success ----//

	const returnToken = returnBody.accessToken;
	//console.log(returnToken);
	if (!refreshToken) {
		const return_body = {
			success: true,
			detail_code: "10",
			message: "success : no new access token",
			returnToken: null,
		};
		return res.status(200).send(return_body);
	}

	const return_body = {
		success: true,
		detail_code: "11",
		message: "success : new access token",
		returnToken: returnToken,
	};
	return res.status(200).send(return_body);
};
