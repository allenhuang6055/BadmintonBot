require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");
const { parseAccountMessage } = require("./accountParser");
const { appendAccountRow, getSummary } = require("./googleSheet");

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

function menuMessage() {
  return {
    type: "text",
    text: "請選擇功能：",
    quickReply: {
      items: [
        { type: "action", action: { type: "message", label: "今日統計", text: "今天" } },
        { type: "action", action: { type: "message", label: "本月統計", text: "本月" } },
        { type: "action", action: { type: "message", label: "記帳範例", text: "記帳範例" } },
      ],
    },
  };
}

function exampleText() {
  return `記帳範例：

完整格式：
記帳
日期:6/29
耗用球數:20
零打收入:500
球券收入:1000
會員收入:4500
備註:阿明年費

簡化格式：
零打500 球券1000 會員4500 耗球20`;
}

async function replySummary(replyToken, type) {
  const s = await getSummary(type);
  const title = type === "today" ? "今日統計" : "本月統計";

  return client.replyMessage({
    replyToken,
    messages: [{
      type: "text",
      text:
`📊 ${title}

零打收入：${s.dropIn} 元
球券收入：${s.ticket} 元
會員收入：${s.member} 元
總收入：${s.total} 元

耗用球數：${s.balls} 顆`
    }],
  });
}

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") return;

  const text = event.message.text.trim();

  try {
    if (text === "選單" || text === "功能") {
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [menuMessage()],
      });
    }

    if (text === "記帳範例") {
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: "text", text: exampleText() }],
      });
    }

    if (text === "今天" || text === "今日") {
      return replySummary(event.replyToken, "today");
    }

    if (text === "本月" || text === "月報") {
      return replySummary(event.replyToken, "month");
    }

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