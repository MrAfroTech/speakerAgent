#!/usr/bin/env node
/**
 * Workflow 06: Event Quality Scorer
 * Scores any opportunity with no quality_score yet (independent of organizer_email).
 * Scores 0-25 (audience, type, fit, CFP); sets status (High Priority / Qualified / etc.).
 */
require('./lib/load-env');
const { getSheet, logError } = require('./lib/sheet-client');

const WORKFLOW_NAME = '06 - Event Quality Scorer';

function scoreOpportunity(row) {
  let score = 0;
  const audienceSize = parseInt(row.get('audience_size') || 0, 10);
  if (audienceSize >= 1000) score += 10;
  else if (audienceSize >= 500) score += 8;
  else if (audienceSize >= 200) score += 5;
  else if (audienceSize >= 50) score += 3;

  const eventType = (row.get('event_type') || '').toLowerCase();
  if (eventType === 'conference') score += 5;
  else if (eventType === 'association') score += 4;
  else if (eventType === 'university') score += 3;
  else if (eventType === 'podcast') score += 2;

  const audienceType = (row.get('audience_type') || '').toLowerCase();
  if (/executive|c-suite|ceo|founder/i.test(audienceType)) score += 5;
  else if (/venue|restaurant|hotel|tech/i.test(audienceType)) score += 3;

  const cfp = (row.get('cfp_deadline') || '').toLowerCase();
  if (cfp === 'rolling') score += 2;
  else if (cfp && cfp.length > 0) score += 1;

  const status =
    score >= 18 ? 'High Priority' : score >= 12 ? 'Qualified' : score >= 8 ? 'Low Priority' : 'Disqualify';
  return { score, status };
}

async function main() {
  console.log('Workflow 06: Event Quality Scorer');
  const sheet = await getSheet('Opportunities');
  await sheet.loadHeaderRow();
  const rows = await sheet.getRows({ limit: 10000 });

  let scored = 0;
  for (const row of rows) {
    const currentScore = row.get('quality_score');
    if (currentScore !== '' && currentScore !== undefined && currentScore !== null) continue;

    const { score, status } = scoreOpportunity(row);
    row.set('quality_score', score);
    row.set('Status', status);
    await row.save();
    scored++;
  }

  console.log(`Scored ${scored} opportunities.`);
}

main().catch(async (e) => {
  await logError(WORKFLOW_NAME, e.message);
  console.error(e);
  process.exit(1);
});
