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
