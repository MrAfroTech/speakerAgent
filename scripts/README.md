# Speaking Workflow Scripts (Node.js)

One script per automation workflow. Run from `aiAgents/workflows-speaking` after `npm install`.

## Prerequisites

1. **Google Sheet** created from `aiAgents/speaking-sheets-import/` (import CSVs per `import-instructions.md`).
2. **Credentials**: `aiAgents/credentials/google-sheets-service-account.json` (see `aiAgents/config/test-credentials.js`).
3. **Env**: In `aiAgents/.env` set:
   - `SPREADSHEET_ID` – your Google Sheet ID (from the sheet URL: `/d/SPREADSHEET_ID/edit`).
   - Optional: `SERPAPI_API_KEY`, `ANTHROPIC_API_KEY`, `BREVO_API_KEY`, `SENDER_EMAIL`, `MAX_DAILY_EMAILS=10`.

## Run a workflow

```bash
cd aiAgents/workflows-speaking
npm install
npm run 01   # Conference Hunter
npm run 02   # University Prospector
npm run 03   # Podcast Finder
npm run 04   # Association Scanner
npm run 05   # Organizer Contact Finder
npm run 06   # Event Quality Scorer
npm run 07   # Pitch Writer
npm run 08   # Email Outreach
npm run 09   # LinkedIn Sequence
npm run 10   # Post-Speaking Leverage
npm run 11   # Follow-Up Sequence
npm run 12   # Response Parser
```

Or directly:

```bash
node scripts/01-conference-hunter.js
node scripts/12-response-parser.js 2 "interested" "They said yes!"
```

## Script summary

| # | Script | Purpose |
|---|--------|--------|
| 01 | conference-hunter | SerpAPI search → append conference opportunities |
| 02 | university-prospector | SerpAPI .edu search → append university opportunities |
| 03 | podcast-finder | SerpAPI podcast search → append podcast opportunities |
| 04 | association-scanner | Fetch NRA/AHLA/HFTP events pages → append association rows |
| 05 | organizer-contact-finder | Find rows with url, no email → scrape contact → update + Contacts |
| 06 | event-quality-scorer | Score 0–25, set status (High Priority / Qualified / etc.) |
| 07 | pitch-writer | Claude generates pitch_subject/body/topic for qualified rows |
| 08 | email-outreach | Send “Ready to Send” pitches via Brevo → Contacted |
| 09 | linkedin-sequence | Mark New Lead contacts for LinkedIn; output notes (manual send) |
| 10 | post-speaking-leverage | Append to Speaking Assets; optional EVENT_NAME, EVENT_DATE, ORGANIZER_* env |
| 11 | follow-up-sequence | Send follow-ups to Contacted (7-day delay, max 3) → Follow-Up Log |
| 12 | response-parser | Update status from reply: `node scripts/12-response-parser.js <id> <classification> [snippet]` |

## Sheet names

Scripts expect these sheet tabs: **Opportunities**, **Follow-Up Log**, **Response Log**, **Error Log**. Optional: **Contacts**, **Speaking Assets** (07, 09, 10 use them).

## Errors

Failures are appended to the **Error Log** sheet when possible. Ensure that tab exists and has headers: `workflow`, `error`, `timestamp`.
