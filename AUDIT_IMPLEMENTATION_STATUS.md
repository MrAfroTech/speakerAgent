# Speaking Automation — Implementation Audit (All 14 Questions)

This document answers the audit questions for the aiAgents/workflows-speaking codebase.

---

## QUESTION 1: PROJECT STRUCTURE

**Complete file structure of `aiAgents/workflows-speaking`:**

```
workflows-speaking/
├── README.md
├── package.json
├── shared_config_speaking.json
├── IMPLEMENTATION_SUMMARY.md
├── METRICS_SHEET_SETUP.md
├── PROJECT_EXPLANATION.md
├── scripts/
│   ├── README.md
│   ├── 01-conference-hunter.js
│   ├── 02-university-prospector.js
│   ├── 03-podcast-finder.js
│   ├── 04-association-scanner.js
│   ├── 05-organizer-contact-finder.js
│   ├── 06-event-quality-scorer.js
│   ├── 07-pitch-writer.js
│   ├── 08-email-outreach.js
│   ├── 09-linkedin-sequence.js
│   ├── 10-post-speaking-leverage.js
│   ├── 11-follow-up-sequence.js
│   ├── 12-response-parser.js
│   └── lib/
│       ├── load-env.js
│       └── sheet-client.js
├── 01_conference_hunter.json          (n8n)
├── 02_university_prospector.json
├── 03_podcast_finder.json
├── 04_industry_association_scanner.json
├── 05_organizer_contact_finder.json
├── 06_event_quality_scorer.json
├── 07_seamlessly_pitch_writer.json
├── 08_email_outreach_speaking.json
├── 09_linkedin_connection_sequence.json
├── 10_post_speaking_leverage.json
├── 11_follow_up_sequence.json
└── 12_response_parser.json
```

**Parent `aiAgents/` also has:** `credentials/`, `config/`, `speaking-sheets-import/`, `.env`, `.gitignore`, plus other agent folders (e.g. florida-sunbiz-scraper, workflows-speaking).

---

## QUESTION 2: AUTOMATION SCRIPTS INVENTORY

| Script | What it does | APIs used | Trigger | Writes to Google Sheets |
|--------|----------------|-----------|---------|--------------------------|
| **01-conference-hunter.js** | SerpAPI search for conference CFPs → append rows | SerpAPI, Google Sheets | Manual (`npm run 01`) | Opportunities (append) |
| **02-university-prospector.js** | SerpAPI .edu search → append university opportunities | SerpAPI, Google Sheets | Manual | Opportunities (append) |
| **03-podcast-finder.js** | SerpAPI podcast search → append podcast opportunities | SerpAPI, Google Sheets | Manual | Opportunities (append) |
| **04-association-scanner.js** | Fetch NRA/AHLA/HFTP events pages → append association rows | Google Sheets, fetch (no SerpAPI) | Manual | Opportunities (append) |
| **05-organizer-contact-finder.js** | Find rows with url, no email → scrape page for email/name → update row + Contacts | Google Sheets, fetch | Manual | Opportunities (update), Contacts (append) |
| **06-event-quality-scorer.js** | Score opportunities 0–25, set status (High Priority / Qualified / etc.) | Google Sheets | Manual | Opportunities (update) |
| **07-pitch-writer.js** | Claude generates pitch_subject, pitch_body, recommended_topic for qualified rows | Anthropic (Claude), Google Sheets | Manual | Opportunities (columns V, W, X) |
| **08-email-outreach.js** | Send “Ready to Send” pitches via Brevo; rate limit 10/day | Brevo, Google Sheets | Manual | Opportunities (status, contacted_date) |
| **09-linkedin-sequence.js** | Mark New Lead contacts for LinkedIn; output notes (no API send) | Google Sheets | Manual | Contacts (relationship_stage) |
| **10-post-speaking-leverage.js** | Append to Speaking Assets; optional env for event details | Google Sheets | Manual (env/CLI args) | Speaking Assets (append) |
| **11-follow-up-sequence.js** | Send follow-ups to Contacted (7-day delay, max 3) via Brevo | Brevo, Google Sheets | Manual | Opportunities (follow_up_count, last_follow_up_date, status), Follow-Up Log (append) |
| **12-response-parser.js** | Update status from reply when given opportunityId + classification (no Gmail read) | Google Sheets | Manual (CLI: id, classification, snippet) | Opportunities (status, responded_date, notes), Response Log (append) |

