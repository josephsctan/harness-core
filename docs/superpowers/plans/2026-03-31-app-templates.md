# App Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `templates/python-react-web-app` template to harness-core that an agent can apply to a blank project repo to stand up a working FastAPI + React/Vite skeleton with a self-running bootstrap.

**Architecture:** Instruction-driven template — `APPLY.md` is the agent's script, scaffold files are its raw materials. The agent reads `APPLY.md`, copies files, and runs the bootstrap plan autonomously via `execute-chunk.js` without any human approval gate. The bootstrap plan uses the v0.7.0 `init-worker.ps1` pattern — Chunk 1 writes it, and `execute-chunk.js` runs it automatically before every subsequent chunk.

**Tech Stack:** FastAPI + uvicorn (backend), React 18 + Vite (frontend), PowerShell (init-worker.ps1), harness execute-chunk.js pipeline.

**Spec:** `docs/superpowers/specs/2026-03-31-app-templates-design.md`

---

## File Map

**Create:**
- `templates/python-react-web-app/APPLY.md` — agent instruction script for applying the template
- `templates/python-react-web-app/docs/TECH.md` — tech stack reference (copied to project `docs/TECH.md`)
- `templates/python-react-web-app/scaffold/backend/main.py` — FastAPI app with `/api/health`
- `templates/python-react-web-app/scaffold/backend/requirements.txt` — fastapi, uvicorn, pytest, httpx
- `templates/python-react-web-app/scaffold/backend/.env.example` — CORS_ORIGIN placeholder
- `templates/python-react-web-app/scaffold/backend/.gitignore` — ignores `.venv/`
- `templates/python-react-web-app/scaffold/frontend/package.json` — react, react-dom, vite, vitest
- `templates/python-react-web-app/scaffold/frontend/vite.config.js` — dev proxy `/api` → `localhost:8000`
- `templates/python-react-web-app/scaffold/frontend/index.html` — Vite entry point
- `templates/python-react-web-app/scaffold/frontend/src/main.jsx` — React root mount
- `templates/python-react-web-app/scaffold/frontend/src/App.jsx` — health-check ping component
- `templates/python-react-web-app/bootstrap-plan.md` — 3-chunk harness plan for bootstrapping

**Modify:**
- `AGENTS.md` — add Templates section referencing `templates/`
- `CHANGELOG.md` — document v0.8.0 with templates feature
- `VERSION` — bump to `0.8.0`

---

## Task 1: Template directory and APPLY.md

**Files:**
- Create: `templates/python-react-web-app/APPLY.md`

- [ ] **Create the directory structure**

```bash
mkdir -p "c:/JST/Repos/harnessed-icas/harness-core/templates/python-react-web-app/docs"
mkdir -p "c:/JST/Repos/harnessed-icas/harness-core/templates/python-react-web-app/scaffold/backend"
mkdir -p "c:/JST/Repos/harnessed-icas/harness-core/templates/python-react-web-app/scaffold/frontend/src"
```

- [ ] **Write `templates/python-react-web-app/APPLY.md`**

```markdown
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

### Step 4 — Update AGENTS.md

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
git add src/ docs/TECH.md plans/2.active/bootstrap.md AGENTS.md
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
```

- [ ] **Verify the file was written correctly**

```bash
grep -c "Step [0-9]" "c:/JST/Repos/harnessed-icas/harness-core/templates/python-react-web-app/APPLY.md"
```

Expected output: `8` (8 numbered steps)

- [ ] **Commit**

```bash
cd "c:/JST/Repos/harnessed-icas/harness-core"
git add templates/python-react-web-app/APPLY.md
git commit -m "feat: add APPLY.md for python-react-web-app template"
```

---

## Task 2: TECH.md

**Files:**
- Create: `templates/python-react-web-app/docs/TECH.md`

- [ ] **Write `templates/python-react-web-app/docs/TECH.md`**

