#!/usr/bin/env node
/**
 * Workflow 01: Conference Hunter
 * Searches for hospitality conference CFPs (SerpAPI), enriches with event details, appends to Opportunities.
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '01 - Conference Hunter';
const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
const QUERIES = [
  'hospitality conference 2026 call for speakers',
  'food and beverage summit CFP',
  'restaurant innovation conference speakers',
];

async function searchConferences() {
  if (!SERPAPI_KEY) {
    console.warn('SERPAPI_API_KEY not set; skipping search. Set in .env');
    return [];
  }
  const results = [];
  for (const q of QUERIES.slice(0, 1)) {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&api_key=${SERPAPI_KEY}&num=5`;
    const res = await fetch(url);
    const data = await res.json();
    const organics = data.organic_results || [];
    organics.forEach((r) => {
      if (r.title && r.link && /conference|summit|cfp|speakers/i.test(r.title + (r.snippet || ''))) {
        results.push({ title: r.title, link: r.link, snippet: r.snippet || '' });
      }
    });
  }
  return results;
}

async function main() {
  console.log('Workflow 01: Conference Hunter');
  const sheet = await getSheet('Opportunities');
  await sheet.loadHeaderRow();
  const conferences = await searchConferences();

  // Sheet header: Conference_Name, Date, Location, URL, Status, Notes (exact match required)
  for (let i = 0; i < Math.min(5, conferences.length); i++) {
    const c = conferences[i];
    const description = (c.snippet || '').slice(0, 500);
    await sheet.addRow({
      Conference_Name: c.title,
      Date: '',
      Location: '',
      URL: c.link,
      Status: 'New',
      Notes: description ? `Source: Conference Hunter. ${description}` : 'Source: Conference Hunter.',
    });
  }

  console.log(`Added ${Math.min(5, conferences.length)} conference opportunities.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
