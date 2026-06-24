require("dotenv").config();
const { google } = require("googleapis");

const SHEET_NAME = "LINE記帳";

async function appendAccountRow(data) {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_CREDENTIALS_PATH || "./credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

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

module.exports = { appendAccountRow };