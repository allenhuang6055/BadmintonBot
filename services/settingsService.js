require("dotenv").config();
const { google } = require("googleapis");

const SETTINGS_SHEET_NAME = "01_系統設定";

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

async function getSettingsRows() {
  const sheets = getSheets();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SETTINGS_SHEET_NAME}!A:C`,
  });

  return res.data.values || [];
}

async function getEnabledItems(type) {
  const rows = await getSettingsRows();

  return rows
    .slice(1)
    .filter(row => {
      const rowType = String(row[0] || "").trim();
      const item = String(row[1] || "").trim();
      const enabled = String(row[2] || "").trim().toUpperCase();

      return rowType === type && item && (enabled === "TRUE" || enabled === "是" || enabled === "啟用");
    })
    .map(row => String(row[1] || "").trim());
}

async function getIncomeItems() {
  return getEnabledItems("收入");
}

async function getExpenseItems() {
  return getEnabledItems("支出");
}

module.exports = {
  getIncomeItems,
  getExpenseItems,
};