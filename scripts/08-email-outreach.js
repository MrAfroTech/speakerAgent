#!/usr/bin/env node
/**
 * Workflow 08: Email Outreach (Speaking)
 * Reads opportunities with status "Ready to Send", rate limit (e.g. 10/day), sends via Brevo, updates status to Contacted + contacted_date.
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '08 - Email Outreach';
const BREVO_KEY = process.env.BREVO_API_KEY;
const MAX_DAILY = parseInt(process.env.MAX_DAILY_EMAILS || '10', 10);

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
  console.log('Workflow 08: Email Outreach');
  const sheet = await getSheet('Opportunities');
  await sheet.loadHeaderRow();
  const rows = await sheet.getRows({ limit: 10000 });

  const statusKey = (r) => (r.get('Status') ?? r.get('status') ?? '').toString();
  const ready = rows.filter(
    (r) => /Ready to Send/.test(statusKey(r)) && r.get('pitch_subject') && r.get('organizer_email')
  );
  const toSend = ready.slice(0, MAX_DAILY);
  const today = new Date().toISOString().slice(0, 10);

  let sent = 0;
  for (const row of toSend) {
    const to = row.get('organizer_email');
    const subject = row.get('pitch_subject');
    const body = row.get('pitch_body') || '';
    if (!to || !subject) continue;

    try {
      await sendEmail(to, subject, body);
      row.set('Status', 'Contacted');
      row.set('contacted_date', today);
      await row.save();
      sent++;
    } catch (e) {
      row.set('Status', 'Send Failed');
      await row.save();
      await logError(WORKFLOW_NAME, `Send to ${to}: ${e.message}`);
    }
  }

  console.log(`Sent ${sent} outreach emails.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
