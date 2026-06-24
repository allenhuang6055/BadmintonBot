require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");
const { parseAccountMessage } = require("./accountParser");
const { appendAccountRow } = require("./googleSheet");

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const app = express();
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

app.get("/", (req, res) => {
  res.send("BadmintonBot is running");
});

app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return;
  }

  const text = event.message.text;

  try {
    const data = parseAccountMessage(text);

    if (!data) return;

    await appendAccountRow(data);

    const totalIncome = data.dropIn + data.ticket + data.member;

    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: "text",
        text:
`✅ 記帳成功

日期：${data.date}

零打收入：${data.dropIn} 元
球券收入：${data.ticket} 元
會員收入：${data.member} 元
總收入：${totalIncome} 元

耗用球數：${data.balls} 顆
備註：${data.note || "無"}`
      }],
    });
  } catch (err) {
    console.error(err);

    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: "text",
        text:
`❌ 記帳失敗

原因：${err.message}

請用格式：
記帳
日期:6/29
耗用球數:20
零打收入:500
球券收入:1000
會員收入:4500
備註:阿明年費`
      }],
    });
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`BadmintonBot running on port ${port}`);
});