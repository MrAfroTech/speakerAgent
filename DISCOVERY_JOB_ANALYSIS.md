# Discovery Job A-to-Z Analysis

Based on the last GitHub Actions run:
- Conference Hunter: 4 | University Prospector: 2 | Podcast Finder: 4 | Association Scanner: 2 (HFTP not fetched)
- Organizer Contact Finder: 0 updated | Event Quality Scorer: 0 scored

---

## 1. Where the 12 rows were written

### Spreadsheet ID at runtime
- **Source:** Environment variable `SPREADSHEET_ID` only (no config file, not hardcoded).
- **In CI:** GitHub Actions writes it from the repo secret into `.env` in the “Create .env from secrets” step:
  ```yaml
  echo "SPREADSHEET_ID=${{ secrets.SPREADSHEET_ID }}" >> .env
  ```
- **Resolved in code:** `scripts/lib/sheet-client.js`:
  ```js
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!spreadsheetId || spreadsheetId === 'PASTE_YOUR_SPREADSHEET_ID_HERE') {
    throw new Error('Set SPREADSHEET_ID in .env to your Google Sheet ID');
  }
  ```
- So the **exact spreadsheet used** is whatever is stored in **GitHub → Settings → Secrets and variables → Actions → SPREADSHEET_ID**.

### Sheet/tab name
- All four scripts write to the **Opportunities** sheet:
  ```js
  const sheet = await getSheet('Opportunities');
  ```
- `getSheet('Opportunities')` in `sheet-client.js` uses `d.sheetsByTitle['Opportunities']`. The tab name must match exactly (case-sensitive).

### Exact write calls (appendRow / addRow)
- The codebase uses the **google-spreadsheet** library: there is no raw `appendRow`; all writes go through **`sheet.addRow({ ... })`** with an object whose keys must match the **first row (header row)** of the Opportunities sheet.

| Script | File | Exact call |
|--------|------|------------|
| **01 Conference Hunter** | `scripts/01-conference-hunter.js` | `await sheet.addRow({ id, event_name, event_type, event_date, location, url: c.link, description, organizer_name, organizer_email: '', ... quality_score: '', source: 'Conference Hunter', ... });` |
| **02 University Prospector** | `scripts/02-university-prospector.js` | `await sheet.addRow({ id, event_name, event_type, ... url: r.link, ... organizer_email: '', ... quality_score: '', source: 'University Prospector', ... });` |
| **03 Podcast Finder** | `scripts/03-podcast-finder.js` | `await sheet.addRow({ id, event_name, event_type, ... url: r.link, ... organizer_email: '', ... quality_score: '', source: 'Podcast Finder', ... });` |
| **04 Association Scanner** | `scripts/04-association-scanner.js` | `await sheet.addRow({ id: sheet.rowCount + 1, event_name: \`${assoc.name} - Events\`, ... url: assoc.url, ... organizer_email: '', ... quality_score: '', source: 'Association Scanner', ... });` |

So: **spreadsheet** = `process.env.SPREADSHEET_ID`, **sheet** = `'Opportunities'`, **write** = `sheet.addRow({...})` in each of 01–04. All four explicitly set `url` and leave `organizer_email` and `quality_score` empty.

---

## 2. Why Organizer Contact Finder updated 0 opportunities

### Condition to enrich a row
- Script: `scripts/05-organizer-contact-finder.js`.
- It only processes a row when: **no organizer email yet** and **URL present**.
- Exact logic:
  ```js
  for (const row of rows) {
    const email = row.get('organizer_email');
    const url = row.get('url');
    if (email || !url) continue;
    // ... fetch(url), scrape email, row.set('organizer_email', ...), row.save()
  }
  ```
- So: **enrich** ⇔ `organizer_email` is empty and `url` is non-empty. It also stops after 10 updates.

### Did rows from 01–04 have URL populated?
- **In code, yes.** All four scripts pass a `url` into `addRow`:
  - 01: `url: c.link`
  - 02: `url: r.link`
  - 03: `url: r.link`
  - 04: `url: assoc.url`
- So the **intended** row shape has `url` set. Whether the sheet **actually** has a column that matches the key `url` depends on the **header row** of the Opportunities sheet. The library maps object keys to columns by the **exact header string** in row 1. If the sheet uses a different header (e.g. `Event URL` or `URL` with different casing), then:
  - `addRow` might still write into that column (if the library normalizes), or into a new column named `url`.
  - `row.get('url')` in script 05 would then return `undefined` for the column that actually has the link, so `!url` is true and the row is **skipped**.

