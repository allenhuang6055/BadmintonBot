require("dotenv").config();
const { google } = require("googleapis");

const SHEET_NAME = "LINE記帳";

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

async function appendAccountRow(data) {
  const sheets = getSheets();

  const values = [[
    data.date,
    data.dropIn,
    data.ticket,
    data.member,
    data.balls,
    data.note,
    new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }),
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A:G`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

async function getRows() {
  const sheets = getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A:G`,
  });

  return res.data.values || [];
}

function sameDay(dateText, target) {
  const d = new Date(dateText);
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
}

function sameMonth(dateText, target) {
  const d = new Date(dateText);
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth()
  );
}

async function getSummary(type) {
  const rows = await getRows();
  const now = new Date();

  let dropIn = 0;
  let ticket = 0;
  let member = 0;
  let balls = 0;

  for (const row of rows.slice(1)) {
    const [date, d, t, m, b] = row;
    if (!date) continue;

    const match = type === "today"
      ? sameDay(date, now)
      : sameMonth(date, now);

    if (!match) continue;

    dropIn += Number(d || 0);
    ticket += Number(t || 0);
    member += Number(m || 0);
    balls += Number(b || 0);
  }

  return {
    dropIn,
    ticket,
    member,
    balls,
    total: dropIn + ticket + member,
  };
}

module.exports = { appendAccountRow, getSummary };