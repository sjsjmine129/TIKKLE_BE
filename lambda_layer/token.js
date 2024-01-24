const jwt = require("jsonwebtoken");
const { getSSMParameter } = require("ssm.js");


exports.checkToken = async (accessToken, refreshToken) => {
	/////// Token check //////////////////////////////////////////////////////////////////
	let ReturnToken = null;
	let tokenData = null;

	const accessTokenSecret = await getSSMParameter("accessTokenSecret");

	try {
		const decodedToken = jwt.decode(accessToken, accessTokenSecret);
		tokenData = decodedToken;

		// Step 2: Validate the access token
		if (decodedToken.exp < getCurrentTimeInSeconds()) {
			//엑세스 만료 시
			if (!refreshToken) {
				//리프레쉬 토큰 없는 경우
				return {
					statusCode: 401,
					body: "Log in again",
				};
			}

			const refreshTokenSecret =  await getSSMParameter("refreshTokenSecret");
			const decodedRefreshToken = jwt.decode(
				refreshToken,
				refreshTokenSecret
			);

			// Step 4: Validate the refresh token
			if (decodedRefreshToken.exp < getCurrentTimeInSeconds()) {
				//리프레쉬 만료시
				return {
					statusCode: 401,
					body: "Log in again",
				};
			}

			// Step 5: Refresh the access token
			const newAccessToken = await generateAccessToken(
				decodedRefreshToken.id,
				accessTokenSecret
			);
			ReturnToken = newAccessToken;
			tokenData = jwt.decode(newAccessToken, accessTokenSecret);
		}

	} catch (error) {
		return {
			statusCode: 401,
			body: "Invalid token",
		};
	}

	/////// return success //////////////////////////////////////////////////////////////////
	
	const returnBody = JSON.stringify({
		accessToken: ReturnToken,
		tokenData: tokenData,
	});
	return {
		statusCode: 200,
		body: returnBody,
	};
};

const generateAccessToken = async (
	id,
	accessTokenSecret
) => {
	const issuer =  await getSSMParameter("issuer");

	const accessTokenPayload = {
		id,
		iat: Math.floor(Date.now() / 1000), // Issued At timestamp in seconds
		exp: Math.floor(Date.now() / 1000) + 15 * 60, // Expiration time in seconds (15 minutes)
		iss: issuer, // Use the environment variable directly

	};

	// Generate the access token
	const accessToken = jwt.sign(accessTokenPayload, accessTokenSecret);

	return accessToken;
};


function getCurrentTimeInSeconds() {
	return Math.floor(Date.now() / 1000);
}
