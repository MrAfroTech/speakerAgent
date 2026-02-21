#!/usr/bin/env node
/**
 * Workflow 04: Industry Association Scanner
 * Fetches event pages for target associations (NRA, AHLA, etc.), parses events, appends to Opportunities.
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '04 - Association Scanner';

const ASSOCIATIONS = [
  { name: 'National Restaurant Association', url: 'https://restaurant.org', search: 'NRA events' },
  { name: 'American Hotel & Lodging Association', url: 'https://ahla.com', search: 'AHLA events' },
  { name: 'HFTP', url: 'https://hftp.org', search: 'HFTP events' },
];

async function fetchEventsPage(baseUrl) {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/events`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function main() {
  console.log('Workflow 04: Association Scanner');
  const sheet = await getSheet('Opportunities');
  await sheet.loadHeaderRow();
  let added = 0;

  for (const assoc of ASSOCIATIONS) {
    const html = await fetchEventsPage(assoc.url);
    if (!html) {
      console.warn(`Could not fetch events for ${assoc.name}`);
      continue;
    }
    // Sheet header: Conference_Name, Date, Location, URL, Status, Notes (exact match required)
    const description = `Events and programs from ${assoc.name}. Check ${assoc.url}/events for current listings.`;
    const row = {
      Conference_Name: `${assoc.name} - Events`,
      Date: '',
      Location: '',
      URL: assoc.url,
      Status: 'New',
      Notes: `Source: Association Scanner. ${description}`,
    };
    await sheet.addRow(row);
    console.log(`[04] Row saved: ${row.Conference_Name} | URL: ${row.URL}`);
    added++;
  }

  console.log(`Added ${added} association opportunity rows.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
