# App Templates — Design Spec

date: 2026-03-31
status: approved

## Overview

harness-core gains an `app templates` capability. A template is a self-contained
package that an agent can apply to a blank project repo to stand up a working
application skeleton — scaffold files, tech-stack docs, and a bootstrap plan —
without any PBI or approval gate.

The first template is `python-react-web-app`: a FastAPI backend + React/Vite frontend.

---

## Template Location

Templates live in harness-core at:

```
harness-core/templates/<template-name>/
```

Each template is self-contained. Adding a new template is adding a new folder —
no harness-core scripts need changing.

---

## Template Structure

```
harness-core/templates/python-react-web-app/
  APPLY.md                        ← step-by-step instructions for the agent
  docs/
    TECH.md                       ← copied to project docs/TECH.md on apply
  scaffold/
    backend/
      main.py                     ← FastAPI app with GET /api/health
      requirements.txt            ← fastapi, uvicorn[standard], pytest
      .env.example                ← CORS_ORIGIN=http://localhost:5173
    frontend/
      package.json                ← react, react-dom, vite
      vite.config.js              ← dev proxy: /api → http://localhost:8000
      index.html
      src/
        main.jsx
        App.jsx                   ← renders health-check ping to /api/health
  bootstrap-plan.md               ← plan copied to plans/2.active/bootstrap.md
```

---

## How a Template Is Applied

The human says: **"apply the python-react-web-app template"** (or similar).

The agent:

1. Reads `../harness-core/templates/python-react-web-app/APPLY.md`
2. Copies `scaffold/backend/` → `src/backend/`
3. Copies `scaffold/frontend/` → `src/frontend/`
4. Copies `docs/TECH.md` → `docs/TECH.md`
5. Appends a "Tech Stack" section to `AGENTS.md` that references `docs/TECH.md`
6. Copies `bootstrap-plan.md` → `plans/2.active/bootstrap.md`
7. Commits all scaffold files: `chore: apply python-react-web-app template`
8. Runs the bootstrap plan autonomously (chunks via `execute-chunk.js`) until complete
9. Deletes `plans/2.active/bootstrap.md`, commits
10. Tells the human: "App is ready. Backend and frontend are verified running."

No PBI is created. No human approval is required between steps. This is
infrastructure setup, not a feature.

---

## Bootstrap Plan Chunks

The bootstrap plan (`bootstrap-plan.md`) has three chunks:

### Chunk 1 — Backend setup
- Create Python venv at `src/backend/.venv`
- Install dependencies from `requirements.txt`
- Start uvicorn, verify `GET /api/health` returns HTTP 200
- Stop uvicorn
- Commit: `chore: bootstrap backend`

### Chunk 2 — Frontend setup
- `npm install` in `src/frontend/`
- Start Vite dev server, verify it serves on `localhost:5173`
- Stop Vite
- Commit: `chore: bootstrap frontend`

### Chunk 3 — Verify and finalise
- Start both services (uvicorn in background, Vite in background)
- Verify `/api/health` is reachable via the Vite proxy (`http://localhost:5173/api/health`)
- Stop both services
- Delete `plans/2.active/bootstrap.md`
- Commit: `chore: bootstrap complete`

---

## TECH.md Content (copied to project)

`docs/TECH.md` documents the stack for all future agents working in the project:

**Backend**
- Python 3.11+, FastAPI, uvicorn
- Entry point: `src/backend/main.py`
- Run: `uvicorn main:app --reload --port 8000` (from `src/backend/`)
- Tests: pytest

**Frontend**
- React 18, Vite
- Entry point: `src/frontend/src/main.jsx`
- Run: `npm run dev` (from `src/frontend/`, port 5173)
- Tests: Vitest (unit), Playwright (e2e)

**API proxy**
- Vite proxies `/api/*` → `http://localhost:8000` in dev
- No CORS configuration needed in dev
- Production CORS controlled by `CORS_ORIGIN` env var on the backend

**Env vars**
- `CORS_ORIGIN` — backend allowed origin (default: `http://localhost:5173`)
- `VITE_API_BASE` — frontend API base path (optional, default: `/api`)

**Conventions**
- All backend routes prefixed `/api/`
- Frontend fetches via relative `/api/` paths only — never hardcoded ports
- `.env` is gitignored; `.env.example` is committed with placeholder values

---

## What Is NOT in Scope

- No Docker or containerisation (future template or PBI)
- No authentication scaffold (first real PBI for the project)
- No database setup (first real PBI for the project)
- No production build / deployment config
- No additional templates beyond `python-react-web-app`
