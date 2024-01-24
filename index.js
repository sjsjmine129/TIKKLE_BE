"use strict";
const api = require("lambda-api")();
const { authtoken } = require("authtoken.js");

//-------- require modules ------------------------------------------------//
//
//auth
const { get_auth_checkToken } = require("./tikkle_auth/get_auth_checkToken/index.js");
const { get_auth_event } = require("./tikkle_auth/get_auth_event/index.js");
const { get_auth_kToken } = require("./tikkle_auth/get_auth_kToken/index.js");
const { post_auth_IdDuplicationCheck } = require("./tikkle_auth/post_auth_IdDuplicationCheck/index.js");
const { post_auth_phoneCheck } = require("./tikkle_auth/post_auth_phoneCheck/index.js");
const { post_auth_registerUser } = require("./tikkle_auth/post_auth_registerUser/index.js");
const { post_auth_tokenGenerate } = require("./tikkle_auth/post_auth_tokenGenerate/index.js");
const { post_auth_version } = require("./tikkle_auth/post_auth_version/index.js");
const { post_auth_loginKakao } = require("./tikkle_auth/post_auth_loginKakao/index.js");
const { post_auth_appleLogin } = require("./tikkle_auth/post_auth_appleLogin/index.js");
const { post_auth_appleRegister } = require("./tikkle_auth/post_auth_appleRegister/index.js");

//friend
const { get_friend_data } = require("./tikkle_friend/get_friend_data/index.js");
const { get_friend_event } = require("./tikkle_friend/get_friend_event/index.js");
const { get_friend_search } = require("./tikkle_friend/get_friend_search/index.js");
const { get_friend_searchPhone } = require("./tikkle_friend/get_friend_searchPhone/index.js");
const { post_friend_phonecheck } = require("./tikkle_friend/post_friend_phonecheck/index.js");
const { put_friend_block } = require("./tikkle_friend/put_friend_block/index.js");
const { post_user_friendDeep } = require("./tikkle_friend/post_user_friendDeep/index.js");

//image
const { get_image_deleteProfile } = require("./tikkle_image/get_image_deleteProfile/index.js");
const { get_image_profileSaveUrl } = require("./tikkle_image/get_image_profileSaveUrl/index.js");
const { post_image_profileUrl } = require("./tikkle_image/post_image_profileUrl/index.js");
const { post_product_id } = require("./tikkle_product/post_product_id/index.js");

//notification
const { get_notification_list } = require("./tikkle_notification/get_notification_list/index.js");
const { post_notification_send } = require("./tikkle_notification/post_notification_send/index.js");
const { put_notification_delete } = require("./tikkle_notification/put_notification_delete/index.js");

//post
const { post_product_images } = require("./tikkle_product/post_product_images/index.js");
const { post_product_info } = require("./tikkle_product/post_product_info/index.js");
const { post_product_list } = require("./tikkle_product/post_product_list/index.js");
const { post_product_inputInfo } = require("./tikkle_product/post_product_inputInfo/index.js");
const { put_product_viewIncrease } = require("./tikkle_product/put_product_viewIncrease/index.js");

//tikkling
const { get_tikkling_friendinfo } = require("./tikkle_tikkling/get_tikkling_friendinfo/index.js");
const { get_tikkling_info } = require("./tikkle_tikkling/get_tikkling_info/index.js");
const { post_tikkling_receivedTikkle } = require("./tikkle_tikkling/post_tikkling_receivedTikkle/index.js");
const { post_tikkling_create } = require("./tikkle_tikkling/post_tikkling_create/index.js");
const { post_user_getTikklingDetail } = require("./tikkle_tikkling/post_user_getTikklingDetail/index.js");
const { put_tikkling_end } = require("./tikkle_tikkling/put_tikkling_end/index.js");
const { post_tikkling_sendtikkle } = require("./tikkle_tikkling/post_tikkling_sendtikkle/index.js");
const { put_tikkling_cancel } = require("./tikkle_tikkling/put_tikkling_cancel/index.js");

