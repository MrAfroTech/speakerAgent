# How to Import CSV Files into Google Sheets (Option 2: Start Fresh)

All 5 CSV files are in **this folder** (`speaking-sheets-import/`). Use them to create your "Speaking Opportunities - Automation" sheet.

## Step 1: Create New Google Sheet

1. Go to: https://sheets.google.com
2. Click **"+ Blank"** to create a new spreadsheet
3. Name it: **"Speaking Opportunities - Automation"**

## Step 2: Import Each CSV File

### Import opportunities.csv (Main Sheet)

1. The default "Sheet1" will become your Opportunities tab
2. **File → Import**
3. **Upload** tab → Select `opportunities.csv` from this folder
4. Import location: **"Replace current sheet"**
5. Separator type: **Comma**
6. Convert text to numbers: **Yes**
7. Click **Import data**
8. Rename "Sheet1" to **"Opportunities"** (right-click tab → Rename)

### Import follow-up-log.csv

1. Click **"+"** at bottom left to create new sheet
2. **File → Import** → Upload `follow-up-log.csv`
3. Import location: **Replace current sheet**
4. Rename sheet to **"Follow-Up Log"**

### Import response-log.csv

1. Create new sheet (click **"+"**)
2. **File → Import** → Upload `response-log.csv`
3. Import location: **Replace current sheet**
4. Rename to **"Response Log"**

### Import error-log.csv

1. Create new sheet (click **"+"**)
2. **File → Import** → Upload `error-log.csv`
3. Import location: **Replace current sheet**
4. Rename to **"Error Log"**

### Import metrics.csv

1. Create new sheet (click **"+"**)
2. **File → Import** → Upload `metrics.csv`
3. Import location: **Replace current sheet**
4. Rename to **"Metrics"**

## Step 3: Format the Opportunities Sheet (optional)

- **View → Freeze → 1 row** (freeze header)
- Format row 1: bold, blue background (#4285F4), white text
- **Column C (event_type):** Data → Data validation → List: `Conference, University, Podcast, Association`
- **Column N (status):** Data → Data validation → List: `New, Qualified, Contacted, Interested, Declined, Booked, No Response`
- Date columns (D, Q, R, T, Z, AA): Format → Number → Date

## Step 4: Share with Service Account

1. Click **Share** (top right)
2. Add: **`second-flame-338521@appspot.gserviceaccount.com`**
3. Permission: **Editor**
4. **Uncheck** "Notify people"
5. Click **Share**

(If you use a different service account, see `credentials/google-sheets-service-account.json` → `client_email`.)

## Step 5: Get Sheet ID and Set SPREADSHEET_ID

1. From the sheet URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
2. Copy the **SHEET_ID** (between `/d/` and `/edit`)
3. Put it in **`.env`** as `SPREADSHEET_ID=...`
4. In GitHub: **Settings → Secrets → Actions** → set **SPREADSHEET_ID** to the same value

## Step 6: Test

From project root:

```bash
node scripts/01-conference-hunter.js
```

Your sheet is ready for the Node.js workflows and GitHub Actions.
