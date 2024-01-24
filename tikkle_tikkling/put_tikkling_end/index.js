const { queryDatabase, queryDatabase_multi } = require("db.js");
const { Tikkling } = require("../../features/Tikkling");
const { Response } = require("../../features/Response");
const { User } = require("../../features/User");
const { ExpectedError } = require("../../features/ExpectedError");
const { DBManager } = require("../../db");
const { OptionCombination, Product } = require("../../features/Product");
const { BankDetail } = require("../../features/BankDetail");
const { Refund } = require("../../features/Refund");
const { Delivery } = require("../../features/Delivery");
const { InviteEventManager } = require("../../features/InviteEventManager");
exports.put_tikkling_end = async (req, res) => {
  const id = req.id;
  const returnToken = req.returnToken;
  const { tikkling_id, bank_code, account, zonecode, address, detail_address } = req.body;
  const { type } = req.params;

  //main logic------------------------------------------------------------------------------------------------------------------//
  //FIXME: 티클링취소 직전 티클링 조각이 도착한 경우가 생길 수 있음 조금 더 하나의 트랜잭션으로 처리해야할 필요성이 있음
  const db = new DBManager();
  await db.openTransaction();
  try {
    //티클링 객체 생성
    const tikkling = new Tikkling({ id: tikkling_id, db });

    //티클링 정보 로드
    await tikkling.loadActiveTikklingViewByTikklingId();
    await Promise.all([
      //나의 티클링인지 확인
      tikkling.assertTikklingisMine({ user_id: id }),

      //티클링이 종료되었는지 확인
      tikkling.assertTikklingIsStopped(),

      //도착한 티클링 조각이 있는지 확인
      tikkling.assertTikkleCountIsNotZero(),
    ]);
    if (type == "refund") {
      //TODO: event끝난뒤 제거
      const invite_event_manager = new InviteEventManager({ db });
      await invite_event_manager.eventProcessBeforeTikklingRefund(tikkling_id);

      await tikkling.loadActiveTikklingViewByTikklingId();
      const bank_detail = new BankDetail({ bank_code, account, db });
      //input은행 데이터 검증
      await bank_detail.validateBankData();

      //암호화
      await bank_detail.encryptAccount();

      //모든 티클을 환급 상태로 변경
      await Promise.all([
        await tikkling.updateAllTikkleToRefund(),

        //티클링을 종료시키기
        await tikkling.updateTikklingToRefund(),
      ]);

      // 재고를 복구하기
      const option_combination = new OptionCombination({ id: tikkling.option_combination_id, db });
      await option_combination.increaseQuantity();

      //환불을 요청하기
      const refund = new Refund({
        tikkling_id: tikkling.id,
        bank_code: bank_detail.bank_code,
        account: bank_detail.account,
        expected_refund_amount: tikkling.tikkle_count * 5000 * 0.9,
        db,
      });

      await refund.saveRefund();

      await db.commitTransaction();

      return res.status(200).send(Response.create(true, "01", "티클링에 대해 성공적으로 환급을 요청하였습니다.", returnToken));
    } else if (type == "goods") {
      const user = new User({ id, db, zonecode, address, detail_address });
      //주소 데이터 검증
      user.validateAddress();
      //모든 티클이 모여있는지 확인
      tikkling.assertAllTikkleIsArrived();

      //판매량 증가
      const product = new Product({ id: tikkling.product_id, db });
      await product.increaseProductSalesVolume();

      await Promise.all([
        //모든 티클을 사용된 상태로 변경
        tikkling.updateAllTikkleToUsed(),
        //티클링을 종료시키기
        tikkling.updateTikklingToGoods(),
      ]);

      //상품 발송 요청하기
      const delivery = new Delivery({ tikkling_id: tikkling.id, zonecode: user.zonecode, address: user.detail_address, detail_address: user.detail_address, state_id: 1, db });
      await delivery.saveDeliveryData();
      await db.commitTransaction();
      return res.status(200).send(Response.create(true, "02", "티클링을 성공적으로 종료하였습니다. 배송요청을 완료하였습니다.", returnToken));
    }
  } catch (err) {
    await db.rollbackTransaction();

    console.error(`🚨 error -> ⚡️ post_tikkling_end : 🐞${err}`);

    if (err.status) {
      return res.status(err.status).send(Response.create(false, err.detail_code, err.message));
    }
    return res.status(500).send(Response.create(false, "00", "서버 에러"));
  }
};
