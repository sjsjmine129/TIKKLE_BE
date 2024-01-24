const { queryDatabase } = require("db.js");

exports.post_image_profileUrl = async (req, res) => {
	const body = req.body;
	const id = req.id;
	const returnToken = req.returnToken;

	const imageSize = body.imageSize.toString();
	const userId = body.userId;

	//-------- check body data --------------------------------------------------------------------------------------//

	if (
		!imageSize ||
		(imageSize !== "36" &&
			imageSize !== "48" &&
			imageSize !== "64" &&
			imageSize !== "128" &&
			imageSize !== "0")
	) {
		console.log("ERROR : size value is null or invalid");
		const return_body = {
			success: false,
			detail_code: "00",
			body: "input image size again",
			returnToken: null,
		};
		return res.status(400).send(return_body);
	}

	//-------- get profile urls --------------------------------------------------------------------------------------//

	let sqlResult;

	try {
		const rows = await queryDatabase("select * from users where id = ?", [
			userId,
		]);
		sqlResult = rows;
		//console.log("SQL result : ", sqlResult);
	} catch (err) {
		console.log("post_image_profileUrl 에서 에러가 발생했습니다.", err);
		const return_body = {
			success: false,
			detail_code: "00",
			message: "SQL error",
			returnToken: null,
		};
		return res.status(500).send(return_body);
	}

	// check data is one
	if (sqlResult.length !== 1) {
		console.log("post_image_profileUrl 에서 에러가 발생했습니다.");
		const return_body = {
			success: false,
			detail_code: "00",
			message: "SQL error",
			returnToken: null,
		};
		return res.status(500).send(return_body);
	}

	const retData = JSON.parse(sqlResult[0].image);
	const url = retData[imageSize];

	//-------- return data --------------------------------------------------------------------------------------//

	if (imageSize === "0") {
		const return_body = {
			success: true,
			data: JSON.stringify(retData),
			detail_code: "10",
			message: "success - return all image urls",
			returnToken: returnToken,
		};
		return res.status(200).send(return_body);
	}

	const return_body = {
		success: true,
		data: url,
		detail_code: "11",
		message: "success - return one image url",
		returnToken: returnToken,
	};
	return res.status(200).send(return_body);
};
