require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");
const { mainMenuMessage } = require("./config/menu");
const { parseV5Message } = require("./utils/parser");
const { appendV5Rows, getSummary, getAllUnpaid } = require("./services/googleSheet");

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

function formatRowsReply(rows, user) {
  let income = 0;
  let expense = 0;
  let balls = 0;
  let payment = 0;

  for (const row of rows) {
    if (row.type === "收入") income += row.amount || 0;
    if (row.type === "支出") expense += row.amount || 0;
    if (row.type === "耗球") balls += row.balls || 0;
    if (row.type === "交款") payment += row.payment || 0;
  }

  return `✅ V5 記錄成功

填表人：${user.name}

收入：${income} 元
支出：${expense} 元
交款：${payment} 元
耗球：${balls} 顆

共新增 ${rows.length} 筆資料`;
}

function formatSummary(title, summary) {
  return `📊 ${title}

收入：${summary.income} 元
支出：${summary.expense} 元
結餘：${summary.balance} 元

交款：${summary.payment} 元
未交：${summary.unpaid} 元

耗球：${summary.balls} 顆`;
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

    if (text === "今天" || text === "今日") {
      const summary = await getSummary("today");
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: "text", text: formatSummary("今日統計", summary) }],
      });
    }

    if (text === "本月" || text === "月報") {
      const summary = await getSummary("month");
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: "text", text: formatSummary("本月統計", summary) }],
      });
    }

    if (text === "我的未交") {
      const user = await getUserInfo(event);
      const summary = await getSummary("month", user.id);

      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{
          type: "text",
          text:
`👤 我的未交

填表人：${user.name}

本月收入：${summary.income} 元
本月交款：${summary.payment} 元
尚未繳交：${summary.unpaid} 元`
        }],
      });
    }

    if (text === "幹部未交") {
      const list = await getAllUnpaid();

      const body = list
        .filter(item => item.unpaid !== 0)
        .map(item => `${item.name}：${item.unpaid} 元`)
        .join("\n") || "目前沒有未交款";

      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: "text", text: `👥 幹部未交\n\n${body}` }],
      });
    }

    const rows = parseV5Message(text);
    if (!rows) return;

    const user = await getUserInfo(event);
    await appendV5Rows(rows, user);

    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: "text", text: formatRowsReply(rows, user) }],
    });

  } catch (err) {
    console.error(err);

    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: "text",
        text:
`❌ V5 記錄失敗

原因：${err.message}

範例：
收入
零打收入:500
球券收入:1000
會員收入:4500
耗球:20
備註:阿明年費

支出
項目:買球
金額:6900
備註:AS30

交款:6000`
      }],
    });
  }
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`BadmintonBot V5 running on port ${port}`);
});