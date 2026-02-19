# Speaking Opportunities Prospecting System — Comprehensive Project Explanation

This document provides a thorough explanation of what we're doing in this codebase, what has been built, and what may be missing. Use it to onboard Claude (or any AI) and understand the full context.

---

## 1. Project Purpose & Context

### What This Is

A **n8n-based automation system** that discovers and pursues **speaking opportunities** for thought leadership in **hospitality technology**. The target is the founder of **Seamlessly** — a hospitality tech platform — who wants to build authority through conference keynotes, university guest lectures, podcast interviews, and association events.

### Business Context

- **Company:** Seamlessly (hospitality technology platform)
- **Goal:** Generate a steady pipeline of speaking opportunities (conferences, universities, podcasts, associations)
- **Outcome:** Thought leadership, lead generation, brand visibility, potential customers
- **Tech stack:** n8n (workflow automation), Google Sheets (CRM/pipeline), OpenAI (content generation), SerpAPI (search), Gmail/SMTP (email)

### Parent Codebase

This lives under `aiAgents/workflows-speaking/` within the broader **SeamlessMarketplace** monorepo. Related workflow suites:

- `workflows/` — General lead discovery and outreach
- `workflows-seamlessly/` — Seamlessly-specific lead gen (bars, restaurants, stakeholders)
- `workflows-facebook-events/` — Event discovery and Facebook publishing
- `workflows-speaking/` — **This project** — speaking opportunity prospecting

---

## 2. What We've Built — The 10-Workflow Pipeline

### High-Level Flow

```
Discovery (01–04) → Contact Enrichment (05) → Scoring (06) → Pitch Writing (07) → Outreach (08–09) → Post-Event Leverage (10)
```

### Workflow 1: Conference Hunter

**File:** `01_conference_hunter.json`  
**Schedule:** Weekly, Monday 9 AM (`0 9 * * 1`)

**What it does:**
- Searches Google (via SerpAPI) for hospitality conference CFPs using queries like:
  - "hospitality conference 2026 call for speakers"
  - "food and beverage summit CFP"
  - "restaurant innovation conference"
  - etc.
- Extracts conference titles, links, snippets from search results
- Filters for conferences/summits/CFP mentions
- For each result with a website: fetches the page, uses **GPT-4o** to extract:
  - event_date, location, cfp_deadline, speaker_app_link, attendance, audience_type, past_speakers
- Writes to Google Sheets "Opportunities" tab (enriched or basic)

**Status:** Built, ready for import. Uses placeholder credentials.

---

### Workflow 2: University Prospector

**File:** `02_university_prospector.json`  
**Schedule:** Bi-weekly, Tuesday 10 AM (`0 10 */14 * 2`)

**What it does:**
- Searches for hospitality/culinary/hotel management university programs
- Filters for `.edu` domains
- Fetches department pages and uses **GPT-4o-mini** to extract contact info (chair, director, coordinator)
- Adds opportunities with `event_type: university`, `cfp_deadline: Rolling`, `attendance: 50`

**Status:** Built. Assumes university pages expose contact info in HTML.

---

### Workflow 3: Podcast Finder

**File:** `03_podcast_finder.json`  
**Schedule:** Monthly, 1st of month, 9 AM (`0 9 1 * *`)

**What it does:**
- Searches for hospitality/restaurant/hotel podcasts "accepting guests"
- Filters for Apple Podcasts, Spotify, YouTube links
- Fetches podcast pages, uses **GPT-4o-mini** to extract host name, contact email, booking form, subscriber count
- Adds as `event_type: podcast`, `format: virtual`, `cfp_deadline: Rolling`

**Status:** Built. Contact extraction from podcast pages is often unreliable (many use generic forms).

---

### Workflow 4: Industry Association Scanner

**File:** `04_industry_association_scanner.json`  
**Schedule:** Monthly, 15th at 10 AM (`0 10 15 * *`)

**What it does:**
- Targets associations: NRA, AHLA, IAVM, HFTP, NACE
- For each association:
  - SerpAPI search for "[association] events 2026"
  - HTTP GET to `{association.url}/events` for event calendar
  - **GPT-4o** parses HTML for events, dates, locations, CFP info, contacts
- Adds as `event_type: association`

