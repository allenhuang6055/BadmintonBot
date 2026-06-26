function getNumber(text, labels) {
  for (const label of labels) {
    const regex = new RegExp(label + "\\s*[:：=]?\\s*([0-9,]+)", "i");
    const match = text.match(regex);
    if (match) return Number(match[1].replace(/,/g, ""));
  }
  return 0;
}

function getText(text, labels) {
  for (const label of labels) {
    const regex = new RegExp(label + "\\s*[:：=]?\\s*([^\\n]+)", "i");
    const match = text.match(regex);
    if (match) return match[1].trim();
  }
  return "";
}

function getTodayText() {
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const d = parts.find(p => p.type === "day").value;
  return `${y}/${m}/${d}`;
}

function normalizeDate(text) {
  const dateText = getText(text, ["日期"]);
  if (!dateText) return getTodayText();

  const year = new Date().getFullYear();
  if (/^\d{1,2}\/\d{1,2}$/.test(dateText)) {
    return `${year}/${dateText}`;
  }
  return dateText;
}

function parseV5Message(text) {
  const clean = text.trim();
  const date = normalizeDate(clean);
  const note = getText(clean, ["備註"]);

  const rows = [];

  const dropIn = getNumber(clean, ["零打收入", "零打", "零"]);
  const ticket = getNumber(clean, ["球券收入", "球券"]);
  const member = getNumber(clean, ["會員收入", "會員"]);
  const balls = getNumber(clean, ["耗用球數", "耗球", "耗球數"]);
  const payment = getNumber(clean, ["交款", "繳款"]);
  const expenseAmount = getNumber(clean, ["金額", "支出"]);

  if (dropIn > 0) rows.push({ date, type: "收入", item: "零打", amount: dropIn, balls: 0, payment: 0, note });
  if (ticket > 0) rows.push({ date, type: "收入", item: "球券", amount: ticket, balls: 0, payment: 0, note });
  if (member > 0) rows.push({ date, type: "收入", item: "會員", amount: member, balls: 0, payment: 0, note });
  if (balls > 0) rows.push({ date, type: "耗球", item: "耗球", amount: 0, balls, payment: 0, note });
  if (payment > 0) rows.push({ date, type: "交款", item: "幹部交款", amount: 0, balls: 0, payment, note });

  if (clean.includes("支出")) {
    const item = getText(clean, ["項目"]) || detectExpenseItem(clean) || "其他";
    const amount = expenseAmount || detectExpenseAmount(clean, item);

    if (amount > 0) {
      rows.push({ date, type: "支出", item, amount, balls: 0, payment: 0, note });
    }
  }

  if (rows.length === 0) return null;

  return rows;
}

function detectExpenseItem(text) {
  const items = ["買球", "場租", "聚餐", "餐費", "比賽", "行政", "雜支", "其他"];
  return items.find(item => text.includes(item)) || "";
}

function detectExpenseAmount(text, item) {
  if (!item) return 0;
  const regex = new RegExp(item + "\\s*[:：=]?\\s*([0-9,]+)");
  const match = text.match(regex);
  if (!match) return 0;
  return Number(match[1].replace(/,/g, ""));
}

module.exports = {
  parseV5Message,
  getTodayText,
};