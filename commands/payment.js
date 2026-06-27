const { appendV5Rows } = require("../services/googleSheet");
const { parseV5Message } = require("../utils/parser");

function paymentTemplateMessage() {
  return {
    type: "text",
    text:
`🏦 交款記錄

請複製後填寫：

交款:
備註:`
  };
}

function isPaymentCommand(text) {
  return text === "交款" || text === "🏦 交款";
}

function isPaymentRecord(text) {
  return text.includes("交款:") || text.includes("繳款:");
}

async function handlePayment(text, user) {
  const rows = parseV5Message(text);
  const paymentRows = rows ? rows.filter(r => r.type === "交款") : [];

  if (paymentRows.length === 0) {
    throw new Error("交款資料格式不正確");
  }

  await appendV5Rows(paymentRows, user);

  const total = paymentRows.reduce((sum, r) => sum + (r.payment || 0), 0);

  return `✅ 交款記錄成功

填表人：${user.name}

交款金額：${total} 元`;
}

module.exports = {
  paymentTemplateMessage,
  isPaymentCommand,
  isPaymentRecord,
  handlePayment,
};