/**
 * Shared Google Sheets client for speaking workflow scripts.
 * Loads credentials from config/ (repo root) and env SPREADSHEET_ID.
 */
const path = require('path');

// .env at repo root (works when cwd is repo root in CI or when run from app dir locally)
const envPath = path.resolve(process.cwd(), '.env');
require('dotenv').config({ path: envPath });

const configPath = path.resolve(process.cwd(), 'config', 'credentials-config');
const { getGoogleSheetsCredentials } = require(configPath);
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

let doc = null;

async function getDoc() {
  if (doc) return doc;
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!spreadsheetId || spreadsheetId === 'PASTE_YOUR_SPREADSHEET_ID_HERE') {
    throw new Error('Set SPREADSHEET_ID in .env to your Google Sheet ID');
  }
  const creds = getGoogleSheetsCredentials();
  const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const newDoc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth);
  await newDoc.loadInfo();
  doc = newDoc;
  return doc;
}

async function getSheet(title) {
  const d = await getDoc();
  const sheet = d.sheetsByTitle[title];
  if (!sheet) throw new Error(`Sheet "${title}" not found. Create it in your spreadsheet.`);
  return sheet;
}

/** Opportunity row as object (headers from row 1) */
function rowToOpportunity(headers, values) {
  const row = {};
  headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
  return row;
}

/** Append one row to Error Log sheet */
async function logError(workflowName, errorMessage) {
  try {
    const sheet = await getSheet('Error Log');
    await sheet.addRow({
      workflow: workflowName,
      error: String(errorMessage).slice(0, 500),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    });
  } catch (e) {
    console.error('Failed to write to Error Log:', e.message);
  }
}

module.exports = { getDoc, getSheet, rowToOpportunity, logError };