//user
const { delete_user_wishlist } = require("./tikkle_user/delete_user_wishlist/index.js");
const { get_user_checkTikkling } = require("./tikkle_user/get_user_checkTikkling/index.js");
const { get_bank_data } = require("./tikkle_user/get_bank_data/index.js");
const { get_user_endTikklings } = require("./tikkle_user/get_user_endTikklings/index.js");
const { get_user_info } = require("./tikkle_user/get_user_info/index.js");
const { get_user_myWishlist } = require("./tikkle_user/get_user_myWishlist/index.js");
const { get_user_paymentHistory } = require("./tikkle_user/get_user_paymentHistory/index.js");
const { post_user_friend } = require("./tikkle_user/post_user_friend/index.js");
const { post_user_wishlist } = require("./tikkle_user/post_user_wishlist/index.js");
const { get_user_isNotice } = require("./tikkle_user/get_user_isNotice/index.js");
const { get_user_deleteUser } = require("./tikkle_user/get_user_deleteUser/index.js");
const { put_user_address } = require("./tikkle_user/put_user_address/index.js");
const { put_user_nick } = require("./tikkle_user/put_user_nick/index.js");
const { put_user_account } = require("./tikkle_user/put_user_account/index.js");
const { put_user_token } = require("./tikkle_user/put_user_token/index.js");
const { put_tikkling_stop } = require("./tikkle_tikkling/put_tikkling_stop/index.js");
const { put_user_birthday } = require("./tikkle_user/put_user_birthday/index.js");
const { put_user_kakaoImage } = require("./tikkle_user/put_user_kakaoImage/index.js");

//payment
const { get_payment_apiToken } = require("./tikkle_payment/get_payment_apiToken/index.js");

const { post_payment_init } = require("./tikkle_payment/post_payment_init/index.js");

const { put_payment_fail } = require("./tikkle_payment/put_payment_fail/index.js");

const { post_payment_finalize } = require("./tikkle_payment/post_payment_finalize/index.js");

const { post_payment_getData } = require("./tikkle_payment/post_payment_getData/index.js");

const { put_payment_refund } = require("./tikkle_payment/put_payment_refund/index.js");
const { get_product_options } = require("./tikkle_product/get_product_options/index.js");
const { post_product_brand } = require("./tikkle_product/post_product_brand/index.js");
const { post_product_enrollment } = require("./tikkle_product/post_product_enrollment/index.js");
const { get_tikkling_deliveryinfo } = require("./tikkle_tikkling/get_tikkling_deliveryinfo/index.js");
const { actionFunnelLogger } = require("./actinoFunnelLogger.js");
const { get_tikkling_refundinfo } = require("./tikkle_tikkling/get_tikkling_refundinfo/index.js");
const { put_user_lastpresentamount } = require("./tikkle_user/put_user_lastpresentamount/index.js");
const { put_tikkling_deliveryconfirm } = require("./tikkle_tikkling/put_tikkling_deliveryconfirm/index.js");
const { post_tikkling_sendmessage } = require("./tikkle_tikkling/post_tikkling_sendmessage/index.js");

//

//-------- API's ------------------------------------------------//

//------- auth
api.get("/get_auth_checkToken", get_auth_checkToken);

api.get("/get_auth_event", get_auth_event);
api.get("/get_auth_kToken", get_auth_kToken);

api.post("/post_auth_IdDuplicationCheck", post_auth_IdDuplicationCheck);

api.post("/post_auth_phoneCheck", post_auth_phoneCheck);
// 유저 funnel logging
api.post("/post_auth_registerUser", post_auth_registerUser);

api.post("/post_auth_tokenGenerate", post_auth_tokenGenerate);

api.post("/post_auth_version", post_auth_version);

api.post("/post_auth_loginKakao", post_auth_loginKakao);

api.post("/post_auth_appleLogin", post_auth_appleLogin);

api.post("/post_auth_appleRegister", post_auth_appleRegister);

//

//------- friend

api.get("/get_friend_data/:mode", authtoken, get_friend_data);

api.get("/get_friend_event", authtoken, get_friend_event);

api.get("/get_friend_search/:nick", authtoken, get_friend_search);

api.post("/post_friend_phonecheck", authtoken, post_friend_phonecheck);

api.post("/post_user_friendDeep", authtoken, post_user_friendDeep);

api.get("/get_friend_searchPhone/:phone", authtoken, get_friend_searchPhone);

api.put("/put_friend_block", authtoken, put_friend_block);

//

//------- image

api.get("/get_image_deleteProfile", authtoken, get_image_deleteProfile);

api.get("/get_image_profileSaveUrl", authtoken, get_image_profileSaveUrl);