**Naming note:** Scripts are named `05-organizer-contact-finder.js` and `06-event-quality-scorer.js` (not `05-contact-finder.js` / `06-quality-scorer.js`). All 12 exist.

---

## QUESTION 3: CREDENTIALS MANAGEMENT

1. **Does a credentials folder exist?**  
   **Yes.** At `aiAgents/credentials/` (parent of workflows-speaking).

2. **What files are in the credentials folder?**  
   - `credentials/.gitignore`  
   - `credentials/README.md`  
   - `credentials/credentials-template.json`  
   - `credentials/google-sheets-service-account.json` (git-ignored)

3. **Does credentials-config.js exist in the config folder?**  
   **Yes.** At `aiAgents/config/credentials-config.js`.

4. **Structure of credentials-config.js (no keys):**  
   - `getGoogleSheetsCredentials()` — reads and validates `credentials/google-sheets-service-account.json` (required fields: type, project_id, private_key, client_email).  
   - `getServiceAccountEmail()` — returns `client_email` from that JSON.  
   - `validateCredentials()` — calls getGoogleSheetsCredentials and logs success/failure.  
   - `getAnthropicApiKey()`, `getBrevoApiKey()`, `getSerpApiKey()` — read from `credentials/*.txt` files (optional; scripts currently use **env** instead).

5. **Is there a .env file or .env.example?**  
   - **.env** exists at `aiAgents/.env` (git-ignored).  
   - No `.env.example` in workflows-speaking; scripts/README documents required vars.

6. **Expected environment variables:**  
   - **SPREADSHEET_ID** — Google Sheet ID (required for all scripts; loaded by sheet-client from `aiAgents/.env`).  
   - **ANTHROPIC_API_KEY** — Claude (07, optional fallback in 07).  
   - **SERPAPI_API_KEY** — search (01, 02, 03).  
   - **BREVO_API_KEY** — email (08, 11).  
   - **SENDER_EMAIL** — optional; used as sender in 08 and 11 (default `outreach@example.com`).  
   - **MAX_DAILY_EMAILS** — optional; default 10 (08).

   All loaded via `scripts/lib/load-env.js` from `aiAgents/.env`.

---

## QUESTION 4: GOOGLE SHEETS INTEGRATION

- **Credentials:** All scripts that touch Sheets use `scripts/lib/sheet-client.js`, which calls `getGoogleSheetsCredentials()` from `aiAgents/config/credentials-config.js`. So **yes**, they use credentials-config for Google Sheets.
- **Errors:** Scripts use `logError(WORKFLOW_NAME, e.message)` on failure, which writes to the Error Log sheet when possible; top-level catch also logs and exits.

| Script | Reads from | Columns read | Writes to | Columns written |
|--------|------------|--------------|-----------|------------------|
| 01 | — | — | Opportunities | A–AA (full row append) |
| 02 | — | — | Opportunities | A–AA (full row append) |
| 03 | — | — | Opportunities | A–AA (full row append) |
| 04 | — | — | Opportunities | A–AA (full row append) |
| 05 | Opportunities | url, organizer_email, organizer_name, event_name, organizer_title, organizer_linkedin | Opportunities, Contacts | organizer_email, organizer_name; Contacts: contact_name, title, organization, email, linkedin, event_related, relationship_stage, etc. |
| 06 | Opportunities | quality_score, organizer_email, (audience_size, event_type, audience_type, cfp_deadline for scoring) | Opportunities | quality_score, status |
| 07 | Opportunities | status, contacted_date, pitch_subject, event_name, event_type, organizer_name, audience_type | Opportunities | pitch_subject (V), pitch_body (W), recommended_topic (X) |
| 08 | Opportunities | status, pitch_subject, pitch_body, organizer_email | Opportunities | status (N), contacted_date (R); on failure status = "Send Failed" |
| 09 | Contacts | linkedin, relationship_stage | Contacts | relationship_stage |
| 10 | — | — | Speaking Assets | topic_title, one_liner, target_audience, key_takeaways, past_delivery, created_date, etc. |
| 11 | Opportunities | status, contacted_date, last_follow_up_date, follow_up_count, id, event_name, organizer_name, organizer_email | Opportunities, Follow-Up Log | follow_up_count (Y), last_follow_up_date (Z), status (N); Follow-Up Log: opportunity_id, follow_up_number, sent_date, email_subject, email_body |
| 12 | Opportunities | id | Opportunities, Response Log | status (N), responded_date (AA), notes (S); Response Log: opportunity_id, response_date, classification, email_snippet |

