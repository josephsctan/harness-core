# Apply: python-react-web-app Template

Read this file completely before taking any action. Execute every step in order.
Do not skip steps. Do not ask for confirmation between steps.

## What this template provides

- `src/backend/` — FastAPI app with `/api/health` endpoint
- `src/frontend/` — React 18 + Vite app, proxies `/api/*` to the backend
- `docs/TECH.md` — tech stack reference for all future agent sessions
- `plans/2.active/bootstrap.md` — 3-chunk bootstrap plan (run autonomously)

## Prerequisites

- Python 3.11+ available as `python` on PATH
- Node.js 18+ and npm available on PATH
- Working directory is the project repo root (e.g. `icas-app/`)
- `../harness-core/` exists as a sibling directory

## Steps

### Step 1 — Copy backend scaffold

```bash
cp -r ../harness-core/templates/python-react-web-app/scaffold/backend/. src/backend/
```

Verify: `src/backend/main.py`, `src/backend/requirements.txt`,
`src/backend/.env.example`, `src/backend/.gitignore` all exist.

### Step 2 — Copy frontend scaffold

```bash
cp -r ../harness-core/templates/python-react-web-app/scaffold/frontend/. src/frontend/
```

Verify: `src/frontend/package.json`, `src/frontend/vite.config.js`,
`src/frontend/index.html`, `src/frontend/src/main.jsx`,
`src/frontend/src/App.jsx` all exist.

### Step 3 — Copy TECH.md

```bash
cp ../harness-core/templates/python-react-web-app/docs/TECH.md docs/TECH.md
```

### Step 4 — Update CLAUDE.md

Add the following section immediately after the `## Application Context` section
(or at the end of the file if that section doesn't exist):

```markdown
## Tech Stack

See [docs/TECH.md](docs/TECH.md) for the full tech stack reference: run commands,
test commands, env vars, and conventions that apply to all PBIs in this project.
```

### Step 5 — Copy bootstrap plan

```bash
cp ../harness-core/templates/python-react-web-app/bootstrap-plan.md plans/2.active/bootstrap.md
```

Update the `started:` field in `plans/2.active/bootstrap.md` frontmatter to today's date (YYYY-MM-DD).

### Step 6 — Commit scaffold

```bash
git add src/ docs/TECH.md plans/2.active/bootstrap.md CLAUDE.md
git commit -m "chore: apply python-react-web-app template"
```

### Step 7 — Run bootstrap plan

Run each chunk in sequence. After each chunk, read `runs/next-chunk.md` and
verify `status: success` before proceeding to the next.

```bash
node ../harness-core/scripts/execute-chunk.js plans/2.active/bootstrap.md "Backend setup"
```

Sleep 30s, tail `runs/last-run.log`, read `runs/next-chunk.md`. If `status: failed`,
read failure notes and retry once. If still failing, stop and tell the human.

```bash
node ../harness-core/scripts/execute-chunk.js plans/2.active/bootstrap.md "Frontend setup"
```

Sleep 30s, tail `runs/last-run.log`, read `runs/next-chunk.md`.

```bash
node ../harness-core/scripts/execute-chunk.js plans/2.active/bootstrap.md "Verify and finalise"
```

Sleep 30s, tail `runs/last-run.log`, read `runs/next-chunk.md`.

### Step 8 — Confirm completion

Read `runs/next-chunk.md`. Verify `status: success` and `next: all done`.

Tell the human:
"App is ready. Backend: http://localhost:8000 — Frontend: http://localhost:5173.
Both services verified running. Start your first PBI with PBI-100."