```markdown
# Tech Stack Reference

This file is the authoritative reference for all agents working in this project.
Read it at the start of every session before writing any code.

---

## Backend

- **Language:** Python 3.11+
- **Framework:** FastAPI
- **Server:** uvicorn
- **Entry point:** `src/backend/main.py`
- **Virtual env:** `src/backend/.venv/` (gitignored)

**Run (from repo root):**
```bash
cd src/backend && ../.venv/Scripts/uvicorn main:app --reload --port 8000   # Windows
cd src/backend && ../.venv/bin/uvicorn main:app --reload --port 8000        # Unix
```

**Install deps (from repo root):**
```bash
src/backend/.venv/Scripts/pip install -r src/backend/requirements.txt   # Windows
src/backend/.venv/bin/pip install -r src/backend/requirements.txt        # Unix
```

**Run tests (from repo root):**
```bash
src/backend/.venv/Scripts/pytest src/backend/tests/   # Windows
src/backend/.venv/bin/pytest src/backend/tests/        # Unix
```

---

## Frontend

- **Language:** JavaScript (JSX)
- **Framework:** React 18
- **Build tool:** Vite 5
- **Entry point:** `src/frontend/src/main.jsx`
- **Dev port:** 5173

**Run (from repo root):**
```bash
npm run dev --prefix src/frontend
```

**Install deps (from repo root):**
```bash
npm install --prefix src/frontend
```

**Run unit tests (from repo root):**
```bash
npm run test --prefix src/frontend
```

**Run e2e tests (from repo root):**
```bash
npx playwright test
```

---

## API Proxy (dev only)

Vite proxies `/api/*` → `http://localhost:8000` in development.
No CORS configuration is needed for local development.

In production, set `CORS_ORIGIN` on the backend to the deployed frontend URL.

---

## Env Vars

| Var | Service | Default | Purpose |
|-----|---------|---------|---------|
| `CORS_ORIGIN` | backend | `http://localhost:5173` | Allowed CORS origin |

`.env` is gitignored. `.env.example` is committed with placeholder values.
Copy `.env.example` to `.env` and fill in values before running.

---

## Conventions

- All backend routes are prefixed `/api/` — e.g. `/api/health`, `/api/questions`
- Frontend fetches via relative paths (`/api/...`) only — never hardcoded ports or hostnames
- Backend tests live in `src/backend/tests/`
- Frontend unit tests live alongside source files (`*.test.jsx`)
- E2E tests live in `e2e/` at the repo root
```

- [ ] **Verify file exists**

```bash
ls "c:/JST/Repos/harnessed-icas/harness-core/templates/python-react-web-app/docs/TECH.md"
```

- [ ] **Commit**

```bash
cd "c:/JST/Repos/harnessed-icas/harness-core"
git add templates/python-react-web-app/docs/TECH.md
git commit -m "feat: add TECH.md for python-react-web-app template"
```

---

## Task 3: Backend scaffold files

**Files:**
- Create: `templates/python-react-web-app/scaffold/backend/main.py`
- Create: `templates/python-react-web-app/scaffold/backend/requirements.txt`
- Create: `templates/python-react-web-app/scaffold/backend/.env.example`
- Create: `templates/python-react-web-app/scaffold/backend/.gitignore`

- [ ] **Write `scaffold/backend/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Write `scaffold/backend/requirements.txt`**

```
fastapi==0.115.0
uvicorn[standard]==0.32.0
pytest==8.3.0
httpx==0.27.0
```

- [ ] **Write `scaffold/backend/.env.example`**

```
CORS_ORIGIN=http://localhost:5173
```

- [ ] **Write `scaffold/backend/.gitignore`**

```
.venv/
__pycache__/
*.pyc
.env
```

- [ ] **Verify all four files exist**

```bash
ls "c:/JST/Repos/harnessed-icas/harness-core/templates/python-react-web-app/scaffold/backend/"
```

Expected: `.env.example  .gitignore  main.py  requirements.txt`

- [ ] **Commit**

```bash
cd "c:/JST/Repos/harnessed-icas/harness-core"
git add templates/python-react-web-app/scaffold/backend/
git commit -m "feat: add backend scaffold for python-react-web-app template"
```

---

## Task 4: Frontend scaffold files

**Files:**
- Create: `templates/python-react-web-app/scaffold/frontend/package.json`
- Create: `templates/python-react-web-app/scaffold/frontend/vite.config.js`
- Create: `templates/python-react-web-app/scaffold/frontend/index.html`
- Create: `templates/python-react-web-app/scaffold/frontend/src/main.jsx`
- Create: `templates/python-react-web-app/scaffold/frontend/src/App.jsx`

- [ ] **Write `scaffold/frontend/package.json`**

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Write `scaffold/frontend/vite.config.js`**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Write `scaffold/frontend/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Write `scaffold/frontend/src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Write `scaffold/frontend/src/App.jsx`**

```jsx
import { useEffect, useState } from 'react'

function App() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'error' }))
  }, [])

  return (
    <div>
      <h1>App</h1>
      <p>API status: {health ? health.status : 'checking...'}</p>
    </div>
  )
}

export default App
```

- [ ] **Verify all five files exist**

```bash
ls "c:/JST/Repos/harnessed-icas/harness-core/templates/python-react-web-app/scaffold/frontend/src/"
```

Expected: `App.jsx  main.jsx`

- [ ] **Commit**

```bash
cd "c:/JST/Repos/harnessed-icas/harness-core"
git add templates/python-react-web-app/scaffold/frontend/
git commit -m "feat: add frontend scaffold for python-react-web-app template"
```

---

## Task 5: Bootstrap plan

**Files:**
- Create: `templates/python-react-web-app/bootstrap-plan.md`

The bootstrap plan uses the harness chunk format (executed via `execute-chunk.js`).
Chunk 1 writes `init-worker.ps1` at the project root. `execute-chunk.js` (v0.7.0)
automatically runs `init-worker.ps1` before each chunk — the plan steps do not need
to call it explicitly.

- [ ] **Write `templates/python-react-web-app/bootstrap-plan.md`**

````markdown
# Bootstrap — python-react-web-app

branch: main
status: in-progress
started: <!-- YYYY-MM-DD — set when template is applied -->

## Goal

Stand up the Python FastAPI backend and React/Vite frontend so both services start
cleanly and the Vite proxy can reach the backend health endpoint.

This plan is infrastructure — not a feature. It has no PBI and is deleted on completion.

## Chunk Template

Each chunk ends with:

```
- [ ] **Write handoff note and stop**

Write runs/next-chunk.md:
  plan: plans/2.active/bootstrap.md
  completed: Chunk N — <name>
  status: success
  next: Chunk N+1 — <name>   (or "all done" for the final chunk)

  ## What was done
  [summary]

Stop — do not start the next chunk.
```

---

## Chunk 1 — Backend setup

- [ ] Create Python virtual environment at `src/backend/.venv`:

```bash
python -m venv src/backend/.venv
```

- [ ] Install backend dependencies:

```bash
# Windows (Git Bash)
src/backend/.venv/Scripts/pip install -r src/backend/requirements.txt

# Unix / macOS
# src/backend/.venv/bin/pip install -r src/backend/requirements.txt
```

Verify: output ends with `Successfully installed fastapi-0.115.0 uvicorn-...`

- [ ] Copy `.env.example` to `.env` in `src/backend/`:

```bash
cp src/backend/.env.example src/backend/.env
```

- [ ] Write `init-worker.ps1` at repo root:

```powershell
# init-worker.ps1 — auto-run by harness before each chunk
# Restores the development environment to a known state.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "cwd: $(Get-Location)"

if (-not (Test-Path "src/backend")) { Write-Error "Run from project repo root"; exit 1 }
if (-not (Test-Path "src/frontend")) { Write-Error "Run from project repo root"; exit 1 }

Write-Host "Installing backend deps..."
src/backend/.venv/Scripts/pip install -r src/backend/requirements.txt --quiet

Write-Host "Installing frontend deps..."
npm install --prefix src/frontend --silent

Write-Host "Environment ready."
```

- [ ] Start uvicorn in the background and verify the health endpoint:

```bash
cd src/backend
../.venv/Scripts/uvicorn main:app --port 8000 &
UVICORN_PID=$!
sleep 3
curl -sf http://localhost:8000/api/health
kill $UVICORN_PID
cd ../..
```

Expected curl output: `{"status":"ok"}`

If curl fails, check that uvicorn started: `curl http://localhost:8000/api/health` without `-sf` for verbose error.

- [ ] Commit:

```bash
git add src/backend/.env src/backend/.gitignore init-worker.ps1
git commit -m "chore: bootstrap backend — venv, deps, init-worker.ps1"
```

- [ ] **Write handoff note and stop**

Write `runs/next-chunk.md`:
```
plan: plans/2.active/bootstrap.md
completed: Chunk 1 — Backend setup
status: success
next: Chunk 2 — Frontend setup

## What was done
Created Python venv at src/backend/.venv, installed FastAPI + uvicorn,
verified /api/health returns {"status":"ok"}, wrote init-worker.ps1.
```

Stop — do not start Chunk 2.

---

## Chunk 2 — Frontend setup

Note: `execute-chunk.js` runs `init-worker.ps1` automatically before this chunk starts.

- [ ] Install frontend dependencies:

```bash
npm install --prefix src/frontend
```

Verify: ends with `added NNN packages` with no errors.

- [ ] Start the Vite dev server in the background and verify it serves:

```bash
npm run dev --prefix src/frontend &
VITE_PID=$!
sleep 5
curl -sf -o /dev/null -w "%{http_code}" http://localhost:5173/
kill $VITE_PID
```

Expected output: `200`

- [ ] Commit:

```bash
git add src/frontend/node_modules/.package-lock.json src/frontend/package-lock.json
# Stage only the lock file — node_modules is gitignored
git add src/frontend/package-lock.json
git commit -m "chore: bootstrap frontend — npm install"
```

Note: `node_modules/` is already excluded by `.gitignore`. Only `package-lock.json` is committed.

- [ ] **Write handoff note and stop**

Write `runs/next-chunk.md`:
```
plan: plans/2.active/bootstrap.md
completed: Chunk 2 — Frontend setup
status: success
next: Chunk 3 — Verify and finalise

## What was done
Ran npm install for React/Vite frontend, verified Vite dev server
starts and returns HTTP 200 on localhost:5173.
```

Stop — do not start Chunk 3.

---

## Chunk 3 — Verify and finalise

Note: `execute-chunk.js` runs `init-worker.ps1` automatically before this chunk starts.

- [ ] Start both services:

```bash
cd src/backend && ../.venv/Scripts/uvicorn main:app --port 8000 &
UVICORN_PID=$!
cd ../..

npm run dev --prefix src/frontend &
VITE_PID=$!

sleep 5
```

- [ ] Verify the frontend proxy reaches the backend:

```bash
curl -sf http://localhost:5173/api/health
```

Expected output: `{"status":"ok"}`

This confirms: Vite is running, it proxies `/api/*` to uvicorn, and uvicorn is running.

- [ ] Stop both services:

```bash
kill $UVICORN_PID $VITE_PID
```

- [ ] Delete the bootstrap plan (it is infrastructure, not a feature):

```bash
rm plans/2.active/bootstrap.md
```

- [ ] Commit:

```bash
git add -A
git commit -m "chore: bootstrap complete — backend and frontend verified"
```

- [ ] **Write handoff note and stop**

Write `runs/next-chunk.md`:
```
plan: plans/2.active/bootstrap.md
completed: Chunk 3 — Verify and finalise
status: success
next: all done

## What was done
Started uvicorn (port 8000) and Vite (port 5173) together.
Verified Vite proxy: GET /api/health via localhost:5173 returned {"status":"ok"}.
Deleted plans/2.active/bootstrap.md. Project is ready for PBI-100.
```
````

- [ ] **Verify the file was written**

```bash
grep -c "## Chunk" "c:/JST/Repos/harnessed-icas/harness-core/templates/python-react-web-app/bootstrap-plan.md"
```

Expected: `3`

- [ ] **Commit**

```bash
cd "c:/JST/Repos/harnessed-icas/harness-core"
git add templates/python-react-web-app/bootstrap-plan.md
git commit -m "feat: add bootstrap-plan.md for python-react-web-app template"
```

---

## Task 6: Update AGENTS.md, CHANGELOG, VERSION

**Files:**
- Modify: `AGENTS.md`
- Modify: `CHANGELOG.md`
- Modify: `VERSION`

- [ ] **Add Templates section to `AGENTS.md`**

In `AGENTS.md`, add a new row to the Key Harness Docs table:

```markdown
| [templates/](templates/) | App templates — scaffold + bootstrap plans for new projects |
```

Then add a new section after the Key Harness Docs table:

```markdown
## Templates

App templates live in `templates/<template-name>/`. Each template contains:
- `APPLY.md` — step-by-step instructions for the agent to apply the template
- `docs/TECH.md` — tech stack reference (copied to the project's `docs/TECH.md`)
- `scaffold/` — starter source files
- `bootstrap-plan.md` — 3-chunk plan to stand up the app (run via `execute-chunk.js`)

**To apply a template**, the human says "apply the <template-name> template" and the
agent reads `../harness-core/templates/<template-name>/APPLY.md` and follows the steps.

Available templates:
| Template | Stack |
|----------|-------|
| [python-react-web-app](templates/python-react-web-app/) | FastAPI + React/Vite |
```

- [ ] **Verify AGENTS.md was updated**

```bash
grep -c "Templates" "c:/JST/Repos/harnessed-icas/harness-core/AGENTS.md"
```

Expected: at least `2`

- [ ] **Prepend v0.8.0 entry to `CHANGELOG.md`**

Add the following block at the top of the changelog (after the `# Harness Changelog` heading):

```markdown
## 0.8.0 — 2026-04-01

Added app templates system:

- `templates/python-react-web-app/` — first app template: FastAPI backend + React/Vite frontend
  - `APPLY.md`: agent instruction script; copies scaffold, runs bootstrap autonomously
  - `docs/TECH.md`: tech stack reference for all future agent sessions in the project
  - `scaffold/backend/`: FastAPI hello-world with `/api/health`, requirements.txt, .env.example
  - `scaffold/frontend/`: React 18 + Vite, dev proxy to backend, health-check component
  - `bootstrap-plan.md`: 3-chunk harness plan — backend setup, frontend setup, verify + finalise; uses v0.7.0 init-worker.ps1 pattern
- `AGENTS.md`: added Templates section with available templates table

```

- [ ] **Update `VERSION` to `0.8.0`**

Replace the contents of `VERSION` with:

```
0.8.0
```

- [ ] **Run existing tests to confirm nothing is broken**

```bash
cd "c:/JST/Repos/harnessed-icas/harness-core"
npm test
```

Expected: all tests pass (jsonrpc + session-log test suites).

- [ ] **Commit all**

```bash
cd "c:/JST/Repos/harnessed-icas/harness-core"
git add AGENTS.md CHANGELOG.md VERSION
git commit -m "feat: v0.8.0 — app templates system with python-react-web-app"
```

---

## Self-Review

**Spec coverage check:**
- ✅ `templates/python-react-web-app/` folder structure — Tasks 1–5
- ✅ `APPLY.md` with 8 steps including autonomous bootstrap execution — Task 1
- ✅ `TECH.md` with run commands, test commands, env vars, conventions — Task 2
- ✅ Backend scaffold (main.py, requirements.txt, .env.example, .gitignore) — Task 3
- ✅ Frontend scaffold (package.json, vite.config.js, index.html, main.jsx, App.jsx) — Task 4
- ✅ Bootstrap plan with 3 chunks + init-worker.ps1 (v0.7.0 pattern) — Task 5
- ✅ AGENTS.md updated with Templates section — Task 6
- ✅ CHANGELOG + VERSION bumped to 0.8.0 — Task 6
- ✅ No PBI created, bootstrap plan deleted on completion — baked into APPLY.md Step 7 and Chunk 3
- ✅ Agent tells human "App is ready" after completion — APPLY.md Step 8

**No placeholders found.** All steps contain complete file contents or exact commands.

**Type consistency:** No cross-task type references — each task is self-contained file creation.
