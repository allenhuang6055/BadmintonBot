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
    const regex = new RegExp(label + "\\s*[:：=]?\\s*(.+)", "i");
    const match = text.match(regex);
    if (match) return match[1].trim();
  }
  return "";
}

function normalizeDate(dateText) {
  const now = new Date();
  const year = now.getFullYear();

  if (!dateText) {
    return `${year}/${now.getMonth() + 1}/${now.getDate()}`;
  }

  if (/^\d{1,2}\/\d{1,2}$/.test(dateText)) {
    return `${year}/${dateText}`;
  }

  return dateText;
}

function parseAccountMessage(text) {
  const isAccount =
    text.includes("記帳") ||
    text.includes("零打") ||
    text.includes("球券") ||
    text.includes("會員") ||
    text.includes("耗球") ||
    text.includes("耗用球數");

  if (!isAccount) return null;

  const dateText = getText(text, ["日期"]);
  const date = normalizeDate(dateText);

  const dropIn = getNumber(text, ["暢打零打收費", "零打收入", "零打"]);
  const ticket = getNumber(text, ["球券收入", "球券"]);
  const member = getNumber(text, ["會員收入", "會員"]);
  const balls = getNumber(text, ["耗用球數", "耗球", "球"]);

  const note = getText(text, ["備註"]);

  if (dropIn === 0 && ticket === 0 && member === 0 && balls === 0) {
    throw new Error("沒有讀到金額或耗球數");
  }

  return { date, dropIn, ticket, member, balls, note };
}

module.exports = { parseAccountMessage };