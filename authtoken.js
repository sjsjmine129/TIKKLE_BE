const { checkToken } = require("token.js");

exports.authtoken = async (req, res, next) => {
	const headers = req.headers;
	const authorization = headers.authorization;
	const [accessToken, refreshToken] = authorization.split(",");

	//-------- check token & get user id --------------------------------------------------------------------------------------//

	let tokenCheck;
	let returnBody;
	let id;

	try {
		tokenCheck = await checkToken(accessToken, refreshToken);
		returnBody = JSON.parse(tokenCheck.body);
		id = returnBody.tokenData.id;
	} catch (error) {
		//return invalid when token is invalid
		console.log("authtoken 에서 에러가 발생했습니다.");
		const return_body = {
			success: false,
			detail_code: "99",
			message: "login again",
			returnToken: null,
		};
		return res.status(401).send(return_body);
	}

	//return invalid when token is invalid
	if (tokenCheck.statusCode !== 200) {
		console.log("authtoken 에서 에러가 발생했습니다.");
		const return_body = {
			success: false,
			detail_code: "99",
			message: "login again",
			returnToken: null,
		};
		return res.status(401).send(return_body);
	}

	const returnToken = returnBody.accessToken;

	//-------- sucess result --------------------------------------------------------------------------------------//

	req.id = id;
	req.returnToken = returnToken;
	next();
};
