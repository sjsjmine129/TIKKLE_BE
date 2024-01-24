const admin = require("firebase-admin");
const serviceAccount = require("./tikkle-c9666-firebase-adminsdk-knplx-fcb6d4f595.json");

const firebaseKeys = {
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url,
};

admin.initializeApp({
  credential: admin.credential.cert(firebaseKeys),
});

exports.fcm_send = async (token, title, body, link) => {
  const message = {
    token,
    android: {
      priority: "high",
      notification: {
        sound: "default",
        title: title, //기기 푸시 알림 제목
        body: body, //기기 푸시알림 내용
      },
      data: {
        link: link,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          "content-available": 1,
          alert: {
            //아이폰 알림 창
            title: title,
            body: body,
            "action-loc-key": "PLAY",
          },
        },
        link: link,
        title: title,
        body: body,
      },
    },
  };

  admin
    .messaging()
    .send(message)
    .then((response) => {
      console.log("push success: ", response);
      return true;
    })
    .catch((error) => {
      console.log("push error: ", error);
      return false;
    });
};

exports.fcm_send_many = async (tokens, title, body, link) => {
  const message = {
    android: {
      priority: "high",
      notification: {
        sound: "default",
        title: title, //기기 푸시 알림 제목
        body: body, //기기 푸시알림 내용
      },
      data: {
        link: link,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          "content-available": 1,
          alert: {
            //아이폰 알림 창
            title: title,
            body: body,
            "action-loc-key": "PLAY",
          },
        },
        link: link,
        title: title,
        body: body,
      },
    },
    tokens: tokens,
  };

  admin
    .messaging()
    .sendMulticast(message)
    .then(function (res) {
      console.log("Successfully sent message: : ", res);
      return;
    })
    .catch(function (err) {
      console.log("Error Sending message!!! : ", err);
      return;
    });
};
