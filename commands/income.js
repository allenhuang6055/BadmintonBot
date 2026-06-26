const { appendV5Rows } = require("../services/googleSheet");
const { parseV5Message } = require("../utils/parser");

function incomeTemplateMessage() {
  return {
    type: "text",
    text:
`💰 收入記帳

請複製後填數字：

收入
零打收入:
球券收入:
會員收入:
耗球:
備註:`
  };
}

function isIncomeCommand(text) {
  return text === "收入" || text === "💰 收入";
}

function isIncomeRecord(text) {
  return (
    text.includes("零打收入") ||
    text.includes("球券收入") ||
    text.includes("會員收入") ||
    text.includes("耗球")
  );
}

async function handleIncome(text, user) {
  const rows = parseV5Message(text);

  if (!rows || rows.length === 0) {
    throw new Error("收入資料格式不正確");
  }

  await appendV5Rows(rows, user);

  let income = 0;
  let balls = 0;

  for (const row of rows) {
    if (row.type === "收入") income += row.amount || 0;
    if (row.type === "耗球") balls += row.balls || 0;
  }

  return `✅ 收入記帳成功

填表人：${user.name}

收入合計：${income} 元
耗球：${balls} 顆

共新增 ${rows.length} 筆資料`;
}

module.exports = {
  incomeTemplateMessage,
  isIncomeCommand,
  isIncomeRecord,
  handleIncome,
};