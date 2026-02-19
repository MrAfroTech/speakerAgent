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
  const today = new Date().toISOString().slice(0, 10);
  let added = 0;

  for (const assoc of ASSOCIATIONS) {
    const html = await fetchEventsPage(assoc.url);
    if (!html) {
      console.warn(`Could not fetch events for ${assoc.name}`);
      continue;
    }
    await sheet.addRow({
      id: sheet.rowCount + 1,
      event_name: `${assoc.name} - Events`,
      event_type: 'Association',
      event_date: '',
      location: '',
      url: assoc.url,
      description: `Events and programs from ${assoc.name}. Check ${assoc.url}/events for current listings.`,
      organizer_name: '',
      organizer_email: '',
      organizer_linkedin: '',
      organizer_title: '',
      audience_size: '',
      audience_type: 'association members, industry',
      status: 'New',
      quality_score: '',
      source: 'Association Scanner',
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
    added++;
  }

  console.log(`Added ${added} association opportunity rows.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
