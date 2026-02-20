#!/usr/bin/env node
/**
 * Workflow 05: Organizer Contact Finder
 * Reads Opportunities with empty organizer_email but with url; fetches page, extracts contact (optional AI), updates row + Contacts.
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '05 - Organizer Contact Finder';

/** Resolve the URL column name from the sheet header (handles "url", "URL", "Event URL", "link", etc.). */
function getUrlHeader(headerValues) {
  const normalized = (h) => String(h || '').trim().toLowerCase();
  const urlCandidates = ['url', 'event url', 'link', 'website', 'event link'];
  for (const h of headerValues) {
    const n = normalized(h);
    if (urlCandidates.includes(n) || n === 'url') return h;
  }
  return 'url';
}

async function main() {
  console.log('Workflow 05: Organizer Contact Finder');
  const oppSheet = await getSheet('Opportunities');
  await oppSheet.loadHeaderRow();
  const headerValues = oppSheet.headerValues || [];
  const urlHeader = getUrlHeader(headerValues);
  console.log(`[05] Opportunities header row: ${JSON.stringify(headerValues)}`);
  console.log(`[05] Using column "${urlHeader}" for URL.`);

  const rows = await oppSheet.getRows();
  const contactsSheet = await getSheet('Contacts').catch(() => null);

  const eligible = rows.filter((row) => {
    const email = row.get('organizer_email');
    const url = row.get(urlHeader);
    return !email && url;
  });
  console.log(`[05] Rows with URL and no organizer_email: ${eligible.length} (of ${rows.length} total).`);

  let updated = 0;
  for (const row of rows) {
    const email = row.get('organizer_email');
    const url = row.get(urlHeader);
    if (email) {
      console.log(`[05] Skip row: already has organizer_email.`);
      continue;
    }
    if (!url) {
      console.log(`[05] Skip row: no URL (column "${urlHeader}" empty or missing).`);
      continue;
    }

    console.log(`[05] Fetching: ${url}`);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const statusOk = res.ok;
      const statusCode = res.status;
      console.log(`[05] Fetch ${statusOk ? 'succeeded' : 'failed'}: ${statusCode} ${res.statusText || ''}`);

      const html = await res.text();
      const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const foundEmail = emailMatch ? emailMatch[0] : '';
      const nameMatch = html.match(/contact[\s\S]{0,200}?([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
      const foundName = nameMatch ? nameMatch[1].trim() : '';

      if (foundEmail) {
        console.log(`[05] Regex email match: yes (${foundEmail})`);
        row.set('organizer_email', foundEmail);
        if (foundName) row.set('organizer_name', foundName);
        await row.save();
        updated++;

        if (contactsSheet) {
          await contactsSheet.addRow({
            contact_name: foundName || '',
            title: row.get('organizer_title') || '',
            organization: row.get('event_name') || '',
            email: foundEmail,
            linkedin: row.get('organizer_linkedin') || '',
            phone: '',
            event_related: row.get('event_name') || '',
            relationship_stage: 'New Lead',
            last_contact: '',
            notes: '',
          });
        }
      } else {
        console.log(`[05] Regex email match: no.`);
      }
    } catch (e) {
      console.warn(`[05] Skip ${url}: ${e.message}`);
    }
    if (updated >= 10) break;
  }

  console.log(`Updated ${updated} opportunities with contact info.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
