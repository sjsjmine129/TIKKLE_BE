const { queryDatabase } = require("db.js");

const { getSSMParameter } = require("ssm.js");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

exports.get_image_deleteProfile = async (req, res) => {
  const body = req.body;
  const id = req.id;
  const returnToken = req.returnToken;

  //get old image url
  let pastUrl;

  try {
    const rows = await queryDatabase(
      `	SELECT image
			 	FROM users
				WHERE id = ?
			`,
      [id]
    );

    pastUrl = rows[0].image;
  } catch (err) {
    console.log("SQL error: ", err);
    return {
      statusCode: 501,
      body: "SQL error: ",
    };
  }

  //-------- delete user image data  --------------------------------------------------------------------------------------//
  let sqlResult;

  try {
    const rows = await queryDatabase("UPDATE users SET image = ? WHERE id = ?", ["https://d2da4yi19up8sp.cloudfront.net/profile/default.JPG", id]);

    sqlResult = rows;
    //console.log("SQL result : ", sqlResult);
  } catch (err) {
    console.log(" get_image_deleteProfile 에서 에러가 발생했습니다.", err);
    const return_body = {
      success: false,
      detail_code: "01",
      message: "SQL error",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //-------- delete user image s3 file  --------------------------------------------------------------------------------------//

  const src_filename = "tikkle-profile-" + id.toString() + ".JPG";
  const bucket_src = await getSSMParameter("tikkleprofileS3");

  // Delete src image
  try {
    const deleteParams = {
      Bucket: bucket_src,
      Key: src_filename,
    };

    await s3.deleteObject(deleteParams).promise();

    // console.log("Src Object deleted successfully");
  } catch (error) {
    console.log("get_image_deleteProfile 에서 에러가 발생했습니다.", error);
    const return_body = {
      success: false,
      detail_code: "02",
      message: "Error deleting src object in s3",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  // delete resized image
  const timeStamp = pastUrl.split("-")[1].split(".")[0];

  // console.log("timeStamp : ", timeStamp);

  const dstBucket = "tikkle-s3.online/profile";
  const fileName = id + "-" + timeStamp + ".JPG";

  //console.log("dstBucket : ", dstBucket);
  //console.log("fileName : ", fileName);

  try {
    const params = {
      Bucket: dstBucket,
      Key: fileName,
    };

    const result = await s3.deleteObject(params).promise();
  } catch (err) {
    console.log("get_image_deleteProfile 에서 에러가 발생했습니다.", error);
    const return_body = {
      success: false,
      detail_code: "02",
      message: "Error deleting src object in s3",
      returnToken: null,
    };
    return res.status(500).send(return_body);
  }

  //-------- return result --------------------------------------------------------------------------------------//

  const return_body = {
    success: true,
    data: sqlResult,
    detail_code: "00",
    message: "success to delete profile image",
    returnToken: returnToken,
  };
  return res.status(200).send(return_body);
};