**Status:** Built. **Known issue:** `splitInBatches` receives a single object `{ associations: [...] }`. Downstream nodes use `$json.associations.search`, but `associations` is an array — `$json.associations.search` is `undefined`. The workflow likely needs restructuring so each association is processed as a separate item.

---

### Workflow 5: Organizer Contact Finder

**File:** `05_organizer_contact_finder.json`  
**Schedule:** Daily, 11 AM (`0 11 * * *`)

**What it does:**
- Reads Opportunities where `organizer_email` is empty and `website` is not
- Fetches event website
- Uses **GPT-4o** to extract organizer name, title, email, LinkedIn
- Updates Opportunities and appends to Contacts sheet

**Status:** Built. Critical for moving opportunities to the outreach stage.

---

### Workflow 6: Event Quality Scorer

**File:** `06_event_quality_scorer.json`  
**Schedule:** Daily, 12 PM (`0 12 * * *`)

**What it does:**
- Reads opportunities with status "Contact Found" and `score = 0`
- Calculates a 0–25 score from:
  - **Audience size (0–10):** 1000+ = 10, 500+ = 8, 200+ = 5, 50+ = 3
  - **Event type (0–5):** conference=5, association=4, university=3, podcast=2
  - **Audience fit (0–5):** executive/c-suite, venue/restaurant/hotel, tech keywords
  - **Past speakers prestige (0–3):** CEO/Founder/VP/Harvard/etc.
  - **CFP urgency (0–2):** rolling=2, deadline >30 days=1
- Sets status: `score >= 18` → "High Priority", `>= 12` → "Qualified", `>= 8` → "Low Priority", else "Disqualify"
- Sends email alert for high-priority opportunities

**Status:** Built and logic is sound.

---

### Workflow 7: Seamlessly Pitch Writer

**File:** `07_seamlessly_pitch_writer.json`  
**Schedule:** Daily, 1 PM (`0 13 * * *`)

**What it does:**
- Reads qualified opportunities (status contains "High Priority" or "Qualified") with empty `contacted_date`
- Reads "Speaking Assets" sheet for available talk topics
- Uses **GPT-4o** to generate personalized pitch emails (200–250 words) with:
  - subject, opener, body, recommended_topic, ps
- Formats full email with signature
- **Updates** Opportunities with `pitch_subject`, `pitch_body`, `recommended_topic`
- For score >= 18: sends pitch to user for manual review before sending

**Status:** Built. **Schema gap:** README lists Opportunities columns A–U only. This workflow writes `pitch_subject`, `pitch_body`, `recommended_topic`. The Google Sheet needs columns V, W, X (or equivalent) for these fields, or the update will fail/create unexpected columns.

**Filter note:** Google Sheets filter uses OR for "High Priority" and "Qualified" but does not explicitly enforce `contacted_date = ""`. Depending on n8n's filter behavior, already-contacted rows might be included. Worth verifying.

---

### Workflow 8: Email Outreach (Speaking)

**File:** `08_email_outreach_speaking.json`  
**Schedule:** Daily, 3 PM (`0 15 * * *`)

**What it does:**
- Reads opportunities with status containing "Ready to Send"
- Rate limiting: max 10 emails/day (from `shared_config_speaking.json`)
- Sorts by score (high first), takes up to `remaining` slots
- Staggers sends (3–8 minute random delay per email)
- Sends via Gmail using `pitch_subject` and `pitch_body`
- Updates status to "Contacted", sets `contacted_date`, logs in Contacts
- On error: marks "Send Failed", sends alert

**Status:** Built. Assumes pitches have been written (Workflow 7) and manually approved for high-priority. **Handoff:** Workflow 7 sets status "Ready to Send - High Priority" or "Ready to Send - Qualified" — the "contains" filter should match.

---

### Workflow 9: LinkedIn Connection Sequence

**File:** `09_linkedin_connection_sequence.json`  
**Schedule:** Daily, 10 AM (`0 10 * * *`)

**What it does:**
- Reads Contacts with non-empty `linkedin` and `relationship_stage = "New Lead"`
- Caps at 15/day
- Uses **GPT-4o-mini** to write personalized connection notes (≤280 chars)
- Marks status "LinkedIn - Connection Sent"
- **Does not** auto-send via LinkedIn API (which would risk account restrictions)
- Emails user a summary: list of contacts, LinkedIn URLs, suggested notes — **manual send required**

