# Setting Up init-worker.ps1 for an Existing Project

If `init-worker.ps1` (or `init-worker.sh`) does not exist at the project root, create it
before starting any chunk work. This is a blocking prerequisite.

---

## What to do

1. **Explore the project** to understand the stack:
   - Read `CLAUDE.md` for tech stack and test commands
   - Read `package.json` / `pyproject.toml` / equivalent for install and test scripts
   - Check `.env.example` or `README` for required env vars

2. **Write `init-worker.ps1`** at the project repo root with the following structure:

   ```powershell
   # init-worker.ps1 — auto-run by harness before each chunk
   # Restores the development environment to a known state.

   Set-StrictMode -Version Latest
   $ErrorActionPreference = 'Stop'

   # 1. Confirm working directory
   Write-Host "cwd: $(Get-Location)"

   # 2. Install / restore dependencies (must be idempotent)
   npm install          # or: pip install -r requirements.txt, dotnet restore, etc.

   # 3. Assert required env vars
   if (-not $env:EXAMPLE_VAR) { Write-Error "EXAMPLE_VAR is not set"; exit 1 }

   # 4. Start background services if needed (comment out if not applicable)
   # Start-Process npm -ArgumentList "run","dev" -NoNewWindow

   # 5. Smoke test — confirm the environment is healthy
   npm test -- --run    # or: pytest -q, dotnet test, etc.
   ```

   Adapt each section to the actual project. Remove sections that don't apply.
   The script must be **idempotent** — safe to run multiple times in a row.

3. **Use `init-worker.sh` instead** if the project runs on Linux/Mac or in a
   container where PowerShell is not available. On Windows with Git Bash, either works —
   prefer `.ps1`.

4. **Commit the file:**
   ```bash
   git add init-worker.ps1
   git commit -m "chore: add init-worker.ps1 for harness session bootstrap"
   ```

5. **Verify it exits 0:**
   ```bash
   pwsh -File init-worker.ps1
   ```
   Fix any errors before proceeding.

---

## Rules

- The script must exit 0 on a clean environment. If it exits non-zero, `execute-chunk.js`
  will abort the chunk and write a `status: failed` handoff note.
- Do not start long-running foreground processes — use background (`Start-Process`) or
  omit if not needed for testing.
- Do not write secrets into the script. Check for env vars; never embed values.
- Keep it fast — this runs before every chunk. If the smoke test is slow, use the
  fastest available test target (e.g. unit tests only, not the full e2e suite).
