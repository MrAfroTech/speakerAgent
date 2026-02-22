#!/usr/bin/env node
/**
 * Workflow 07: Seamlessly Pitch Writer
 * Reads qualified opportunities (High Priority / Qualified) with no contacted_date; uses Claude to generate pitch; updates pitch_subject, pitch_body, recommended_topic.
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '07 - Pitch Writer';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

async function generatePitch(eventName, eventType, organizerName, audienceType) {
  if (!ANTHROPIC_KEY) {
    return {
      subject: `Speaking opportunity: ${eventName}`,
      body: `Hi ${organizerName || 'there'},\n\nI'd love to explore speaking at ${eventName}. Our team has delivered keynotes on hospitality technology and guest experience at similar events.\n\nWould you be open to a short call?\n\nBest regards`,
      topic: 'Hospitality Technology & Guest Experience',
    };
  }

  const { Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: ANTHROPIC_KEY });
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Write a short speaker pitch email (2-3 paragraphs, under 200 words). Event: ${eventName} (${eventType}). Organizer: ${organizerName}. Audience: ${audienceType}. Sign off as Seamlessly founder. Return ONLY valid JSON: {"subject":"...","body":"...","topic":"..."}`,
      },
    ],
  });
  const text = msg.content[0]?.text || '{}';
  const json = JSON.parse(text.replace(/```json?\s*|\s*```/g, '').trim());
  return { subject: json.subject, body: json.body, topic: json.topic };
}

async function main() {
  console.log('Workflow 07: Pitch Writer');
  const sheet = await getSheet('Opportunities');
  await sheet.loadHeaderRow();
  const rows = await sheet.getRows({ limit: 10000 });

  let written = 0;
  for (const row of rows) {
    const status = (row.get('Status') ?? row.get('status') ?? '').toString();
    const contacted = row.get('contacted_date');
    const pitchSubject = row.get('pitch_subject');
    if (!/High Priority|Qualified/.test(status) || contacted || pitchSubject) continue;

    const eventName = row.get('event_name') || row.get('Conference_Name') || 'Event';
    const eventType = row.get('event_type') || '';
    const organizerName = row.get('organizer_name') || '';
    const audienceType = row.get('audience_type') || '';

    const { subject, body, topic } = await generatePitch(eventName, eventType, organizerName, audienceType);
    row.set('pitch_subject', subject);
    row.set('pitch_body', body);
    row.set('recommended_topic', topic);
    row.set('Status', 'Ready to Send');
    await row.save();
    written++;
    if (written >= 5) break;
  }

  console.log(`Wrote pitches for ${written} opportunities.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
