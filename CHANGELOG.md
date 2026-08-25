# Harness Changelog

## 0.10.2 — 2026-04-13

### Added

- `docs/workflow.md`: **Two E2E artefacts rule.** Every project with a frontend must
  maintain both a human-readable manifest (`docs/e2e-tests.md`) and machine-executable
  spec files (`src/frontend/e2e/*.spec.ts`). Both accumulate over time. Every
  subsequent acceptance session must run the full manifest (regression) before adding
  new rows/specs for the current chunk.
- `docs/workflow.md`: Updated "What the agent must do" steps to reflect the
  regression requirement and the two-artefact discipline.
- `docs/workflow.md`: Two new rows in the "What NOT To Do" table covering partial
  verification (new flows only) and forgetting to update both artefacts.

---

## 0.10.1 — 2026-04-13

### Added

- `docs/workflow.md`: **Playwright UI Verification** rule. Any chunk that modifies
  frontend code must be verified with Playwright before the handoff note is written.
  Self-reporting is not acceptable. The agent must execute Playwright tool calls,
  record pass/fail per acceptance criterion, and include results in the handoff note
  under `## UI Verification`. Auth walls (e.g. Microsoft Entra / SSO) are handled by
  asking the user to log in to the Playwright browser window; they do not excuse
  skipping verification.
- `docs/workflow.md`: Two new rows in the "What NOT To Do" table covering
  self-reported UI verification and skipping Playwright due to auth walls.
- `docs/plan-template.md`: Testing Checklist now includes mandatory Playwright items
  for frontend chunks, replacing the vague "e2e tests" line.

---

## 0.10.0 — 2026-04-04

### Bug fixes

- `scripts/execute-chunk.js`: Inject current `git status` and recent commits into the implementer
  prompt. Agents were confabulating completions — reading the plan, seeing that similar code exists,
  and concluding "already done" without calling any tools or running tests. Injecting repo state
  makes the gap between plan requirements and current code visible, preventing false completions.
  The implementer prompt is now built by `buildImplPrompt()` (also used for retries).
- `scripts/execute-chunk.js`: Fixed `runs/` path — script was writing `project/runs/next-chunk.md`
  and `project/runs/last-run.log` but the flat layout (introduced in v0.5.0) uses `runs/` at repo
  root. The 0.5.0 migration updated docs but not the script.
- `scripts/execute-chunk.js`: Fixed `plans/1.backlog/` path — was `project/plans/1.backlog/`,
  same flat-layout regression.

### Migration

Projects on v0.9.0 using `project/runs/`:
- The script now creates and writes to `runs/` at repo root
- If you had data in `project/runs/`, it is ephemeral (`runs/` is gitignored) — no migration needed

- `scripts/execute-chunk.js`: Added recovery implementer step when handoff note is missing.
  Previously, a missing `runs/next-chunk.md` caused immediate exit (exit 2) without spec review.
  Now a lightweight recovery agent checks the commits made during the chunk and writes the handoff
  note, allowing the spec review pipeline to proceed normally.

---

## 0.9.0 — 2026-04-04

### Changes

- `AGENTS.md` renamed to `CLAUDE.md` in harness-core — Claude Code natively reads `CLAUDE.md`; `AGENTS.md` was not auto-read
- `docs/workflow.md` added — defines cosmetic vs feature modes, superpowers integration rules, worktree sibling convention, and the cosmetic bypass
- `docs/core-beliefs.md`: beliefs #1 and #3 updated to reference `CLAUDE.md`
- `docs/structure.md`: folder tree updated to show `CLAUDE.md`
- `docs/init-worker-setup.md`, `docs/init-sh-suggestion.md`: references updated
- `templates/python-react-web-app/APPLY.md`: Step 4 heading and Step 6 git add updated

### Migration

For existing projects using harness-core:
1. Rename `AGENTS.md` to `CLAUDE.md` at the project repo root
2. Update any internal references from `AGENTS.md` to `CLAUDE.md` in that project's docs
3. Add a `## Worktree Directory` section to the new `CLAUDE.md` specifying the sibling naming convention (see icas-app for example)
4. Add `Read \`../harness-core/docs/workflow.md\` before starting any work.` to the Harness section

---

## 0.8.1 — 2026-04-02

Bug fixes found during real-world bootstrap testing on icas-app:

- `scripts/execute-chunk.js`: Fixed `APPROVED` detection — changed `startsWith('APPROVED')` to `/^\s*APPROVED\s*$/m` regex on all three reviewer checks (spec, spec-retry, quality). The model was writing reasoning before `APPROVED`, causing false failures despite correct approval.
- `templates/python-react-web-app/scaffold/frontend/vite.config.js`: Changed proxy target from `http://localhost:8000` to `http://127.0.0.1:8000`. On Windows, Node.js resolves `localhost` to `::1` (IPv6) but uvicorn binds to `127.0.0.1` (IPv4), breaking the proxy.

## 0.8.0 — 2026-04-01

Added app templates system:

- `templates/python-react-web-app/` — first app template: FastAPI backend + React/Vite frontend
  - `APPLY.md`: agent instruction script; copies scaffold, runs bootstrap autonomously
  - `docs/TECH.md`: tech stack reference for all future agent sessions in the project
  - `scaffold/backend/`: FastAPI hello-world with `/api/health`, requirements.txt, .env.example
  - `scaffold/frontend/`: React 18 + Vite, dev proxy to backend, health-check component
  - `bootstrap-plan.md`: 3-chunk harness plan — backend setup, frontend setup, verify + finalise; uses v0.7.0 init-worker.ps1 pattern
- `AGENTS.md`: added Templates section and templates/ to harness-core structure map

