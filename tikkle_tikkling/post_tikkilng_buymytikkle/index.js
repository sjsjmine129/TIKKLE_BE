const { queryDatabase } = require("db.js");
const { Tikkling } = require("../../features/Tikkling");
const { Tikkle } = require("../../features/Tikkle");
const { Response } = require("../../features/Response");
const { ExpectedError } = require("../../features/ExpectedError");
const { DBManager } = require("../../db");
//남은 티클 개수만 충족되면 티클 줄 수 있음
//TODO: 결제 실패 api
exports.post_tikkling_buymytikkle = async (req, res) => {
	const { body, id, returnToken } = req;
	const { merchant_uid, imp_uid, status } = body;
	//main logic------------------------------------------------------------------------------------------------------------------//

	const db = new DBManager();
	await db.openTransaction();
	
	try {
		//결제정보 가져오기
		const tikkle_info = await Tikkle.getTikkleByMerchantUid({
			merchant_uid,
			db
		});
		//payment 객체 생성
		const tikkle = new Tikkle({...tikkle_info, db});
		//DB상의 결제정보와 비교
		tikkle.compareStoredTikkleData({ user_id: id });
		//줄 수 있는 상태인지 확인
		const tikkling = new Tikkling({ user_id: id , db});
		//티클링 정보 가져오기
		await tikkling.loadActiveTikklingViewByUserId();
		//요청 정보 유효성 검사
		tikkling.validateBuyMyTikkleRequest();
		//나의 남은 티클 구매
		await tikkling.buyMyTikkle({ merchant_uid });
		//결제 완료 처리
		await tikkle.completeTikklePayment();
		const buy_tikkle_quantity =
			tikkling.tikkle_quantity - tikkling.tikkle_count;
		// 트랜잭션 커밋
		await db.commitTransaction();
		return res
			.status(200)
			.send(
				Response.create(
					true,
					"00",
					"나의 모든 티클 구매 성공",
					{ buy_tikkle_quantity },
					returnToken
				)
			);
	} catch (err) {
		
			const tikkle_info = await Tikkle.getTikkleByMerchantUid({merchant_uid, db});
			const tikkle = new Tikkle(tikkle_info);
			const port_one_token = await Tikkle.getPortOneApiToken();
			//포트원 환불 api 호출
			await tikkle.callPortOneCancelPaymentAPI({reason: "buymytikkle 처리중 에러", port_one_token});
			//트랜잭션 롤백
			await db.rollbackTransaction();
	
		console.error(`🚨 error -> ⚡️ post_tikkling_buymytikkle : 🐞 ${err}`);
		if (err instanceof ExpectedError) {
			return res
				.status(err.status)
				.send(Response.create(false, err.detail_code, err.message));
		}
		return res.status(500).send(Response.create(false, "00", "서버 에러"));
		}
	};

