#!/usr/bin/env bash
# Set GitHub Actions secrets. Sources .env from project root (workflows-speaking-production/).
# Run from project root. Add SPREADSHEET_ID to .env (or get from SpreadsheetApp.getActiveSpreadsheet().getId() in Apps Script).
ENV_FILE="${BASH_SOURCE%/*}/.env"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

gh secret set SPREADSHEET_ID -b"${SPREADSHEET_ID:-YOUR_SHEET_ID_HERE}"
gh secret set BREVO_API_KEY -b"${BREVO_API_KEY:-YOUR_BREVO_KEY}"
gh secret set ANTHROPIC_API_KEY -b"${ANTHROPIC_API_KEY:-YOUR_ANTHROPIC_KEY}"
gh secret set SERPAPI_API_KEY -b"${SERPAPI_API_KEY:-YOUR_SERPAPI_KEY}"
gh secret set GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON < /Users/missioncontrol/Downloads/second-flame-338521-373ac0ca18ab.json
