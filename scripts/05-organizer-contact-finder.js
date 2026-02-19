#!/usr/bin/env node
/**
 * Workflow 05: Organizer Contact Finder
 * Reads Opportunities with empty organizer_email but with url; fetches page, extracts contact (optional AI), updates row + Contacts.
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '05 - Organizer Contact Finder';

async function main() {
  console.log('Workflow 05: Organizer Contact Finder');
  const oppSheet = await getSheet('Opportunities');
  await oppSheet.loadHeaderRow();
  const rows = await oppSheet.getRows();
  const contactsSheet = await getSheet('Contacts').catch(() => null);

  let updated = 0;
  for (const row of rows) {
    const email = row.get('organizer_email');
    const url = row.get('url');
    if (email || !url) continue;

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const foundEmail = emailMatch ? emailMatch[0] : '';
      const nameMatch = html.match(/contact[\s\S]{0,200}?([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
      const foundName = nameMatch ? nameMatch[1].trim() : '';

      if (foundEmail) {
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
      }
    } catch (e) {
      console.warn(`Skip ${url}: ${e.message}`);
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