**Status:** Built. Correctly avoids LinkedIn automation; provides actionable output for manual execution.

---

### Workflow 10: Post-Speaking Leverage

**File:** `10_post_speaking_leverage.json`  
**Trigger:** Manual

**What it does:**
- User triggers after completing a speaking gig
- "Enter Event Info" node is a **Set** node with static placeholders: `event_name`, `organizer_email`, `talk_recording_url`, `attendee_count`, `attendee_list_available`
- Writes thank-you email to organizer (GPT-4o-mini)
- Optionally writes attendee follow-up if `attendee_list_available`
- Writes LinkedIn recap post
- Appends to Speaking Assets for content repurposing
- Waits 7 days, then emails user a checklist (testimonial follow-up, etc.)

**Status:** Built. **Critical gap:** The "Enter Event Info" node uses hardcoded empty values. There is no form or input mechanism. The user must either:
1. Edit the workflow JSON before each run to inject event details, or
2. Replace the Set node with an n8n Form Trigger or similar to collect input.

As-is, thank-you and recap content will be generic/empty unless the workflow is modified per run.

---

## 3. Data Model & Google Sheets Structure

### Sheet 1: Opportunities (Primary pipeline)

| Col | Field             | Description                                      |
|-----|-------------------|--------------------------------------------------|
| A   | event_name        | Conference/university/podcast/event name         |
| B   | event_type        | conference, university, podcast, association     |
| C   | industry          | Hospitality, F&B, Restaurant, etc.               |
| D   | event_date        | Event date                                       |
| E   | location          | City, State/Country or "Remote"                  |
| F   | format            | in-person, virtual                               |
| G   | website           | Event URL                                        |
| H   | cfp_deadline      | CFP deadline or "Rolling"                        |
| I   | speaker_app_link  | Application URL                                  |
| J   | past_speakers     | Past speaker names                               |
| K   | attendance        | Estimated attendance                             |
| L   | audience_type     | Target audience description                      |
| M   | organizer_name    | Primary contact name                             |
| N   | organizer_email   | Contact email                                    |
| O   | organizer_linkedin| LinkedIn URL                                     |
| P   | score             | 0–25 quality score                               |
| Q   | status            | Pipeline status (see below)                      |
| R   | contacted_date    | When outreach was sent                           |
| S   | last_activity     | Last update timestamp                            |
| T   | response          | Organizer response                               |
| U   | notes             | Freeform notes                                   |
| V?  | pitch_subject     | *(Not in README — required by Workflow 07/08)*   |
| W?  | pitch_body        | *(Not in README — required by Workflow 07/08)*   |
| X?  | recommended_topic | *(Not in README — from Workflow 07)*             |

### Status Flow

```
New - Needs Enrichment / New - University / New - Podcast / New - Association
  → Enriched - Ready to Score / Contact Found - Ready to Score / Contact Found - University / etc.
  → High Priority - Pursue Aggressively / Qualified - Standard Outreach / Low Priority / Disqualify
  → Ready to Send - High Priority / Ready to Send - Qualified
  → Contacted
  → Completed - Follow-Up Sent (post-speaking)
```

### Sheet 2: Contacts

Contact_name, title, organization, email, linkedin, phone, event_related, relationship_stage, last_contact, notes.

### Sheet 3: Speaking Assets

topic_title, one_liner, target_audience, key_takeaways, talk_length, past_delivery, video_link, created_date.

---

## 4. Shared Configuration

**File:** `shared_config_speaking.json`

- **Credentials placeholders:** Google Sheets, Gmail, OpenAI, SerpAPI, LinkedIn
- **Speaking topics:** 4 pre-defined talks (e.g., "$25M Wait-Time Problem", "Death by a Thousand Apps")
- **Speaker credentials:** Seamlessly founder, proof points, past speaking, media
- **Outreach limits:** max 10 emails/day, 15 LinkedIn connections/day, 7-day follow-up, max 3 follow-ups
- **Sheet column mappings:** A–U for Opportunities, A–J for Contacts, A–H for Speaking Assets

---

## 5. What May Be Missing or Incomplete

### A. Schema & Configuration

