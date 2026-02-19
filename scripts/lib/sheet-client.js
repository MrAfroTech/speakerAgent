/**
 * Shared Google Sheets client for speaking workflow scripts.
 * Loads credentials from aiAgents/config and env SPREADSHEET_ID.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const { getGoogleSheetsCredentials } = require('../../../config/credentials-config');
const { GoogleSpreadsheet } = require('google-spreadsheet');

let doc = null;

async function getDoc() {
  if (doc) return doc;
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!spreadsheetId || spreadsheetId === 'PASTE_YOUR_SPREADSHEET_ID_HERE') {
    throw new Error('Set SPREADSHEET_ID in aiAgents/.env to your Google Sheet ID');
  }
  const credentials = getGoogleSheetsCredentials();
  doc = new GoogleSpreadsheet(spreadsheetId);
  await doc.useServiceAccountAuth(credentials);
  await doc.loadInfo();
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
