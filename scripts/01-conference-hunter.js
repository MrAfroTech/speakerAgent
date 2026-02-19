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
    console.warn('SERPAPI_API_KEY not set; skipping search. Set in aiAgents/.env');
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
  const headers = sheet.headerValues;
  const startCount = sheet.rowCount || 0;
  const conferences = await searchConferences();
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < Math.min(5, conferences.length); i++) {
    const c = conferences[i];
    await sheet.addRow({
      id: startCount + i + 1,
      event_name: c.title,
      event_type: 'Conference',
      event_date: '',
      location: '',
      url: c.link,
      description: (c.snippet || '').slice(0, 500),
      organizer_name: '',
      organizer_email: '',
      organizer_linkedin: '',
      organizer_title: '',
      audience_size: '',
      audience_type: '',
      status: 'New',
      quality_score: '',
      source: 'Conference Hunter',
      discovered_date: today,
      contacted_date: '',
      notes: '',
      cfp_deadline: '',
      submission_requirements: '',
      pitch_subject: '',
      pitch_body: '',
      recommended_topic: '',
      follow_up_count: 0,
      last_follow_up_date: '',
      responded_date: '',
    });
  }

  console.log(`Added ${Math.min(5, conferences.length)} conference opportunities.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
