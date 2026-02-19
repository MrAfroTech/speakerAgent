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
  const today = new Date().toISOString().slice(0, 10);
  const startCount = sheet.rowCount;

  const results = await searchPodcasts();
  for (let i = 0; i < Math.min(5, results.length); i++) {
    const r = results[i];
    await sheet.addRow({
      id: startCount + i + 1,
      event_name: r.title || 'Podcast',
      event_type: 'Podcast',
      event_date: '',
      location: 'Remote',
      url: r.link,
      description: (r.snippet || '').slice(0, 500),
      organizer_name: '',
      organizer_email: '',
      organizer_linkedin: '',
      organizer_title: 'Host',
      audience_size: '',
      audience_type: 'podcast audience',
      status: 'New',
      quality_score: '',
      source: 'Podcast Finder',
      discovered_date: today,
      contacted_date: '',
      notes: '',
      cfp_deadline: 'Rolling',
      submission_requirements: 'Email introduction with topics',
      pitch_subject: '',
      pitch_body: '',
      recommended_topic: '',
      follow_up_count: 0,
      last_follow_up_date: '',
      responded_date: '',
    });
  }

  console.log(`Added ${Math.min(5, results.length)} podcast opportunities.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
