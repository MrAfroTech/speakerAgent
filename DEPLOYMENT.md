# Deployment Guide – Speaking Workflows (GitHub Actions)

This guide assumes **project root** is **`workflows-speaking-production/`** (this directory). All paths are relative to this root. Same layout for local runs and GitHub Actions.

---

## 1. Repo layout

- **Project root:** `workflows-speaking-production/` (where you run `npm install` and `node scripts/...`).
- **`.env`** at project root (git-ignored).
- **`credentials/google-sheets-service-account.json`** at project root (git-ignored).
- **`config/credentials-config.js`** at project root (loads credentials from env or `credentials/`).
- **GitHub Actions:** Workflows in **`.github/workflows/`** at repo root. Jobs run from repo root; workflows create `.env` and `credentials/` there.

---

## 2. Setup steps

### 2.1 Clone and install

```bash
git clone <your-repo-url>
cd workflows-speaking-production
npm install
```

Commit **`package-lock.json`** so CI can run **`npm ci`**.

### 2.2 Environment and credentials (local)

- Copy **`.env.example`** to **`.env`** at project root.
- Fill in values (see [GitHub Secrets](#3-github-secrets-configuration) for variable names).
- Place Google Sheets service account JSON at **`credentials/google-sheets-service-account.json`** (or set **`GOOGLE_SHEETS_CLIENT_EMAIL`** and **`GOOGLE_SHEETS_PRIVATE_KEY`** in `.env`).

Do **not** commit **`.env`** or **`credentials/`**; they are in **`.gitignore`**.

### 2.3 Google Sheet

**Option A: Use Google Apps Script (recommended)**

- Copy the function from **`createSpeakingOpportunitiesSheet.gs`** into a new Google Apps Script project.
- Run `createSpeakingOpportunitiesSheet()` to create the sheet with all required tabs.
- Deployment ID: `AKfycbzqyVHzSJKs6Fauj8sjaFBb5YzuueBcfmFa-GacNVC8zxetA2rOY08EsaZs56UwG-gD`
- Share the sheet with the service account email (see **`credentials/google-sheets-service-account.json`** → `client_email`).

**Option B: Manual setup**

- Create a Google Sheet and share it with the service account email.
- Add sheets/columns per **METRICS_SHEET_SETUP.md** and **scripts/README.md**.

**After setup:** Set **`SPREADSHEET_ID`** in **`.env`** and in the **SPREADSHEET_ID** GitHub secret.

---

## 3. GitHub Secrets configuration

In the repo: **Settings → Secrets and variables → Actions**, add:

| Secret name | Description |
|-------------|-------------|
| `SPREADSHEET_ID` | Google Sheet ID (from the sheet URL). |
| `BREVO_API_KEY` | Brevo API key (e.g. `xkeysib-...`) for email sending. |
| `ANTHROPIC_API_KEY` | Anthropic API key (e.g. `sk-ant-...`) for pitch/LinkedIn copy. |
| `SERPAPI_API_KEY` | SerpAPI key for discovery scripts (01–04). |
| `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` | **Full contents** of `google-sheets-service-account.json` (workflow writes it to `credentials/` at run time). |

Workflows create **`.env`** and **`credentials/google-sheets-service-account.json`** at **project root** from these secrets and remove them in cleanup.

---

## 4. Workflows and schedules

| Workflow | Schedule | Scripts |
|----------|----------|--------|
| **Discovery (weekly)** | Mondays 6:00 AM UTC | 01–06 |
| **Daily outreach** | Daily 9:00 AM UTC | 07–08 |
| **Daily follow-ups** | Daily 9:30 AM UTC | 11 |
| **Response parser** | Manual only | Placeholder (script 12) |

All use **ubuntu-latest**, **Node.js 20**, **npm ci**, and run from project root.

---

## 5. Testing

### 5.1 Local

```bash
cd workflows-speaking-production
npm ci
node scripts/01-conference-hunter.js
```

Ensure **`.env`** and **`credentials/google-sheets-service-account.json`** (or env-based credentials) exist at project root.

### 5.2 GitHub Actions

- **Actions** → select workflow → **Run workflow**.
- Jobs run from repo root; `.env` and `credentials/` are created then cleaned up.

---

## 6. Troubleshooting

| Issue | What to check |
|-------|----------------|
| **Workflow not showing** | Workflows must be in **`.github/workflows/`** at repo root. |
| **“Credentials not found”** | Secret **GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON** set with valid JSON. Workflow writes to **`credentials/google-sheets-service-account.json`** at project root. |
| **“SPREADSHEET_ID not set”** | **SPREADSHEET_ID** secret and “Create .env from secrets” step in workflow. |
| **npm ci fails** | Commit **`package-lock.json`** (run **`npm install`** in project root). |
| **Module not found** | All paths use **`process.cwd()`** (project root). Run and deploy from **`workflows-speaking-production/`** as root. |
| **Cleanup not running** | Cleanup step uses **if: always()**. |

---

## 7. Security

- Never commit **`.env`**, **`.env.local`**, or **`credentials/`**.
- Use GitHub Secrets for keys and service account JSON.
- Workflows delete **`.env`** and **`credentials/google-sheets-service-account.json`** at project root in a final step.
