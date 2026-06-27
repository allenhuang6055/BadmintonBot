const { getSummary, getAllUnpaid } = require("../services/googleSheet");

function formatSummary(title, summary) {
  return `📊 ${title}

收入：${summary.income} 元
支出：${summary.expense} 元
結餘：${summary.balance} 元

交款：${summary.payment} 元
未交：${summary.unpaid} 元

耗球：${summary.balls} 顆`;
}

function isTodayQuery(text) {
  return text === "今天" || text === "今日";
}

function isMonthQuery(text) {
  return text === "本月" || text === "月報";
}

function isMyUnpaidQuery(text) {
  return text === "我的未交";
}

function isAllUnpaidQuery(text) {
  return text === "幹部未交";
}

async function handleTodayQuery() {
  const summary = await getSummary("today");
  return formatSummary("今日統計", summary);
}

async function handleMonthQuery() {
  const summary = await getSummary("month");
  return formatSummary("本月統計", summary);
}

async function handleMyUnpaidQuery(user) {
  const summary = await getSummary("month", user.id);

  return `👤 我的未交

填表人：${user.name}

本月收入：${summary.income} 元
本月交款：${summary.payment} 元
尚未繳交：${summary.unpaid} 元`;
}

async function handleAllUnpaidQuery() {
  const list = await getAllUnpaid();

  const body = list
    .filter(item => item.unpaid !== 0)
    .map(item => `${item.name}：${item.unpaid} 元`)
    .join("\n") || "目前沒有未交款";

  return `👥 幹部未交

${body}`;
}

module.exports = {
  isTodayQuery,
  isMonthQuery,
  isMyUnpaidQuery,
  isAllUnpaidQuery,
  handleTodayQuery,
  handleMonthQuery,
  handleMyUnpaidQuery,
  handleAllUnpaidQuery,
};