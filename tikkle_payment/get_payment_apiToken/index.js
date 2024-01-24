const { Tikkle } = require("../../features/Tikkle");

//
exports.get_payment_apiToken = async (req, res) => {
	const body = req.body;
	const id = req.id;
	const returnToken = req.returnToken;

	//-------- get token --------------------------------------------------------------------------------------//
	// console.log("#####################################");
	try {
		const token = await Tikkle.getPortOneApiToken();

		//-------- return result --------------------------------------------------------------------------------------//

		const return_body = {
			success: true,
			data: token,
			detail_code: "00",
			message: "success get token info",
			//returnToken: returnToken,
		};
		return res.status(200).send(return_body);
	} catch (err) {
		console.log("get_payment_apiToken 에서 에러가 발생했습니다.");
		const return_body = {
			success: false,
			detail_code: "00",
			message: "import token get error",
			returnToken: null,
		};
		return res.status(500).send(return_body);
	}
};
