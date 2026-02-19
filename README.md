# Speaking Opportunities Prospecting System

**Project root:** This directory (`workflows-speaking-production/`). Run all commands and scripts from here. Paths for `.env`, `credentials/`, and `config/` are relative to this root (local and GitHub Actions).

Automated workflows for discovering and pursuing speaking opportunities for thought leadership in hospitality technology.

## Workflow Overview

1. **01_conference_hunter.json** - Discovers hospitality conferences with CFP opportunities
2. **02_university_prospector.json** - Finds university guest speaker opportunities
3. **03_podcast_finder.json** - Discovers podcast and media interview opportunities
4. **04_industry_association_scanner.json** - Scans industry associations for event opportunities
5. **05_organizer_contact_finder.json** - Finds and enriches organizer contact information
6. **06_event_quality_scorer.json** - Scores speaking opportunities by quality and fit
7. **07_seamlessly_pitch_writer.json** - Generates personalized pitch emails for speaking opportunities
8. **08_email_outreach_speaking.json** - Sends outreach emails with rate limiting
9. **09_linkedin_connection_sequence.json** - Manages LinkedIn connection and engagement sequences
10. **10_post_speaking_leverage.json** - Leverages completed speaking engagements for future opportunities (Form Trigger)
11. **11_follow_up_sequence.json** - Automatically sends follow-up emails to non-responsive contacts
12. **12_response_parser.json** - Monitors Gmail for replies and updates opportunity status

## Node.js workflow scripts

This repo also includes **12 Node.js scripts** (one per workflow) in `scripts/`. They use the same Google Sheet and credentials. See **scripts/README.md** for how to run them and required env (`SPREADSHEET_ID`, `SERPAPI_API_KEY`, etc.).

## Google Sheets Structure

**Quick setup:** Use the Google Apps Script function `createSpeakingOpportunitiesSheet()` (see **`createSpeakingOpportunitiesSheet.gs`**) to automatically create the sheet with all tabs, columns, formatting, and formulas. Deployment ID: `AKfycbzqyVHzSJKs6Fauj8sjaFBb5YzuueBcfmFa-GacNVC8zxetA2rOY08EsaZs56UwG-gD`

### Sheet 1: "Opportunities"
Columns: event_name (A), event_type (B), industry (C), event_date (D), location (E), format (F), website (G), cfp_deadline (H), speaker_app_link (I), past_speakers (J), attendance (K), audience_type (L), organizer_name (M), organizer_email (N), organizer_linkedin (O), score (P), status (Q), contacted_date (R), last_activity (S), response (T), notes (U), pitch_subject (V), pitch_body (W), recommended_topic (X), follow_up_count (Y), last_follow_up_date (Z), responded_date (AA)

**Setup:** Add columns V–AA with headers above before running Workflows 07, 08, 11, 12.

### Sheet 2: "Contacts"
Columns: contact_name (A), title (B), organization (C), email (D), linkedin (E), phone (F), event_related (G), relationship_stage (H), last_contact (I), notes (J)

### Sheet 3: "Speaking Assets"
Columns: topic_title (A), one_liner (B), target_audience (C), key_takeaways (D), talk_length (E), past_delivery (F), video_link (G), created_date (H)

### Sheet 4: "Follow-Up Log" (Workflow 11)
Columns: opportunity_id (A), follow_up_number (B), sent_date (C), email_subject (D), email_body (E)

### Sheet 5: "Response Log" (Workflow 12)
Columns: opportunity_id (A), response_date (B), classification (C), email_snippet (D)

### Sheet 6: "Error Log"
Columns: workflow (A), error (B), timestamp (C)

## Configuration

See `shared_config_speaking.json` for:
- Speaking topics and value propositions
- Speaker credentials and proof points
- Outreach limits and follow-up schedules

## Setup Instructions

1. Import each workflow JSON file into n8n
2. Configure credentials in `shared_config_speaking.json`
3. Set up Google Sheets with the required columns
4. Test each workflow individually before enabling schedules
# speakerAgent
# speakerAgent