## 0.7.0 — 2026-04-01

Implemented `init-worker.ps1` bootstrap pattern:

- `scripts/execute-chunk.js`: Runs `init-worker.ps1` (or `init-worker.sh`) before each chunk. Exits with `status: failed` if the script exits non-zero.
- `AGENTS.md`: Added Core Rule 9 — `init-worker.ps1` must exist before any chunk work; links to setup doc. Added `docs/init-worker-setup.md` to key docs table.
- `docs/init-worker-setup.md`: New doc — step-by-step instructions for creating `init-worker.ps1` in an existing project.
- `docs/init-sh-suggestion.md`: Revised — removed `features.json` section, renamed to `init-worker.ps1`, added Windows-first guidance.
- `docs/plan-template.md`: Added note to prerequisites section prompting new projects to write `init-worker.ps1` in Chunk 1.
- `docs/worktrees.md`: Fixed `harness/scripts/` → `../harness-core/scripts/` to match sibling-repo layout.

## 0.6.0 — 2026-03-31

Added inspiration and improvement suggestions based on Anthropic's "Effective Harnesses for Long-Running Agents" article:

- `inspiration/effective-harnesses-for-long-running-agents.md`: Saved reference article from Anthropic engineering blog covering session handoff patterns, feature registries, and init scripts
- `docs/init-sh-suggestion.md`: Recommended harness improvements — `init.sh` bootstrap pattern (high priority) and optional flat `features.json` registry for large PBIs (8+ chunks)

## 0.5.0 — 2026-03-24

Canonised flat project layout — no `project/` subdirectory:

- `AGENTS.md`: Workspace layout updated — project content now sits at the repo root (no
  `project/` subdirectory). `AGENTS.md` acts as the combined project context + harness preamble
  document (replaces the old separate `PROJECT.md`).
- `AGENTS.md`: Orchestrator prompt paths updated — `project/plans/` → `plans/`,
  `project/runs/` → `runs/`
- Core Rule 3: `project/runs/` → `runs/`

### Upgrading from 0.4.0

Project repos using a `project/` subdirectory should:
1. `git mv project/plans plans && git mv project/docs docs && git mv project/src src` etc.
2. Merge `project/PROJECT.md` content into `AGENTS.md` (brief harness preamble at top,
   project context below)
3. Update `.gitignore` — replace `project/runs/` with `runs/`, etc.
4. Update `AGENTS.md` version pin to `v0.5.0`

## 0.4.0 — 2026-03-24

Restructured harness-core as a standalone repo in a multi-repo workspace model:

- `AGENTS.md`: Rewritten for standalone repo context — removed embedded `harness/`+`project/`
  layout assumption, added Workspace Layout section showing `harness-core/` as a sibling to
  the named project repo (e.g. `halo-asmt-poc/`), fixed all doc/script paths (`harness/docs/`
  → `docs/`), updated orchestrator prompt to use `../harness-core/scripts/execute-chunk.js`
- `AGENTS.md`: Notes that the project repo is named for the project, not `project/`, and that
  `project/` is the subdirectory inside it holding plans, src, data, runs
- `AGENTS.md`: Removed references to `init-harness.ps1` (install-by-copy model retired in
  favour of sibling-repo workspace)

### Upgrading from 0.3.0

Project repos that embedded harness via `harness/` subdirectory should:
1. Delete the local `harness/` copy
2. Check out `harness-core` as a sibling directory in the workspace
3. Update their `AGENTS.md` to reference `../harness-core/` (see `halo-asmt-poc` for example)

## 0.3.0 — 2026-03-20

Process doc fixes from field lessons (halo-asmt-poc, PBI-108):

- `feature-dev.md`: Add Rule 5 — E2E test runs must produce saved artifacts in
  `project/runs/` named with a `YYYY-MM-DD-<adjective>-<noun>` prefix; path must be
  referenced in the handoff note
- `agent-sessions.md`: Add explicit "stop at `built`" rule after the orchestrator loop;
  branch verification step added to loop after each successful chunk; worktree run
  instruction promoted from parenthetical to first-class rule with example command
- `plan-template.md`: Add Final Chunk Template section with mandatory stop-at-built steps
- `worktrees.md`: Add explicit instruction to run `execute-chunk.js` from the worktree
  root, not the main checkout

*Filed against harness v0.2.0; applied in v0.3.0.*

## 0.2.0 — 2026-03-19

### Changed
- `execute-chunk.js` now runs a three-agent pipeline per chunk:
  implementer → spec reviewer → quality reviewer.
  All sessions load `settingSources: ['user']` giving access to superpowers skills.
  Spec failures trigger one implementer retry. Quality issues are non-blocking
  warnings appended to `project/runs/next-chunk.md`.

## 0.1.0 — 2026-03-19

First versioned release. Establishes the `harness/` + `project/` split.

### Structure
- `harness/` — pure methodology, project-agnostic, replaceable wholesale
- `project/` — all project-specific content (plans, src, data, docs, scripts, runs)
- Root `AGENTS.md` — harness-owned, points to `project/PROJECT.md` for project context
- `harness/scripts/execute-chunk.js` — paths updated to `project/runs/`, `project/plans/`
- `harness/scripts/init-harness.ps1` — scaffolds `harness/` + `project/` in target repos

### Upgrading from pre-0.1.0 (flat layout)
Run `init-harness.ps1 -Target <repo> -Upgrade`. It will:
- Migrate flat `docs/`, `scripts/`, `plans/`, `data/`, `src/`, `runs/` → `project/`
- Install `harness/` folder
- Rewrite root `AGENTS.md`
- Update `.gitignore` paths