**Opportunities columns (A–AA):**  
A: id, B: event_name, C: event_type, D: event_date, E: location, F: url, G: description, H: organizer_name, I: organizer_email, J: organizer_linkedin, K: organizer_title, L: audience_size, M: audience_type, N: status, O: quality_score, P: source, Q: discovered_date, R: contacted_date, S: notes, T: cfp_deadline, U: submission_requirements, V: pitch_subject, W: pitch_body, X: recommended_topic, Y: follow_up_count, Z: last_follow_up_date, AA: responded_date.

---

## QUESTION 5: GITHUB ACTIONS CONFIGURATION

1. **Is there a .github/workflows folder?**  
   **No.** No `.github/workflows` under aiAgents (or workflows-speaking).

2. **.yml files?**  
   **None.**

3. **Schedule triggers?**  
   **N/A.**

4. **GitHub Secrets?**  
   **N/A.**

5. **Scripts run by each Action?**  
   **N/A.**

**Gap:** No GitHub Actions. All scripts are intended for manual run or external scheduler (cron, etc.). To run on a schedule you would need to add workflow YAMLs and configure secrets (SPREADSHEET_ID, BREVO_API_KEY, etc.).

---

## QUESTION 6: DEPENDENCIES & PACKAGES

1. **Does package.json exist?**  
   **Yes.** `workflows-speaking/package.json`.

2. **npm packages installed:**  
   - **dependencies:** `dotenv` ^16.4.5, `google-spreadsheet` ^4.1.0  
   - **optionalDependencies:** `@anthropic-ai/sdk` ^0.32.0

3. **Requested packages:**  
   - **googleapis** — **No.** Uses `google-spreadsheet` (different library) for Sheets.  
   - **@anthropic-ai/sdk** — **Yes** (optional).  
   - **node-fetch / axios** — **No.** Node 18+ native `fetch` is used.  
   - **dotenv** — **Yes.**  
   - **cheerio / jsdom** — **No.** 05 uses regex on HTML; no HTML parser dependency.

4. **.gitignore:**  
   At `aiAgents/.gitignore`:  
   - `credentials/*.json` (except template), `credentials/*.txt`, `*.key`, `*.pem`, `.env`, `.env.local`  
   - Keeps `credentials/.gitignore`, `credentials/README.md`.

5. **README setup instructions:**  
   - `workflows-speaking/README.md`: references n8n import, shared_config, sheet columns, and **scripts/README.md** for Node scripts.  
   - `workflows-speaking/scripts/README.md`: prerequisites (Google Sheet from speaking-sheets-import, credentials JSON, env); lists `SPREADSHEET_ID`, optional SERPAPI, ANTHROPIC, BREVO, SENDER_EMAIL, MAX_DAILY_EMAILS; commands `npm run 01` … `npm run 12` and `node scripts/<name>.js`.

---

## QUESTION 7: TESTING CAPABILITY

1. **test-credentials.js in config?**  
   **Yes.** `aiAgents/config/test-credentials.js`.

2. **Other test files?**  
   No Jest/Mocha or other test scripts under workflows-speaking or aiAgents for these scripts.

3. **Run each script locally:**  
   From `aiAgents/workflows-speaking`:  
   - `npm install`  
   - Set `SPREADSHEET_ID` (and any API keys) in `aiAgents/.env`  
   - `npm run 01` … `npm run 12` or `node scripts/01-conference-hunter.js`, etc.

4. **Command to test credentials:**  
   From `aiAgents`:  
   `node config/test-credentials.js`  
   This validates Google Sheets service account JSON and prints the service account email.

