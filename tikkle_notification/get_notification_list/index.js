const { queryDatabase } = require("db.js");

exports.get_notification_list = async (req, res) => {
	const body = req.body;
	const id = req.id;
	const returnToken = req.returnToken;

	//-------- check DB --------------------------------------------------------------------------------------//

	let sqlResult;

	try {
		const rows1 = await queryDatabase(
			`	SELECT n.*, nt.name AS notification_type_name
			FROM notification AS n
			INNER JOIN notification_type AS nt ON n.notification_type_id = nt.id
			LEFT JOIN friends_relation AS fr ON (n.user_id = fr.central_user_id AND n.source_user_id = fr.friend_user_id)
			WHERE n.user_id = ? AND n.is_deleted <> ?
					AND (fr.relation_state_id IS NULL OR fr.relation_state_id <> 3 OR n.source_user_id = 0)
			ORDER BY n.created_at DESC;
			`,
			[id, 1]
		);
		sqlResult = rows1;
	} catch (err) {
		console.log("get_notification_list 에서 에러가 발생했습니다.", err);
		const return_body = {
			success: false,
			detail_code: "01",
			message: "SQL error : check DB error",
			returnToken: null,
		};
		return res.status(500).send(return_body);
	}

	const retData = sqlResult;

	try {
		const rows = await queryDatabase(
			`	UPDATE notification
			SET is_read = 1
			WHERE user_id = ? AND is_deleted <> ?;`,
			[id, 1]
		);
	} catch (err) {
		console.log("get_notification_list 에서 에러가 발생했습니다.", err);
		const return_body = {
			success: false,
			detail_code: "02",
			message: "SQL error: error when update data",
			returnToken: null,
		};
		return res.status(500).send(return_body);
	}

	//-------- return result --------------------------------------------------------------------------------------//

	const return_body = {
		success: true,
		data: retData,
		detail_code: "00",
		message: "success get notification list",
		returnToken: returnToken,
	};
	return res.status(200).send(return_body);
};
