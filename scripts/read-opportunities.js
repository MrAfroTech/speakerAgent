#!/usr/bin/env node
/**
 * One-off: Read Opportunities sheet and dump headers + all rows (all columns).
 * Run: node scripts/read-opportunities.js
 * Uses same SPREADSHEET_ID and credentials as discovery pipeline.
 */
require('./lib/load-env');
const { getDoc, getSheet } = require('./lib/sheet-client');

async function main() {
  const doc = await getDoc();
  const tabList = Object.keys(doc.sheetsByTitle).join(', ');
  console.log('--- SPREADSHEET_ID (from env) ---');
  console.log(process.env.SPREADSHEET_ID || '(not set)');
  console.log('\n--- WORKBOOK TABS ---');
  console.log(`Sheets: ${tabList}`);

  const sheet = await getSheet('Opportunities');
  await sheet.loadHeaderRow();
  const headers = sheet.headerValues || [];
  const rows = await sheet.getRows({ limit: 10000 });

  console.log('\n--- SHEET: Opportunities ---');
  console.log('Exact header row (column names):', JSON.stringify(headers));
  console.log('Total data rows:', rows.length);
  console.log('\n--- ALL ROWS (every column as in sheet) ---');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};
    for (const h of headers) {
      const val = row.get(h);
      obj[h] = val === undefined ? '(no column)' : (val === '' ? '(empty)' : String(val).slice(0, 80) + (String(val).length > 80 ? '...' : ''));
    }
    console.log(`Row ${i + 1}:`, JSON.stringify(obj, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