5. **Can you run `node scripts/01-conference-hunter.js` locally?**  
   **Yes**, from `workflows-speaking` (or with correct cwd so `lib/load-env.js` and `lib/sheet-client.js` resolve and env points to `aiAgents/.env`). Requires: `SPREADSHEET_ID` set, sheet shared with service account, and (for real search) `SERPAPI_API_KEY`.

---

## QUESTION 8: EMAIL OUTREACH IMPLEMENTATION (08-email-outreach.js)

1. **Recipient email:**  
   From Opportunities: `row.get('organizer_email')` for each row with status matching "Ready to Send" and non-empty `pitch_subject` and `organizer_email`.

2. **Email service:**  
   **Brevo.** Sends via `https://api.brevo.com/v3/smtp/email` with `api-key` header.

3. **Rate limiting:**  
   **Yes.** `MAX_DAILY = parseInt(process.env.MAX_DAILY_EMAILS || '10', 10)`; `toSend = ready.slice(0, MAX_DAILY)`.

4. **After sending:**  
   Row updated: `status` → "Contacted", `contacted_date` → today (YYYY-MM-DD); then `row.save()`.

5. **Email structure:**  
   - **sender:** `process.env.SENDER_EMAIL || 'outreach@example.com'`, name "Seamlessly".  
   - **to:** `[{ email: to }]`.  
   - **subject:** `row.get('pitch_subject')`.  
   - **htmlContent:** `row.get('pitch_body')` with `\n` → `<br>`.

6. **On send failure:**  
   Row set to "Send Failed", saved; then `logError(WORKFLOW_NAME, ...)` appends to Error Log sheet.

---

## QUESTION 9: AI PITCH GENERATION (07-pitch-writer.js)

1. **Anthropic API call:**  
   Dynamic import: `const { Anthropic } = await import('@anthropic-ai/sdk');`  
   `client.messages.create({ model, max_tokens, messages })`.

2. **Claude model:**  
   `claude-sonnet-4-20250514` (Sonnet 4).

3. **Prompt:**  
   User message: “Write a short speaker pitch email (2-3 paragraphs, under 200 words). Event: {eventName} ({eventType}). Organizer: {organizerName}. Audience: {audienceType}. Sign off as Seamlessly founder. Return ONLY valid JSON: {"subject":"...","body":"...","topic":"..."}”

4. **Where pitch is stored:**  
   Google Sheets Opportunities: `pitch_subject` (V), `pitch_body` (W), `recommended_topic` (X) via `row.set(...)` and `row.save()`.

5. **Claude API failure:**  
   No try/catch around `generatePitch`; if it throws, the script’s top-level `.catch()` runs: `logError(WORKFLOW_NAME, e.message)`, console.error, `process.exit(1)`. No retry or fallback inside 07 (fallback is only when `ANTHROPIC_API_KEY` is missing — then returns a static pitch).

6. **Event details from sheet?**  
   **Yes.** Reads `event_name`, `event_type`, `organizer_name`, `audience_type` from the Opportunities row and passes them into `generatePitch()`.

---

## QUESTION 10: FOLLOW-UP LOGIC (11-follow-up-sequence.js)

1. **Which opportunities get follow-ups?**  
   Rows with `status === 'Contacted'`, then filtered by: last contact date ≤ (today - 7 days) and `follow_up_count < MAX_FOLLOW_UPS` (3).

2. **“7 days since last contact”:**  
   `cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)`; `cutoffStr = cutoff.toISOString().slice(0,10)`.  
   Eligible if `(row.get('contacted_date') || row.get('last_follow_up_date')) <= cutoffStr` (string comparison; assumes YYYY-MM-DD).

3. **Max follow-ups:**  
   **3** (`MAX_FOLLOW_UPS = 3`). After 3rd follow-up, status set to "No Response".

4. **Updates follow_up_count?**  
   **Yes.** `count = parseInt(row.get('follow_up_count') || 0, 10) + 1`; then `row.set('follow_up_count', count)`.

5. **Updates last_follow_up_date?**  
   **Yes.** `row.set('last_follow_up_date', today)`.

6. **Status to "No Response" after max?**  
   **Yes.** `if (count >= MAX_FOLLOW_UPS) row.set('status', 'No Response')`.

---

## QUESTION 11: RESPONSE TRACKING (12-response-parser.js)

