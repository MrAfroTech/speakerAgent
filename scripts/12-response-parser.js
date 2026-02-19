#!/usr/bin/env node
/**
 * Workflow 12: Response Parser & Status Updater
 * Would poll Gmail for replies and match to organizer_email; classify intent (interested/declined/etc.); update status + Response Log.
 * This script provides the sheet-update and classification logic; Gmail fetch must be done via OAuth (manual or separate integration).
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '12 - Response Parser';

async function main() {
  console.log('Workflow 12: Response Parser');
  console.log('To run full flow: fetch unread emails (Gmail API/OAuth), then pass replies here or use this script to process a single reply.');

  const opportunityId = process.env.OPPORTUNITY_ID || process.argv[2];
  const classification = (process.env.CLASSIFICATION || process.argv[3] || 'interested').toLowerCase();
  const emailSnippet = process.env.EMAIL_SNIPPET || process.argv[4] || '';

  if (!opportunityId) {
    console.log('Usage: OPPORTUNITY_ID=1 CLASSIFICATION=interested EMAIL_SNIPPET="..." node 12-response-parser.js');
    console.log('Or: node 12-response-parser.js <opportunityId> <classification> [snippet]');
    console.log('Classifications: interested, not_interested, needs_info, out_of_office, unrelated');
    return;
  }

  const statusMap = {
    interested: 'Interested',
    not_interested: 'Declined',
    needs_info: 'Contacted',
    out_of_office: 'Contacted',
    unrelated: 'Contacted',
  };
  const newStatus = statusMap[classification] || 'Contacted';

  const oppSheet = await getSheet('Opportunities');
  await oppSheet.loadHeaderRow();
  const rows = await oppSheet.getRows();
  const row = rows.find((r) => String(r.get('id')) === String(opportunityId));
  if (!row) {
    console.error('Opportunity not found:', opportunityId);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  row.set('status', newStatus);
  row.set('responded_date', today);
  if (emailSnippet) row.set('notes', (row.get('notes') || '') + '\nResponse: ' + emailSnippet.slice(0, 500));
  await row.save();

  const responseSheet = await getSheet('Response Log');
  await responseSheet.addRow({
    opportunity_id: opportunityId,
    response_date: today,
    classification,
    email_snippet: emailSnippet.slice(0, 1000),
  });

  console.log(`Updated opportunity ${opportunityId} to status "${newStatus}" and logged response.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
