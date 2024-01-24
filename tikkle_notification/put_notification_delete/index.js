const { queryDatabase } = require("db.js");

exports.put_notification_delete = async (req, res) => {
	const body = req.body;
	const id = req.id;
	const returnToken = req.returnToken;

	const notificationId = body.notificationId;

	//-------- check DB --------------------------------------------------------------------------------------//

	let sqlResult;

	try {
		const rows = await queryDatabase(
			`	UPDATE notification
			SET is_deleted = 1
			WHERE user_id = ? AND id = ?;`,
			[id, notificationId]
		);
		sqlResult = rows;
		console.log("SQL result : ", sqlResult);
	} catch (err) {
		console.log("put_notification_delete 에서 에러가 발생했습니다.", err);
		const return_body = {
			success: false,
			detail_code: "00",
			message: "SQL error",
			returnToken: null,
		};
		return res.status(500).send(return_body);
	}

	const retData = sqlResult;

	//-------- return result --------------------------------------------------------------------------------------//

	const return_body = {
		success: true,
		data: retData,
		detail_code: "00",
		message: "success delete notification",
		returnToken: returnToken,
	};
	return res.status(200).send(return_body);
};