1. **Opportunities sheet** needs columns for `pitch_subject`, `pitch_body`, `recommended_topic` (or README/doc updated to reflect them).
2. **Credentials** are placeholders. Must be configured in n8n (OAuth for Google/Gmail, API keys for OpenAI/SerpAPI).
3. **Spreadsheet ID** and sheet names must match `shared_config` and workflow references.
4. **Email addresses** — "your-email@domain.com" appears in several nodes; replace with real addresses.

### B. Workflow Logic Issues

1. **04 Industry Association Scanner:** `splitInBatches` over `{ associations: [...] }` — downstream expects `$json.associations.search` but `associations` is an array. Need to loop over each association (e.g., convert to multiple items before split).
2. **07 Pitch Writer filter:** Ensure `contacted_date` is empty; current filter may not enforce that depending on n8n behavior.
3. **10 Post-Speaking Leverage:** No way to input event info. Needs Form Trigger or similar.

### C. Integration Gaps

1. **No follow-up automation:** After "Contacted," there is no automated follow-up sequence (e.g., Day 3, Day 7 reminders) despite `followUpDelayDays` and `maxFollowUps` in config.
2. **No response handling:** When organizer replies, there is no workflow to parse emails and update `response` / `status` in the sheet.
3. **LinkedIn:** Intentionally manual; no API integration. Consider Phantombuster/Proxycurl if scaling, with caution.
4. **Attendee follow-up (Workflow 10):** "Format for Email Tool" outputs a structure but there is no actual Mailchimp/SendGrid/etc. integration.

### D. Quality & Robustness

1. **Error handling:** Many HTTP/OpenAI nodes lack retries or fallbacks. Rate limits (SerpAPI, OpenAI) could cause failures.
2. **Deduplication:** No check for duplicate events before appending to Opportunities (e.g., same conference from 01 and 04).
3. **Date parsing:** CFP deadline parsing is regex-based and brittle across formats.
4. **Website fetching:** Some event sites may block bots or require JS; raw HTML fetch may miss content.

### E. Documentation & Testing

1. **No import/setup script** for n8n (workflows are JSON; import is manual).
2. **No test or dry-run mode** (e.g., write to a "Test" sheet first).
3. **Cron expressions** are documented in this file but not in README.

---

## 6. Suggested Next Steps (Priority Order)

1. **Fix Workflow 04** — Correct the association loop so each association is processed separately.
2. **Fix Workflow 10** — Add Form Trigger or manual input for event details.
3. **Update Google Sheet** — Add pitch columns (V, W, X) and document in README.
4. **Configure credentials** — Real API keys and OAuth in n8n.
5. **Add follow-up workflow** — Scheduled workflow that finds "Contacted" opportunities with no response and sends follow-up emails based on `followUpDelayDays` and `maxFollowUps`.
6. **Add deduplication** — Before appending, check if `event_name` + `website` already exists.
7. **Test end-to-end** — Run 01 → 05 → 06 → 07 → 08 in sequence with test data.
8. **Document handoff** — Explicit approval step for "Ready to Send - High Priority" before 08 sends.

---

## 7. Quick Reference

| Workflow | File                       | Schedule        | Purpose                         |
|----------|----------------------------|-----------------|---------------------------------|
| 01       | 01_conference_hunter       | Mon 9am weekly  | Discover conference CFPs        |
| 02       | 02_university_prospector   | Tue 10am bi-week| University guest speaker opps   |
| 03       | 03_podcast_finder          | 1st monthly 9am | Podcast guest opportunities     |
| 04       | 04_industry_association    | 15th monthly    | Association events              |
| 05       | 05_organizer_contact_finder| Daily 11am      | Enrich organizer contacts       |
| 06       | 06_event_quality_scorer    | Daily 12pm      | Score opportunities 0–25        |
| 07       | 07_seamlessly_pitch_writer | Daily 1pm       | Generate personalized pitches   |
| 08       | 08_email_outreach_speaking | Daily 3pm       | Send pitches (rate limited)     |
| 09       | 09_linkedin_connection     | Daily 10am      | Prep LinkedIn connections       |
| 10       | 10_post_speaking_leverage  | Manual          | Thank-you, recap, repurposing   |

---

*Document generated for AI onboarding and project continuity. Last updated: Feb 2025.*
