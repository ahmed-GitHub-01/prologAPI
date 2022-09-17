const express = require("express");
const body_parser = require("body-parser");
const { default: axios } = require("axios");
const encode = require("node-base64-image").encode;
require("dotenv").config();

const app = express().use(body_parser.json());

const token = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;
// let phone_id = 107851761999552;

app.listen(process.env.PORT, () => {
  console.log("webhook is listening");
});

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// you well take full url. from huroki.
app.get("/webhook", (req, res) => {
  let mode = req.query["hub.mode"];
  let challenge = req.query["hub.challenge"];
  let token = req.query["hub.verify_token"];

  if (mode && token) {
    if (mode === "subscribe" && token === mytoken) {
      res.status(200).send(challenge);
    } else {
      res.status(403);
    }
  }
});

app.post("/webhook", (req, res) => {
  let body_param = req.body;
  console.log(JSON.stringify(body_param, null, 2));
  let data = {};
  if (res.sendStatus(200)) {
    if (body_param.entry[0].changes[0].value.hasOwnProperty("statuses")) {
      let datas = {};
      datas.MessageID = body_param.entry[0].changes[0].value.statuses[0].id;
      datas.Status = body_param.entry[0].changes[0].value.statuses[0].status;
      // console.log(JSON.stringify(datas, null, 2));
      axios({
        method: "POST",
        url:
          "http://37.34.208.24:9977/Messages/UpdateStatus/" + datas.MessageID,
        data: datas,
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then(function (result) {
          // console.log(result.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    }

    // if (body_param.entry[0].changes[0].value.messages[0].from) {
    // }

    data.ToNumber =
      body_param.entry[0].changes[0].value.metadata.display_phone_number;
    data.ChatID = body_param.entry[0].id;
    // let ReadMessage = "";
    var configg = {
      method: "get",
      url:
        "http://37.34.208.24:9977/Messages/GetTokenForImage/" + data.ToNumber,
    };

    // let UserSent = "";
    //body_param.entry[0].changes[0].value.messages[0].context != null

    if (body_param.entry[0].changes[0].value.hasOwnProperty("messages")) {
      if (
        body_param.entry[0].changes[0].value.messages[0].hasOwnProperty(
          "context"
        )
      ) {
        data.ReplyId =
          body_param.entry[0].changes[0].value.messages[0].context.id;
      }
      data.FromNumber = body_param.entry[0].changes[0].value.messages[0].from;
      data.MessageID = body_param.entry[0].changes[0].value.messages[0].id;
      data.NameSentMessage =
        body_param.entry[0].changes[0].value.contacts[0].profile.name;
      data.TypeMessage = body_param.entry[0].changes[0].value.messages[0].type;
    }
    // data.Status = "";

    if (data.TypeMessage == "text") {
      data.ContentMessage =
        body_param.entry[0].changes[0].value.messages[0].text.body;
      PostDataToDataBase(JSON.stringify(data, null, 2));
    } else if (
      data.TypeMessage === "image" ||
      data.TypeMessage === "document" ||
      data.TypeMessage === "audio" ||
      data.TypeMessage === "video"
    ) {
      // Start Compare type Docment
      let id = "";
      if (data.TypeMessage === "image") {
        if (body_param.entry[0].changes[0].value.messages[0].image.caption) {
          data.ContentMessage =
            body_param.entry[0].changes[0].value.messages[0].image.caption;
        }
        data.TypeDocument =
          body_param.entry[0].changes[0].value.messages[0].image.mime_type;
        id = body_param.entry[0].changes[0].value.messages[0].image.id;
        //===========================
      } else if (data.TypeMessage === "document") {
        if (body_param.entry[0].changes[0].value.messages[0].document.caption) {
          data.ContentMessage =
            body_param.entry[0].changes[0].value.messages[0].document.caption;
        }
        id = body_param.entry[0].changes[0].value.messages[0].document.id;
        data.TypeDocument =
          body_param.entry[0].changes[0].value.messages[0].document.mime_type;
        //===========================
      } else if (data.TypeMessage === "audio") {
        if (body_param.entry[0].changes[0].value.messages[0].audio.caption) {
          data.ContentMessage =
            body_param.entry[0].changes[0].value.messages[0].audio.caption;
        }
        data.TypeDocument =
          body_param.entry[0].changes[0].value.messages[0].audio.mime_type;
        id = body_param.entry[0].changes[0].value.messages[0].audio.id;
        //===========================
      } else if (data.TypeMessage === "video") {
        if (body_param.entry[0].changes[0].value.messages[0].video.caption) {
          data.ContentMessage =
            body_param.entry[0].changes[0].value.messages[0].video.caption;
        }
        data.TypeDocument =
          body_param.entry[0].changes[0].value.messages[0].video.mime_type;
        id = body_param.entry[0].changes[0].value.messages[0].video.id;
      }
      // End Compare type Docment

      // start Get document

      axios(configg)
        .then(function (response) {
          data.UserSent = response.data.user;
          phoneToken = response.data.token;
          // console.log(response.data);
          var config = {
            method: "get",
            url: "https://graph.facebook.com/v13.0/" + id,
            headers: {
              Authorization: "Bearer " + response.data.token,
            },
          };
          axios(config)
            .then(function (responsee) {
              // console.log(responsee.data);
              const options = {
                string: true,
                headers: {
                  Authorization: "Bearer " + response.data.token,
                },
              };

              encode(responsee.data.url, options).then(function (result) {
                data.MediaEncode = result;
                PostDataToDataBase(JSON.stringify(data, null, 2));
              });
            })
            .catch(function (error) {
              console.log(error);
            });
        })
        .catch(function (error) {
          console.log(error);
        });

      // End Get document
    }
  } else {
    res.sendStatus(404);
  }
});

async function PostDataToDataBase(dataToSave) {
  axios({
    method: "POST",
    url: "http://37.34.208.24:9977/Messages/RecivedMessage",
    data: dataToSave,
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then(function (result) {
      // console.log(result.data);
    })
    .catch(function (error) {
      console.log(error);
    });

  // console.log("done!");
}

// async function sendMessageTemp() {
//   var configToSendTemp = {
//     method: "POST",
//     url:
//       "https://graph.facebook.com/v13.0/" +
//       body_param_to_send_temp.phone_id +
//       "/messages",
//     data: {
//       messaging_product: "whatsapp",
//       recipient_type: "individual",
//       to: body_param_to_send_temp.to,
//       type: "template",
//       template: {
//         name: "temp",
//         language: {
//           code: "ar",
//         },
//       },
//     },
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: "Bearer " + body_param_to_send_temp.token,
//     },
//   };
//   let res = axios(configToSendTemp);
//   res
//     .then(function (response) {
//       const dataToSentToDataBase = {};
//       dataToSentToDataBase.Code = 0;
//       dataToSentToDataBase.FromNumber = body_param_to_send_temp.fromNumber;
//       dataToSentToDataBase.ToNumber = body_param_to_send_temp.to;
//       dataToSentToDataBase.MessageID = response.data.messages[0].id;
//       dataToSentToDataBase.ChatID = "";
//       dataToSentToDataBase.UserSent = body_param_to_send_temp.usercode;
//       dataToSentToDataBase.NameSentMessage = body_param_to_send_temp.senderName;
//       dataToSentToDataBase.TypeMessage = "text";
//       dataToSentToDataBase.ToAnyOne = "me";
//       dataToSentToDataBase.contentMessage = "السلام عليكم.";
//       dataToSentToDataBase.PublicId = "";
//       axios({
//         method: "POST",
//         url:
//           "http://37.34.208.24:9977/Messages/SendMessages/" +
//           dataToSentToDataBase.UserSent,
//         data: dataToSentToDataBase,
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }).then(function (resul) {});
//     })
//     .catch(function (error) {
//       console.log(error);
//     });
// }
app.post("/webhook/sendmessage", (req, res) => {
  let body_param = req.body;
  console.log(JSON.stringify(body_param, null, 2));
  let phone_no_id2 = body_param.to;
  let text = body_param.text;

  if (body_param.text) {
    axios({
      method: "POST",
      url:
        "https://graph.facebook.com/v14.0/" +
        phone_id +
        "/messages?access_token=" +
        token,
      data: {
        messaging_product: "whatsapp",
        to: phone_no_id2,
        text: {
          body: text,
        },
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
  } else {
    res.sendStatus(404);
  }
});

app.post("/webhook/sendmessagetemp", (req, res) => {
  let body_param = req.body;
  // let toNumber = body_param.to;
  // console.log(body_param);

  if (body_param.type == "text") {
    // ===============================================
    send_Text_Messages_to_customers(body_param);
    // res.status(200);
  } else if (body_param.type == "image") {
    send_Image_Messages_to_customers(body_param);
  } else {
    res.sendStatus(404);
  }
});

async function send_Text_Messages_to_customers(dataTosend) {
  var configSendSmsNormal = {
    method: "POST",
    url:
      "https://graph.facebook.com/v14.0/" + dataTosend.phone_id + "/messages",
    data: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: dataTosend.to,
      preview_url: true,
      type: "template",
      template: {
        name: "15",
        language: {
          code: "ar",
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: dataTosend.text,
              },
            ],
          },
        ],
      },
    },
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + dataTosend.token,
    },
  };

  var res = axios(configSendSmsNormal);
  res
    .then(function (response) {
      const dataToSentToDataBase = {};
      dataToSentToDataBase.Code = 0;
      dataToSentToDataBase.FromNumber = dataTosend.fromNumber;
      dataToSentToDataBase.ToNumber = dataTosend.to;
      dataToSentToDataBase.MessageID = response.data.messages[0].id;
      dataToSentToDataBase.ChatID = "";
      dataToSentToDataBase.UserSent = dataTosend.usercode;
      dataToSentToDataBase.NameSentMessage = dataTosend.senderName;
      dataToSentToDataBase.TypeMessage = "text";
      dataToSentToDataBase.ToAnyOne = "me";
      dataToSentToDataBase.contentMessage = dataTosend.text;
      dataToSentToDataBase.PublicId = "";
      // console.log(response.data);
      axios({
        method: "POST",
        url:
          "http://37.34.208.24:9977/Messages/SendMessages/" +
          dataToSentToDataBase.UserSent,
        data: dataToSentToDataBase,
        headers: {
          "Content-Type": "application/json",
        },
      });
    })
    .catch(function (error) {
      console.log(error);
    });
}

async function send_Image_Messages_to_customers(dataTosend) {
  var configSendImage = {
    method: "POST",
    url:
      "https://graph.facebook.com/v13.0/" + dataTosend.phone_id + "/messages",
    data: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: dataTosend.to,
      preview_url: true,
      type: "template",
      template: {
        name: "15mg",
        language: {
          code: "ar",
        },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "image",
                image: {
                  link: dataTosend.imageUrl,
                },
              },
            ],
          },
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: dataTosend.text,
              },
            ],
          },
        ],
      },
    },
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + dataTosend.token,
    },
  };
  let res = axios(configSendImage);
  res.then(function (response2) {
    const option1 = {
      string: true,
    };
    encode(dataTosend.imageUrl, option1)
      .then(function (result) {
        const dataToSentToDataBase = {};
        dataToSentToDataBase.Code = 0;
        dataToSentToDataBase.FromNumber = dataTosend.fromNumber;
        dataToSentToDataBase.ToNumber = dataTosend.to;
        dataToSentToDataBase.MessageID = response2.data.messages[0].id;
        dataToSentToDataBase.ChatID = "";
        dataToSentToDataBase.UserSent = dataTosend.usercode;
        dataToSentToDataBase.NameSentMessage = dataTosend.senderName;
        dataToSentToDataBase.TypeMessage = "image";
        dataToSentToDataBase.ToAnyOne = "me";
        dataToSentToDataBase.contentMessage = dataTosend.text;
        dataToSentToDataBase.MediaEncode = result;
        dataToSentToDataBase.PublicId = dataTosend.publicId;
        // console.log(dataToSentToDataBase);
        axios({
          method: "POST",
          url:
            "http://37.34.208.24:9977/Messages/SendMessages/" +
            dataToSentToDataBase.UserSent,
          data: dataToSentToDataBase,
          headers: {
            "Content-Type": "application/json",
          },
        });
      })
      .catch(function (error) {
        console.log(error);
      });
  });
}

// app.get("", (req, res) => {});

// app.get("/", (req, res) => {
// //   res.status(200).send("hello");
// });
