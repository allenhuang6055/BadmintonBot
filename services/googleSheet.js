require("dotenv").config();
const { google } = require("googleapis");

const SHEET_NAME = "03_LINE資料庫";

function getGoogleAuth() {
  const authOptions = {
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  };

  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    authOptions.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  } else {
    authOptions.keyFile = process.env.GOOGLE_CREDENTIALS_PATH || "./credentials.json";
  }

  return new google.auth.GoogleAuth(authOptions);
}

function getSheets() {
  const auth = getGoogleAuth();
  return google.sheets({ version: "v4", auth });
}

async function appendV5Rows(rows, user) {
  const sheets = getSheets();

  const createdAt = new Date().toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
  });

  const values = rows.map(row => [
    row.date,
    user.name,
    user.id,
    row.type,
    row.item,
    row.amount || 0,
    row.balls || 0,
    row.payment || 0,
    row.note || "",
    "有效",
    createdAt,
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A:K`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

async function getV5Rows() {
  const sheets = getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A:K`,
  });

  return res.data.values || [];
}

function isValidRow(row) {
  return row[9] !== "作廢";
}

function sameMonth(dateText, now) {
  const d = new Date(dateText);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function sameDay(dateText, now) {
  const d = new Date(dateText);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

async function getSummary(type, userId = null) {
  const rows = await getV5Rows();
  const now = new Date();

  let income = 0;
  let expense = 0;
  let balls = 0;
  let payment = 0;

  for (const row of rows.slice(1)) {
    if (!isValidRow(row)) continue;

    const [date, , lineId, rowType, , amount, ballQty, payAmount] = row;
    if (!date) continue;
    if (userId && lineId !== userId) continue;

    const match = type === "today" ? sameDay(date, now) : sameMonth(date, now);
    if (!match) continue;

    if (rowType === "收入") income += Number(amount || 0);
    if (rowType === "支出") expense += Number(amount || 0);
    if (rowType === "耗球") balls += Number(ballQty || 0);
    if (rowType === "交款") payment += Number(payAmount || 0);
  }

  return {
    income,
    expense,
    balls,
    payment,
    balance: income - expense,
    unpaid: income - payment,
  };
}

async function getAllUnpaid() {
  const rows = await getV5Rows();
  const map = new Map();

  for (const row of rows.slice(1)) {
    if (!isValidRow(row)) continue;

    const [, name, lineId, rowType, , amount, , payAmount] = row;
    if (!lineId) continue;

    if (!map.has(lineId)) {
      map.set(lineId, { name: name || lineId, income: 0, payment: 0 });
    }

    const item = map.get(lineId);

    if (rowType === "收入") item.income += Number(amount || 0);
    if (rowType === "交款") item.payment += Number(payAmount || 0);
  }

  return Array.from(map.values()).map(item => ({
    ...item,
    unpaid: item.income - item.payment,
  }));
}

module.exports = {
  appendV5Rows,
  getSummary,
  getAllUnpaid,
};