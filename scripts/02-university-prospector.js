#!/usr/bin/env node
/**
 * Workflow 02: University Prospector
 * Searches for university hospitality/culinary programs, extracts contact info, appends to Opportunities.
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '02 - University Prospector';
const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

async function searchUniversities() {
  if (!SERPAPI_KEY) {
    console.warn('SERPAPI_API_KEY not set; skipping search.');
    return [];
  }
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent('hospitality management program .edu guest speaker')}&api_key=${SERPAPI_KEY}&num=5`;
  const res = await fetch(url);
  const data = await res.json();
  const organics = (data.organic_results || []).filter((r) => r.link && r.link.includes('.edu'));
  return organics.map((r) => ({ title: r.title, link: r.link, snippet: r.snippet || '' }));
}

async function main() {
  console.log('Workflow 02: University Prospector');
  const sheet = await getSheet('Opportunities');
  await sheet.loadHeaderRow();

  // Sheet header: Conference_Name, Date, Location, URL, Status, Notes (exact match required)
  const results = await searchUniversities();
  for (let i = 0; i < Math.min(5, results.length); i++) {
    const r = results[i];
    const description = (r.snippet || '').slice(0, 500);
    const row = {
      Conference_Name: r.title || 'University Program',
      Date: '',
      Location: '',
      URL: r.link,
      Status: 'New',
      Notes: description ? `Source: University Prospector. ${description}` : 'Source: University Prospector.',
    };
    await sheet.addRow(row);
    console.log(`[02] Row saved: ${row.Conference_Name} | URL: ${row.URL}`);
  }

  console.log(`Added ${Math.min(5, results.length)} university opportunities.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
