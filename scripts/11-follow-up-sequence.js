#!/usr/bin/env node
/**
 * Workflow 11: Follow-Up Sequence Engine
 * Gets Contacted opportunities past followUpDelayDays with follow_up_count < maxFollowUps; generates follow-up email; sends; updates row + Follow-Up Log.
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '11 - Follow-Up Sequence';
const BREVO_KEY = process.env.BREVO_API_KEY;
const FOLLOW_UP_DAYS = 7;
const MAX_FOLLOW_UPS = 3;
const MAX_PER_DAY = 10;

async function sendEmail(to, subject, body) {
  if (!BREVO_KEY) {
    console.warn('BREVO_API_KEY not set; simulating send.');
    return true;
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { email: process.env.SENDER_EMAIL || 'outreach@example.com', name: 'Seamlessly' },
      to: [{ email: to }],
      subject,
      htmlContent: body.replace(/\n/g, '<br>'),
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

async function main() {
  console.log('Workflow 11: Follow-Up Sequence');
  const oppSheet = await getSheet('Opportunities');
  await oppSheet.loadHeaderRow();
  const rows = await oppSheet.getRows({ limit: 10000 });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FOLLOW_UP_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const statusVal = (r) => (r.get('Status') ?? r.get('status') ?? '').toString();
  const contacted = rows.filter((r) => statusVal(r) === 'Contacted');
  const eligible = contacted.filter((r) => {
    const lastContact = r.get('contacted_date') || r.get('last_follow_up_date') || '';
    const count = parseInt(r.get('follow_up_count') || 0, 10);
    return lastContact <= cutoffStr && count < MAX_FOLLOW_UPS;
  });
  const toProcess = eligible.slice(0, MAX_PER_DAY);

  const followUpSheet = await getSheet('Follow-Up Log');
  const today = new Date().toISOString().slice(0, 10);
  let sent = 0;

  for (const row of toProcess) {
    const id = row.get('id');
    const eventName = row.get('event_name') || 'the event';
    const organizerName = row.get('organizer_name') || 'there';
    const to = row.get('organizer_email');
    const count = parseInt(row.get('follow_up_count') || 0, 10) + 1;

    const subject = `Following up: Speaking at ${eventName}`;
    const body = `Hi ${organizerName},\n\nI wanted to follow up on my previous email about speaking at ${eventName}. I'd love to find a time to discuss how we can add value for your audience.\n\nBest regards`;

    try {
      await sendEmail(to, subject, body);
      row.set('follow_up_count', count);
      row.set('last_follow_up_date', today);
      if (count >= MAX_FOLLOW_UPS) row.set('Status', 'No Response');
      await row.save();

      await followUpSheet.addRow({
        opportunity_id: id,
        follow_up_number: count,
        sent_date: today,
        email_subject: subject,
        email_body: body,
      });
      sent++;
    } catch (e) {
      await logError(WORKFLOW_NAME, `Follow-up to ${to}: ${e.message}`);
    }
  }

  console.log(`Sent ${sent} follow-up emails.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
