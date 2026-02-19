# Fix Google Sheets 404 – Share with Service Account

If you see **404 – Requested entity was not found** even though auth works, the spreadsheet either doesn’t exist or isn’t shared with the service account.

---

## Task 1: Confirm the spreadsheet exists

1. Open:  
   **https://docs.google.com/spreadsheets/d/1fUoN7X45onXzsY2Ntdj00O9QRi7hrHbFIv8XujB0jc_hXChRc-mIBzb_/edit**
2. If you get “File not found” or 404: create a new sheet (e.g. with `createSpeakingOpportunitiesSheet.gs`) and put its ID in `.env` as `SPREADSHEET_ID`.
3. If the sheet opens: continue to Task 2.

---

## Task 2: Share the spreadsheet with the Service Account

Your service account email (from `credentials/google-sheets-service-account.json`) is:

**`second-flame-338521@appspot.gserviceaccount.com`**

1. Open your spreadsheet in Google Sheets.
2. Click **Share** (top right).
3. Under “Add people and groups”, paste:  
   **second-flame-338521@appspot.gserviceaccount.com**
4. Choose **Editor** (or at least **Viewer** if the script only reads).
5. Uncheck “Notify people” (the service account doesn’t read email).
6. Click **Share** / **Send**.

After sharing, run again:

```bash
node scripts/01-conference-hunter.js
```

---

## Optional: Print your service account email

To see the `client_email` from your current credentials (env or JSON):

```bash
node -e "
require('dotenv').config({ path: '.env' });
const path = require('path');
const credPath = path.resolve(process.cwd(), 'config', 'credentials-config.js');
const { getGoogleSheetsCredentials } = require(credPath);
const c = getGoogleSheetsCredentials();
console.log('Share your sheet with this email:', c.client_email);
"
```
