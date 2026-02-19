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
  const today = new Date().toISOString().slice(0, 10);
  const startCount = sheet.rowCount;

  const results = await searchUniversities();
  for (let i = 0; i < Math.min(5, results.length); i++) {
    const r = results[i];
    await sheet.addRow({
      id: startCount + i + 1,
      event_name: r.title || 'University Program',
      event_type: 'University',
      event_date: '',
      location: '',
      url: r.link,
      description: (r.snippet || '').slice(0, 500),
      organizer_name: '',
      organizer_email: '',
      organizer_linkedin: '',
      organizer_title: '',
      audience_size: 50,
      audience_type: 'students, faculty',
      status: 'New',
      quality_score: '',
      source: 'University Prospector',
      discovered_date: today,
      contacted_date: '',
      notes: '',
      cfp_deadline: 'Rolling',
      submission_requirements: 'Email with topic proposal and bio',
      pitch_subject: '',
      pitch_body: '',
      recommended_topic: '',
      follow_up_count: 0,
      last_follow_up_date: '',
      responded_date: '',
    });
  }

  console.log(`Added ${Math.min(5, results.length)} university opportunities.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
