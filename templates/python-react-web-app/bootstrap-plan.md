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

If curl fails: `curl http://localhost:8000/api/health` without `-sf` for verbose error.

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
git add src/frontend/package-lock.json
git commit -m "chore: bootstrap frontend — npm install"
```

Note: `node_modules/` is excluded by `.gitignore`. Only `package-lock.json` is committed.

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
