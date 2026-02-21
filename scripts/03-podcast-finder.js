#!/usr/bin/env node
/**
 * Workflow 03: Podcast Finder
 * Searches for hospitality/restaurant podcasts accepting guests, appends to Opportunities.
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '03 - Podcast Finder';
const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

async function searchPodcasts() {
  if (!SERPAPI_KEY) {
    console.warn('SERPAPI_API_KEY not set; skipping search.');
    return [];
  }
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent('hospitality podcast accepting guests 2025')}&api_key=${SERPAPI_KEY}&num=5`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.organic_results || []).map((r) => ({ title: r.title, link: r.link || '', snippet: r.snippet || '' }));
}

async function main() {
  console.log('Workflow 03: Podcast Finder');
  const sheet = await getSheet('Opportunities');
  await sheet.loadHeaderRow();

  // Sheet header: Conference_Name, Date, Location, URL, Status, Notes (exact match required)
  const results = await searchPodcasts();
  for (let i = 0; i < Math.min(5, results.length); i++) {
    const r = results[i];
    const description = (r.snippet || '').slice(0, 500);
    const row = {
      Conference_Name: r.title || 'Podcast',
      Date: '',
      Location: 'Remote',
      URL: r.link,
      Status: 'New',
      Notes: description ? `Source: Podcast Finder. ${description}` : 'Source: Podcast Finder.',
    };
    await sheet.addRow(row);
    console.log(`[03] Row saved: ${row.Conference_Name} | URL: ${row.URL}`);
  }

  console.log(`Added ${Math.min(5, results.length)} podcast opportunities.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
