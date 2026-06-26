require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");

const { mainMenuMessage } = require("./config/menu");
const {
  incomeTemplateMessage,
  isIncomeCommand,
  isIncomeRecord,
  handleIncome,
} = require("./commands/income");

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const app = express();

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

app.get("/", (req, res) => {
  res.send("BadmintonBot V5 is running");
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

async function getUserInfo(event) {
  const userId = event.source.userId || "";
  let name = userId || "未知使用者";

  try {
    if (event.source.type === "user" && userId) {
      const profile = await client.getProfile(userId);
      name = profile.displayName || name;
    }

    if (event.source.type === "group" && event.source.groupId && userId) {
      const profile = await client.getGroupMemberProfile(event.source.groupId, userId);
      name = profile.displayName || name;
    }

    if (event.source.type === "room" && event.source.roomId && userId) {
      const profile = await client.getRoomMemberProfile(event.source.roomId, userId);
      name = profile.displayName || name;
    }
  } catch (err) {
    console.error("取得 LINE 使用者名稱失敗：", err.message);
  }

  return { id: userId, name };
}

async function replyText(replyToken, text) {
  return client.replyMessage({
    replyToken,
    messages: [{ type: "text", text }],
  });
}

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") return;

  const text = event.message.text.trim();

  try {
    if (text === "選單" || text === "功能" || text === "V5") {
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [mainMenuMessage()],
      });
    }

    if (isIncomeCommand(text)) {
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [incomeTemplateMessage()],
      });
    }

    if (isIncomeRecord(text)) {
      const user = await getUserInfo(event);
      const result = await handleIncome(text, user);
      return replyText(event.replyToken, result);
    }

    return;
  } catch (err) {
    console.error(err);

    return replyText(
      event.replyToken,
      `❌ V5 記錄失敗

原因：${err.message}

收入範例：
收入
零打收入:500
球券收入:1000
會員收入:4500
耗球:20
備註:測試`
    );
  }
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`BadmintonBot V5 running on port ${port}`);
});