### Other possible reasons for 0 updates
- **Fetch failed** for every URL (network, 403, timeout): then no email is found and no row is updated.
- **No email in HTML**: the script uses a simple regex on the page body; if no match, it doesn’t set `organizer_email`.
- **Header mismatch** (as above): `row.get('url')` is undefined, so all new rows are skipped.

---

## 3. Why Event Quality Scorer scored 0 opportunities

### Condition to score a row
- Script: `scripts/06-event-quality-scorer.js`.
- It only scores a row when: **no quality score yet** and **organizer email present**.
- Exact logic:
  ```js
  for (const row of rows) {
    const currentScore = row.get('quality_score');
    if (currentScore !== '' && currentScore !== undefined && currentScore !== null) continue;
    const email = row.get('organizer_email');
    if (!email) continue;
    const { score, status } = scoreOpportunity(row);
    row.set('quality_score', score);
    row.set('status', status);
    await row.save();
    scored++;
  }
  ```
- So: **score row** ⇔ `quality_score` is empty and `organizer_email` is non-empty.

### Did rows from 01–04 meet that?
- **No.** Scripts 01–04 set `organizer_email: ''`. The only step that fills `organizer_email` is **Organizer Contact Finder (05)**. Since 05 updated **0** rows, no row gained an organizer email, so 06 correctly **skips every row** and scores 0. So the pipeline is behaving as coded: 06 depends on 05 having run successfully on the same rows.

---

## 4. Checking what is actually in the sheet

- The **spreadsheet ID** used in CI is the one in **GitHub Actions secret** `SPREADSHEET_ID`; we can’t read your sheet from here.
- You can **read the Opportunities tab locally** with the same env and credentials the pipeline uses:

  ```bash
  # From repo root, with .env and credentials in place
  node scripts/read-opportunities.js
  ```

- This script:
  - Prints `SPREADSHEET_ID` (from env).
  - Prints the **header row** of the Opportunities sheet.
  - Prints **total data row count**.
  - Prints the **last 20 rows** with: `id`, `event_name`, `source`, `url`, `organizer_email`, `quality_score`.

- What to check:
  1. **Headers:** Is there a column whose header is exactly `url`? (If it’s `Event URL` or `URL`, script 05 may not see it.)
  2. **Last 12 rows:** Do they show the 4+2+4+2 new opportunities with the expected `source` and non-empty `url`?
  3. **`url` and `organizer_email`:** For those 12 rows, does `url` show a value and `organizer_email` show empty? That would confirm 05 *should* have picked them if the header matched.

---

## 5. Diagnosis

- **Pipeline is not broken end-to-end for 01–04.** The 12 rows were written to the sheet identified by `SPREADSHEET_ID` on the **Opportunities** tab via `sheet.addRow(...)` in each script. If the run reported 4+2+4+2 added, those appends succeeded.

- **Scripts 05 and 06 are blocked by data/conditions, not by a generic pipeline failure:**
  - **05 (Organizer Contact Finder):** Updates only rows with **no organizer_email** and **non-empty url**. So either:
    - **Header mismatch:** The Opportunities sheet doesn’t have a column titled exactly `url`, so `row.get('url')` is undefined and every row is skipped, or
    - **Fetch/parse:** All 12 URLs were unfetchable or their HTML didn’t contain an email match, so no row was updated.
  - **06 (Event Quality Scorer):** Scores only rows that **already have organizer_email**. Because 05 updated 0 rows, no row has organizer_email, so 06 correctly scores 0. This is **expected given 05’s result**.

- **Recommended next steps:**
  1. Run `node scripts/read-opportunities.js` (with the same `.env` and credentials you use for discovery) and confirm:
     - Header row includes a column named `url` (or align the code/sheet so 05 reads the correct column).
     - Last 12 rows exist with the right `source` and a populated URL.
  2. If the header for the link column is not `url`, either:
     - Rename the column in the sheet to `url`, or
     - Change script 05 (and any other reader) to use the actual header name (e.g. `Event URL`).
  3. If headers and URL values are correct but 05 still updates 0, add minimal logging in 05: log how many rows have `!email && url` before the loop, and log each URL fetch result (ok/fail, and whether an email was found). That will show whether the bottleneck is row selection vs fetch/parse.

**Summary:** The pipeline wrote the 12 rows correctly. Organizer Contact Finder (05) is the key: it either didn’t see the rows (header mismatch) or couldn’t extract an email from the pages. Event Quality Scorer (06) then had nothing to score because no organizer_email was set.