1. **How does it read Gmail?**  
   **It does not.** The script does not read Gmail. It expects you to pass in `opportunityId`, `classification`, and optional `emailSnippet` via env or CLI.

2. **Gmail API or other?**  
   **Neither.** No Gmail integration in this script.

3. **How does it classify?**  
   Classification is **provided by the caller** (e.g. manual or another tool). Script accepts: interested, not_interested, needs_info, out_of_office, unrelated.

4. **Claude to classify?**  
   **No.** No AI in 12; classification is input only.

5. **Updates in Google Sheets when response received?**  
   **Yes.** Opportunities: `status` (from statusMap), `responded_date` (today), `notes` (appends snippet if provided). Response Log: appends row with opportunity_id, response_date, classification, email_snippet.

6. **Writes to Response Log?**  
   **Yes.** `responseSheet.addRow({ opportunity_id, response_date, classification, email_snippet })`.

**Gap:** Full “monitor Gmail → classify → update” is not implemented; 12 is the sheet-update and logging half only.

---

## QUESTION 12: FEATURE COMPLETENESS CHECK

| Feature | Status | File(s) | Notes |
|--------|--------|---------|--------|
| 1. Discovery (conferences, podcasts, universities, associations) | Implemented | 01, 02, 03, 04 | 04 uses HTTP fetch to association URLs, not SerpAPI. |
| 2. Quality scoring (0–25) | Implemented | 06-event-quality-scorer.js | Audience, event type, audience fit, CFP urgency. |
| 3. AI pitch generation (Claude) | Implemented | 07-pitch-writer.js | Uses Claude Sonnet 4; fallback static pitch if no key. |
| 4. Email sending (Brevo) | Implemented | 08, 11 | Brevo SMTP API; rate limit in 08. |
| 5. Follow-up automation (7 days, max 3) | Implemented | 11-follow-up-sequence.js | 7-day delay, max 3 follow-ups, status → No Response. |
| 6. Response tracking (parse Gmail, update status) | Partially implemented | 12-response-parser.js | Sheet update + Response Log done; **no Gmail read or AI classification**. |
| 7. Error logging | Implemented | All scripts via sheet-client `logError()` | Writes to Error Log sheet. |
| 8. Rate limiting (max 10 emails/day outreach) | Implemented | 08-email-outreach.js | `MAX_DAILY_EMAILS` (default 10). |

---

## QUESTION 13: DEPLOYMENT READINESS

