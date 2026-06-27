const { appendV5Rows } = require("../services/googleSheet");
const { parseV5Message } = require("../utils/parser");

function expenseTemplateMessage() {
  return {
    type: "text",
    text:
`💸 支出記帳

請複製後填寫：

支出
項目:
金額:
備註:`
  };
}

function isExpenseCommand(text) {
  return text === "支出" || text === "💸 支出";
}

function isExpenseRecord(text) {
  return text.includes("支出") || text.includes("項目:") || text.includes("金額:");
}

async function handleExpense(text, user) {
  const rows = parseV5Message(text);
  const expenseRows = rows ? rows.filter(r => r.type === "支出") : [];

  if (expenseRows.length === 0) {
    throw new Error("支出資料格式不正確");
  }

  await appendV5Rows(expenseRows, user);

  const total = expenseRows.reduce((sum, r) => sum + (r.amount || 0), 0);

  return `✅ 支出記帳成功

填表人：${user.name}

支出合計：${total} 元

共新增 ${expenseRows.length} 筆資料`;
}

module.exports = {
  expenseTemplateMessage,
  isExpenseCommand,
  isExpenseRecord,
  handleExpense,
};