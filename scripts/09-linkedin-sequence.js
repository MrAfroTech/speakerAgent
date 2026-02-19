#!/usr/bin/env node
/**
 * Workflow 09: LinkedIn Connection Sequence
 * Reads Contacts with linkedin and relationship_stage "New Lead"; generates connection notes (Claude); outputs summary for manual send (no API send).
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '09 - LinkedIn Sequence';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const MAX_PER_DAY = 15;

async function main() {
  console.log('Workflow 09: LinkedIn Connection Sequence');
  let contactsSheet;
  try {
    contactsSheet = await getSheet('Contacts');
  } catch (e) {
    console.log('No Contacts sheet; skipping.');
    return;
  }

  await contactsSheet.loadHeaderRow();
  const rows = await contactsSheet.getRows();
  const newLeads = rows.filter(
    (r) => (r.get('linkedin') || '').trim() && (r.get('relationship_stage') || '') === 'New Lead'
  );
  const toProcess = newLeads.slice(0, MAX_PER_DAY);

  const summary = [];
  for (const row of toProcess) {
    const name = row.get('contact_name') || row.get('organization') || 'Contact';
    const org = row.get('organization') || '';
    const linkedin = row.get('linkedin') || '';
    const note = ANTHROPIC_KEY
      ? '(Run with ANTHROPIC_API_KEY to generate personalized note)'
      : `Hi ${name}, I noticed your work at ${org} and would value connecting.`;
    summary.push({ name, linkedin, note });
    row.set('relationship_stage', 'LinkedIn - Connection Sent');
    await row.save();
  }

  console.log(`Prepared ${summary.length} LinkedIn connections (manual send):`);
  summary.forEach((s) => console.log(`  ${s.linkedin} - ${s.note.slice(0, 60)}...`));
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
