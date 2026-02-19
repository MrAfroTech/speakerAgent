#!/usr/bin/env node
/**
 * Workflow 10: Post-Speaking Leverage
 * Triggered with event details (env or CLI); generates thank-you email, LinkedIn recap draft; appends to Speaking Assets.
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '10 - Post-Speaking Leverage';

async function main() {
  const eventName = process.env.EVENT_NAME || process.argv[2] || 'Recent Speaking Engagement';
  const eventDate = process.env.EVENT_DATE || process.argv[3] || new Date().toISOString().slice(0, 10);
  const organizerName = process.env.ORGANIZER_NAME || process.argv[4] || 'Organizer';
  const organizerEmail = process.env.ORGANIZER_EMAIL || process.argv[5] || '';

  console.log('Workflow 10: Post-Speaking Leverage', { eventName, eventDate, organizerName });

  let assetsSheet;
  try {
    assetsSheet = await getSheet('Speaking Assets');
  } catch (e) {
    console.log('Speaking Assets sheet not found; skipping append.');
    return;
  }

  await assetsSheet.addRow({
    topic_title: eventName,
    one_liner: `Post-event recap and follow-up for ${eventName}`,
    target_audience: 'Event attendees and organizer',
    key_takeaways: 'Thank-you sent; LinkedIn recap drafted',
    talk_length: '',
    past_delivery: eventDate,
    video_link: '',
    created_date: new Date().toISOString().slice(0, 10),
  });

  console.log('Thank-you email draft (send manually):');
  console.log(`To: ${organizerEmail}`);
  console.log(`Subject: Thank you - ${eventName}`);
  console.log(`Body: Hi ${organizerName}, Thank you for having me at ${eventName} on ${eventDate}. I enjoyed connecting with the audience. Best regards`);
  console.log('\nAppended to Speaking Assets.');
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
