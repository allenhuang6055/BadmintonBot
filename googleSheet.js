require("dotenv").config();
const { google } = require("googleapis");

const SHEET_NAME = "LINE記帳";

function getGoogleAuth() {
  let authOptions = {
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  };

  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    authOptions.credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  } else {
    authOptions.keyFile = process.env.GOOGLE_CREDENTIALS_PATH || "./credentials.json";
  }

  return new google.auth.GoogleAuth(authOptions);
}

async function appendAccountRow(data) {
  const auth = getGoogleAuth();
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