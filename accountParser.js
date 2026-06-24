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

function parseAccountMessage(text) {
  if (!text.includes("記帳")) return null;

  const dateText = getText(text, ["日期"]);
  if (!dateText) throw new Error("缺少日期");

  const today = new Date();
  const year = today.getFullYear();

  let date = dateText;
  if (/^\d{1,2}\/\d{1,2}$/.test(dateText)) {
    date = `${year}/${dateText}`;
  }

  const dropIn = getNumber(text, ["暢打零打收費", "零打收入", "零打"]);
  const ticket = getNumber(text, ["球券收入", "球券"]);
  const member = getNumber(text, ["會員收入", "會員"]);
  const balls = getNumber(text, ["耗用球數", "耗球", "耗用"]);

  const note = getText(text, ["備註"]);

  return {
    date,
    dropIn,
    ticket,
    member,
    balls,
    note,
  };
}

module.exports = { parseAccountMessage };