require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");
const path = require("path");

const { mainMenuMessage } = require("./config/menu");

const {
  incomeTemplateMessage,
  isIncomeCommand,
  isIncomeRecord,
  handleIncome,
} = require("./commands/income");

const {
  expenseTemplateMessage,
  isExpenseCommand,
  isExpenseRecord,
  handleExpense,
} = require("./commands/expense");

const {
  paymentTemplateMessage,
  isPaymentCommand,
  isPaymentRecord,
  handlePayment,
} = require("./commands/payment");

const {
  isTodayQuery,
  isMonthQuery,
  isMyUnpaidQuery,
  isAllUnpaidQuery,
  handleTodayQuery,
  handleMonthQuery,
  handleMyUnpaidQuery,
  handleAllUnpaidQuery,
} = require("./commands/query");

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
};

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

app.get("/", (req, res) => {
  res.send("BadmintonBot V5 is running");
});

app.get("/liff", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "liff", "index.html"));
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

function getUserInfo(event) {
  const userId = event.source.userId || "";
  const groupId = event.source.groupId || "";
  const roomId = event.source.roomId || "";

  return {
    id: userId || groupId || roomId || "unknown",
    name: userId || groupId || roomId || "unknown",
  };
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

    if (text === "表單" || text === "LIFF") {
      return replyText(
        event.replyToken,
        "請開啟表單：https://badmintonbot-39ao.onrender.com/liff"
      );
    }

    if (isIncomeCommand(text)) {
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [incomeTemplateMessage()],
      });
    }

    if (isExpenseCommand(text)) {
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [expenseTemplateMessage()],
      });
    }

    if (isPaymentCommand(text)) {
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [paymentTemplateMessage()],
      });
    }

    const user = getUserInfo(event);

    if (isTodayQuery(text)) {
      return replyText(event.replyToken, await handleTodayQuery());
    }

    if (isMonthQuery(text)) {
      return replyText(event.replyToken, await handleMonthQuery());
    }

    if (isMyUnpaidQuery(text)) {
      return replyText(event.replyToken, await handleMyUnpaidQuery(user));
    }

    if (isAllUnpaidQuery(text)) {
      return replyText(event.replyToken, await handleAllUnpaidQuery());
    }

    if (isIncomeRecord(text)) {
      return replyText(event.replyToken, await handleIncome(text, user));
    }

    if (isExpenseRecord(text)) {
      return replyText(event.replyToken, await handleExpense(text, user));
    }

    if (isPaymentRecord(text)) {
      return replyText(event.replyToken, await handlePayment(text, user));
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
備註:測試

支出範例：
支出
項目:買球
金額:6900
備註:AS30

交款範例：
交款:6000
備註:6月第4週`
    );
  }
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`BadmintonBot V5 running on port ${port}`);
});