api.post("/post_image_profileUrl", authtoken, post_image_profileUrl);

//

//------- notification

api.get("/get_notification_list", authtoken, get_notification_list);

api.post("/post_notification_send", authtoken, post_notification_send);

api.put("/put_notification_delete", authtoken, put_notification_delete);

//

//------- product
api.post("/post_product_images", authtoken, post_product_images);
// 유저 funnel logging
api.post("/post_product_info", authtoken, actionFunnelLogger, post_product_info);

api.post("/post_product_inputInfo", authtoken, post_product_inputInfo);
// 유저 funnel logging
api.post("/post_product_list", authtoken, actionFunnelLogger, post_product_list);

api.post("/post_product_id", authtoken, post_product_id);

api.put("/put_product_viewIncrease", authtoken, put_product_viewIncrease);

api.get("/get_product_options/:product_id", authtoken, get_product_options);

api.post("/post_product_brand", authtoken, post_product_brand);

api.post("/post_product_enrollment", authtoken, post_product_enrollment);
//

//------- tikkling
api.get("/get_tikkling_friendinfo", authtoken, get_tikkling_friendinfo);
// 유저 funnel logging
api.get("/get_tikkling_info/:tikkling_id", authtoken, get_tikkling_info);

api.post("/post_tikkling_receivedTikkle", authtoken, post_tikkling_receivedTikkle);
// 유저 funnel logging
api.post("/post_tikkling_create", authtoken, actionFunnelLogger, post_tikkling_create);

api.post("/post_user_getTikklingDetail", authtoken, post_user_getTikklingDetail);

api.put("/put_tikkling_end/:type", authtoken, put_tikkling_end);

api.put("/put_tikkling_cancel", authtoken, put_tikkling_cancel);

api.put("/put_tikkling_stop", authtoken, put_tikkling_stop);

api.get("/get_tikkling_deliveryinfo/:tikkling_id", authtoken, get_tikkling_deliveryinfo);

api.get("/get_tikkling_refundinfo/:tikkling_id", authtoken, get_tikkling_refundinfo);

api.put("/put_tikkling_deliveryconfirm", authtoken, put_tikkling_deliveryconfirm);

api.post("/post_tikkling_sendmessage", authtoken, post_tikkling_sendmessage);
//

//------- user
api.delete("/delete_user_wishlist", authtoken, delete_user_wishlist);

api.get("/get_user_checkTikkling", authtoken, get_user_checkTikkling);

api.get("/get_user_endTikklings", authtoken, get_user_endTikklings);

api.get("/get_user_info", authtoken, get_user_info);

api.get("/get_user_myWishlist", authtoken, actionFunnelLogger, get_user_myWishlist);

api.get("/get_user_paymentHistory", authtoken, get_user_paymentHistory);

api.get("/get_bank_data", authtoken, get_bank_data);

api.post("/post_user_friend", authtoken, post_user_friend);

api.post("/post_user_wishlist", authtoken, post_user_wishlist);

api.get("/get_user_isNotice", authtoken, get_user_isNotice);

api.get("/get_user_deleteUser", authtoken, get_user_deleteUser);

api.put("/put_user_address", authtoken, put_user_address);

api.put("/put_user_nick", authtoken, put_user_nick);

api.put("/put_user_account", authtoken, put_user_account);

api.put("/put_user_token", authtoken, put_user_token);

api.put("/put_user_birthday", authtoken, put_user_birthday);

api.put("put_user_lastpresentamount", authtoken, put_user_lastpresentamount);

api.put("put_user_kakaoImage", authtoken, put_user_kakaoImage);

//

//------- payment
api.get("/get_payment_apiToken", authtoken, get_payment_apiToken);

api.post("/post_payment_init/:tikkleAction", authtoken, post_payment_init);

api.put("/put_payment_fail", authtoken, put_payment_fail);

api.post("/post_payment_getData", authtoken, post_payment_getData);

api.post("/post_payment_finalize/:tikkleAction", post_payment_finalize);

api.put("/put_payment_refund", authtoken, put_payment_refund);

//

api.post("/apple_login_test", (req, res) => {
  console.log(req.body);
  res.status(200).json({ message: "success" });
});

//-------- handler ------------------------------------------------//

exports.handler = async (req, context) => {
  return await api.run(req, context);
};
