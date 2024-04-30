require('dotenv').config();

const express = require('express');
const router = express.Router();

const line = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');
const querystring = require('node:querystring');
const request = require('request');

const accessToken = process.env.CHANNEL_ACCESS_TOKEN;
const baseUrl = process.env.BASE_URL;

// create LINE SDK client
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: accessToken,
});
const blobClient = new line.messagingApi.MessagingApiBlobClient({
  channelAccessToken: accessToken,
});

router.get('/', (req, res) => res.end(`I'm listening. Please access with POST.`));

router.post("/", (req, res) => {
  console.log("🚀 ~ app.post ~ req:", req);
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
async function handleEvent(event) {
  console.log("🚀 ~ handleEvent ~ event:", event);

  if (event.type === "postback") {
    const data = querystring.parse(event.postback.data);
    const params = event.postback.params ?? undefined
    if (data.action === "url" && data.item === "clarence") {
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: "https://ithelp.ithome.com.tw/users/20117701/ironman/2634",
          },
        ],
      });
    }
    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: `Got postback: ${JSON.stringify(data)} ${params && JSON.stringify(params)}`,
        },
      ],
    });
  }

  if (event.type === "message" && event.message.type === "image") {
    const imageId = event.message.id;
    // const downloadPath = path.join(process.cwd(), "public", "download", `${imageId}.jpg`)

    const previewImage = await blobClient.getMessageContentPreview(imageId)
    console.log('🚀 ~ handleEvent ~ previewImage:', previewImage)
    // const previewImageUrl = `https://api-data.line.me/v2/bot/message/${imageId}/content/preview`
    if (event.message.contentProvider.type === "line") {

      // const imageFileName = await downloadContent(imageId, downloadPath)
      // console.log('🚀 ~ handleEvent ~ imageFileName:', imageFileName)

      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: "hello world"
          },
          // {
          //   type: "image",
          //   originalContentUrl: previewImage,
          //   previewImageUrl: previewImage,
          // },
        ],
      });
    }

    // const { originalContentUrl, previewImageUrl } = await downloadContent(imageId, downloadPath)
    // console.log('🚀 ~ handleEvent ~ originalContentUrl:', originalContentUrl)
    // console.log('🚀 ~ handleEvent ~ previewImageUrl:', previewImageUrl)

    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "image",
          originalContentUrl: previewImage,
          previewImageUrl: previewImage,
        },
      ],
    });
  }

  if (event.type !== "message" || event.message.type !== "text") {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  // create an echoing text message
  const echo = {
    type: "text",
    text: "Quick reply sample ?",
    quickReply: {
      items: [
        {
          type: "action",
          action: {
            type: "postback",
            label: "廣告投放代理",
            data: "action=service&item=advertisingAgency",
            text: "廣告投放代理",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: "企業活動規劃",
            data: "action=service&item=eventPlanning",
            text: "企業活動規劃",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: "社群口碑行銷",
            data: "action=service&item=socialMedia",
            text: "社群口碑行銷",
          },
        },
        {
          type: "action",
          action: {
            type: "postback",
            label: "數位形象設計",
            data: "action=service&item=digitalImageDesign",
            text: "數位形象設計",
          },
        },
        {
          type: "action",
          action: {
            type: "uri",
            label: "Musense",
            uri: "https://musense.tw",
            altUri: {
              desktop: "https://musense.tw",
            },
          },
        },
        {
          type: "action",
          action: {
            type: "camera",
            label: "Send camera",
          },
        },
        {
          type: "action",
          action: {
            type: "cameraRoll",
            label: "Send camera roll",
          },
        },
        {
          type: "action",
          action: {
            type: "location",
            label: "Send location",
          },
        },
        {
          "type": "action",
          "action": {
            "type": "clipboard",
            "label": "Copy",
            "clipboardText": "3B48740B"
          }
        }
      ],
    },
  };

  // use reply API
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [echo],
  });
}

async function downloadContent(messageId, downloadPath) {
  return blobClient.getMessageContent(messageId)
    .then(stream => new Promise((resolve, reject) => {
      const writable = fs.createWriteStream(downloadPath);
      stream.pipe(writable);
      stream.on("end", () => resolve(downloadPath));
      stream.on("error", () => reject);
    }),
    );
}


module.exports = router