// config/credentials-config.js
const path = require('path');
const fs = require('fs');

function getGoogleSheetsCredentials() {
  const fromEnv =
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (fromEnv) {
    return {
      type: 'service_account',
      project_id: process.env.GOOGLE_SHEETS_PROJECT_ID || '',
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }
  const credPath = path.resolve(process.cwd(), 'credentials', 'google-sheets-service-account.json');
  if (!fs.existsSync(credPath)) {
    throw new Error(
      'Google Sheets credentials not found. Set GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY in .env, ' +
      'or place google-sheets-service-account.json in credentials/'
    );
  }
  const raw = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  return {
    type: raw.type || 'service_account',
    project_id: raw.project_id || '',
    client_email: raw.client_email,
    private_key: raw.private_key,
  };
}

module.exports = { getGoogleSheetsCredentials };
