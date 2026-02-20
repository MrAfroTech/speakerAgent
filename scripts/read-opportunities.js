#!/usr/bin/env node
/**
 * One-off: Read Opportunities sheet and dump headers + rows for debugging.
 * Run: node scripts/read-opportunities.js
 * Uses same SPREADSHEET_ID and credentials as discovery pipeline.
 */
require('./lib/load-env');
const { getSheet } = require('./lib/sheet-client');

async function main() {
  const sheet = await getSheet('Opportunities');
  await sheet.loadHeaderRow();
  const headers = sheet.headerValues;
  const rows = await sheet.getRows();

  console.log('--- SPREADSHEET_ID (from env) ---');
  console.log(process.env.SPREADSHEET_ID || '(not set)');
  console.log('\n--- SHEET: Opportunities ---');
  console.log('Exact header row (column names):', JSON.stringify(headers));
  const urlCol = headers.findIndex((h) => /^url$|^event url$|^link$/i.test(String(h || '').trim()));
  console.log('URL column: ' + (urlCol >= 0 ? `index ${urlCol}, name "${headers[urlCol]}"` : 'not found (script 05 will try "url")'));
  console.log('Total rows (data):', rows.length);
  console.log('\n--- LAST 20 ROWS (id, event_name, source, url, organizer_email, quality_score) ---');

  const toShow = rows.slice(-20);
  for (const row of toShow) {
    const id = row.get('id');
    const event_name = row.get('event_name');
    const source = row.get('source');
    const url = row.get('url');
    const organizer_email = row.get('organizer_email');
    const quality_score = row.get('quality_score');
    const urlStatus = url === undefined ? '(column missing?)' : (url ? url.slice(0, 50) + (url.length > 50 ? '...' : '') : '(empty)');
    const emailStatus = organizer_email === undefined ? '(column missing?)' : (organizer_email || '(empty)');
    console.log({ id, event_name, source, url: urlStatus, organizer_email: emailStatus, quality_score });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
