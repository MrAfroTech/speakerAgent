/** Load .env from repo root so scripts find SPREADSHEET_ID, ANTHROPIC_API_KEY, etc. */
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