| Question | Answer | Explanation |
|----------|--------|-------------|
| 1. Run any script locally with `node scripts/[name].js` now? | **Yes** | From workflows-speaking with `SPREADSHEET_ID` and credentials in place. |
| 2. All API credentials from env (not hardcoded)? | **Yes** | Keys from `process.env` (aiAgents/.env via load-env). No keys in repo. |
| 3. Will scripts work on GitHub Actions without modification? | **No** | No workflow files; would need .github/workflows and secrets (SPREADSHEET_ID, BREVO_API_KEY, etc.). Scripts themselves are env-based so would work once secrets are set. |
| 4. Documentation on GitHub Secrets? | **No** | No GHA docs. scripts/README documents env vars for local run. |
| 5. Deployment checklist or setup guide in README? | **Partial** | scripts/README has prerequisites and run commands; no formal “deployment” or GHA checklist. |
| 6. TODO comments or unfinished sections? | **Minor** | 12’s comment says “Gmail fetch must be done via OAuth (manual or separate integration).” No other TODOs noted. |
| 7. All required npm packages in package.json? | **Yes** | dotenv, google-spreadsheet, optional @anthropic-ai/sdk. Native fetch used; no node-fetch. |
| 8. .gitignore preventing credential commit? | **Yes** | aiAgents/.gitignore ignores credentials/*.json (except template), .env, etc. |

---

## QUESTION 14: FINAL SUMMARY & GAPS

### 1. COMPLETION STATUS: **~75%**

- Discovery, scoring, pitch writing, email send, follow-ups, error logging, and rate limiting are implemented.
- Missing: GitHub Actions, full Gmail-based response pipeline (read + classify), and optional polish (e.g. 12 with Claude classification).

### 2. WHAT'S WORKING

- All 12 Node scripts exist and are wired to Sheets and (where used) SerpAPI, Brevo, Anthropic.
- Credentials: `credentials/` and `config/credentials-config.js` and `test-credentials.js` in place; Sheets key from JSON; API keys from .env.
- Google Sheets: sheet-client uses credentials-config; scripts read/write correct tabs and columns (Opportunities A–AA, Follow-Up Log, Response Log, Error Log, optional Contacts/Speaking Assets).
- 08: Brevo send, rate limit 10/day, status → Contacted, Error Log on failure.
- 07: Claude Sonnet 4 pitch generation, writes V/W/X.
- 11: 7-day delay, max 3 follow-ups, Follow-Up Log, status → No Response.
- 12: Sheet update and Response Log when given id + classification (+ optional snippet).
- .gitignore protects credentials and .env.

### 3. BUILT BUT UNTESTED

- End-to-end run of all 12 scripts with a real Sheet and real API keys.
- 12 with a real Gmail integration (no Gmail in repo).
- Running on a schedule (no GHA yet).

### 4. WHAT'S MISSING

- **GitHub Actions:** No .github/workflows; no scheduled runs (e.g. discovery weekly, outreach/follow-up daily, response parser every 2 hours).
- **Response pipeline:** 12 does not read Gmail or classify with Claude; it only applies a caller-provided classification. Missing: Gmail API/OAuth, fetch unread, match to organizer_email, Claude (or other) classification, then call 12 or equivalent.
- **.env.example:** Not in workflows-speaking; only scripts/README documents vars.
- **Deployment/docs:** No “GitHub Secrets” or “deployment checklist” section.

### 5. NEXT STEPS (to get to 100% deploy-ready)

1. **Add GitHub Actions workflows**  
   - Discovery (01–04): e.g. weekly.  
   - Outreach (08), follow-up (11): e.g. daily (9 AM / 9:30 AM).  
   - Response (12): e.g. every 2 hours (after Gmail integration exists).  
   - Use secrets: SPREADSHEET_ID, BREVO_API_KEY, ANTHROPIC_API_KEY, SERPAPI_API_KEY, SENDER_EMAIL, etc.

2. **Implement Gmail read + classification for 12**  
   - Use Gmail API (OAuth) to fetch unread messages; match sender to Opportunities.organizer_email; optionally use Claude to classify intent; then update sheet and Response Log (or call current 12 with the result).

3. **Add .env.example**  
   - In aiAgents or workflows-speaking listing SPREADSHEET_ID, BREVO_API_KEY, ANTHROPIC_API_KEY, SERPAPI_API_KEY, SENDER_EMAIL, MAX_DAILY_EMAILS.

4. **Document deployment**  
   - README or DEPLOYMENT.md: how to set GitHub Secrets, run GHA, and (if applicable) run 12 with Gmail.

5. **Smoke-test**  
   - Run 01 → 06 → 07 → 08 (and 11, 12 with manual input) against a test Sheet and verify rows and statuses.

### 6. BLOCKERS

- **No critical blocker** for local or cron-based runs.
- For **scheduled cloud runs**: need GitHub Actions (or similar) and secrets.
- For **full response automation**: need Gmail integration and (optional) Claude classification; 12 alone is not enough.

### 7. ESTIMATED TIME

- **GHA + secrets + docs:** ~2–4 hours.  
- **Gmail read + match + optional Claude + wire to 12:** ~4–8 hours.  
- **End-to-end testing and small fixes:** ~2–4 hours.  
- **Total to “100% deploy-ready”:** roughly **1–2 days** for someone familiar with the repo and Gmail API.

---

## Quick reference: ✅ / ⚠️ / ❌

- **COMPLETE:** Project structure, 12 scripts, credentials layout, Sheets integration, 07 (pitch), 08 (email), 11 (follow-up), 12 (sheet update + Response Log), error logging, rate limiting, .gitignore.
- **PARTIAL / ISSUES:** 12 (no Gmail, no AI classification); no GHA; no .env.example; deployment docs minimal.
- **MISSING:** GitHub Actions workflows, Gmail integration for 12, deployment checklist and secrets documentation.
- **TODO:** Add GHA YAMLs; implement Gmail fetch + classification; add .env.example and deployment section; run full pipeline test.
