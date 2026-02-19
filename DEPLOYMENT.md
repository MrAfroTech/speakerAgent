# Deployment Guide – Speaking Workflows (GitHub Actions)

This guide covers deploying the speaking-opportunity automation (scripts 01–12) via GitHub Actions.

---

## 1. Repo layout and workflow location

- Scripts and app code live in **`aiAgents/workflows-speaking-production/`**.
- Scripts expect **`aiAgents/.env`** and **`aiAgents/credentials/google-sheets-service-account.json`** (paths are relative to the **repository root**).
- GitHub only runs workflows from the **repository root**: **`.github/workflows/`** at the root. The workflow files in this directory are the source of truth; they must exist at **repo root** to run.

**If this folder is the repo root** (e.g. a repo that contains only this app):

- Copy or move the contents of **`workflows-speaking-production/.github/workflows/`** to **`.github/workflows/`** at the repo root.
- Adjust workflow paths: use **`.`** as the app directory (no `aiAgents/workflows-speaking-production`), create **`.env`** in the repo root and **`./credentials/google-sheets-service-account.json`** (and ensure scripts/load-env paths match).

**If the repo root is the parent** (e.g. `SeamlessMarketplace`):

- Copy the workflow files from **`aiAgents/workflows-speaking-production/.github/workflows/`** to **`<repo-root>/.github/workflows/`**.
- Keep the paths as in the checked-in workflows: **`aiAgents/.env`**, **`aiAgents/credentials/`**, **`aiAgents/workflows-speaking-production`** for install and script runs.

---

## 2. Setup steps

### 2.1 Clone and install

```bash
git clone <your-repo-url>
cd <repo-root>
cd aiAgents/workflows-speaking-production
npm install
```

Commit **`package-lock.json`** so CI can run **`npm ci`**.

### 2.2 Environment and credentials (local)

- Copy **`.env.example`** to **`aiAgents/.env`** (one level up from `workflows-speaking-production`).
- Fill in real values (see [GitHub Secrets](#3-github-secrets-configuration) for the same variable names).
- Place your Google Sheets service account JSON at **`aiAgents/credentials/google-sheets-service-account.json`**.

Do **not** commit **`.env`** or **`credentials/`**; they are in **`.gitignore`**.

### 2.3 Google Sheet

- Create a Google Sheet and share it with the service account email from the JSON.
- Create the sheets and columns expected by the scripts (see **METRICS_SHEET_SETUP.md** and **scripts/README.md**).
- Put the Sheet ID into **`SPREADSHEET_ID`** in **`.env`** and in the **SPREADSHEET_ID** GitHub secret.

---

## 3. GitHub Secrets configuration

In the repo: **Settings → Secrets and variables → Actions**, add:

| Secret name | Description |
|-------------|-------------|
| `SPREADSHEET_ID` | Google Sheet ID (from the sheet URL). |
| `BREVO_API_KEY` | Brevo API key (e.g. `xkeysib-...`) for email sending. |
| `ANTHROPIC_API_KEY` | Anthropic API key (e.g. `sk-ant-...`) for pitch/LinkedIn copy. |
| `SERPAPI_API_KEY` | SerpAPI key for discovery scripts (01–04). |
| `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` | **Full contents** of `google-sheets-service-account.json` (single-line or multi-line; the workflow writes it to a file). |

Workflows create **`aiAgents/.env`** and **`aiAgents/credentials/google-sheets-service-account.json`** from these secrets at run time and remove them in a cleanup step.

---

## 4. Workflows and schedules

| Workflow | Schedule | Scripts |
|----------|----------|--------|
| **Discovery (weekly)** | Mondays 6:00 AM UTC | 01–06 (conference hunter, university, podcast, association, contact finder, quality scorer) |
| **Daily outreach** | Daily 9:00 AM UTC | 07–08 (pitch writer, email outreach) |
| **Daily follow-ups** | Daily 9:30 AM UTC | 11 (follow-up sequence) |
| **Response parser** | Manual only | Placeholder (script 12; Gmail not implemented yet) |

All use **ubuntu-latest**, **Node.js 20**, **npm ci**, and the same secret setup/cleanup pattern.

---

## 5. Testing

### 5.1 Local

```bash
cd aiAgents/workflows-speaking-production
npm ci
node scripts/01-conference-hunter.js
# … run other scripts as needed
```

Ensure **`aiAgents/.env`** and **`aiAgents/credentials/google-sheets-service-account.json`** exist and the sheet is set up.

### 5.2 GitHub Actions

- **Manual run:** **Actions** tab → select a workflow → **Run workflow**.
- Confirm the job creates `.env` and credentials, runs the right scripts, and cleanup runs (even on failure).

---

## 6. Troubleshooting

| Issue | What to check |
|-------|----------------|
| **Workflow not showing** | Workflows must live in **repo root** **`.github/workflows/`**. Copy from **`aiAgents/workflows-speaking-production/.github/workflows/`** if this app is in a subfolder. |
| **“Credentials not found”** | Secret **GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON** must be set and contain valid JSON. Workflow writes it to **`aiAgents/credentials/google-sheets-service-account.json`**. |
| **“SPREADSHEET_ID not set”** | **SPREADSHEET_ID** secret and **`.env`** step in the workflow. Ensure the “Create .env from secrets” step runs and uses the same variable name. |
| **npm ci fails** | Commit **`package-lock.json`** (run **`npm install`** in **`aiAgents/workflows-speaking-production`** and commit the new lock file). |
| **Script fails with module error** | Runs must use **working-directory: aiAgents/workflows-speaking-production** so **node scripts/…** and **require** paths resolve. |
| **Cleanup not running** | Cleanup step uses **if: always()** so it runs on success or failure. If secrets still appear in logs, ensure no step echoes secrets. |

---

## 7. Security

- Never commit **`.env`**, **`.env.local`**, or **`credentials/`**.
- Use GitHub Secrets for all keys and the service account JSON.
- Workflows delete **`aiAgents/.env`** and **`aiAgents/credentials/google-sheets-service-account.json`** in a final step so they are not left on the runner.
