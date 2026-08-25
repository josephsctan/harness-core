# Harness Workflow — How to Work in a Harnessed Project

This document defines the two working modes in a harnessed project and where
superpowers skills fit in each.

Read this document before starting any work in a project that uses harness-core.

---

## Two Modes

### Cosmetic Changes

A cosmetic change is one where:
- Only style, layout, copy, or configuration is touched
- No new tests are needed
- The change can be verified visually or by reading the diff

**How to handle:**
1. Identify the change as cosmetic
2. Propose it to the user: "This looks cosmetic — [description of what you'll do]. Shall I implement it directly?"
3. Wait for explicit user confirmation
4. Implement in the current session — no PBI, no plan, no execute-chunk

If unsure whether something qualifies as cosmetic, treat it as a feature.

### Feature Work

Everything that is not cosmetic is feature work. Feature work always goes through
the harness pipeline:

```
brainstorm → PBI (approved) → execution plan → orchestrate execute-chunk → merge to main → human tests → fix if needed
```

Never implement feature work directly in the main session.

#### The Build → Merge → Test → Fix Loop

1. **Build** — orchestrate chunks in a worktree until all chunks complete
2. **Merge** — automatically merge to `main` after the final chunk (Playwright must be green first)
3. **Test** — human tests on `main` against a single integrated server
4. **Fix** — if issues found:
   - Visual/cosmetic: fix directly on `main` in the current session
   - Functional bug or regression: log a new PBI → new worktree → merge back

Testing always happens on `main` because multiple features merged together may interact in ways
not visible in individual worktrees, and testing across separate dev servers misses integration
failures.

**"I accept"** closes the review cycle (human satisfied after testing on main). It does not
trigger the merge — the merge already happened after the final chunk completed.

---

## Where Superpowers Skills Fit

Superpowers skills are tools within the harness workflow, not a replacement for it.

### Brainstorming

Use `superpowers:brainstorming` when a feature needs design discussion before a PBI
can be written.

**Output:** A PBI file at `plans/1.backlog/PBI-NNN-name.md` (using the harness PBI
template at `../harness-core/docs/pbi-template.md`), not a superpowers spec file.

Do not write specs to `docs/superpowers/specs/` for harness feature work.

### Writing Plans

Use `superpowers:writing-plans` when writing an execution plan for an approved PBI.

**Output:** `plans/2.active/PBI-NNN-name.md` using the harness plan template
(`../harness-core/docs/plan-template.md`), not `docs/superpowers/plans/`.

### Execution

Execution is always driven by `execute-chunk.js` via the orchestrator loop — not by
`superpowers:executing-plans` or `superpowers:subagent-driven-development`.

See `../harness-core/docs/agent-sessions.md` for the orchestrator session prompt.

### Other Superpowers Skills

Other skills (debugging, code review, etc.) can be used freely within chunk sessions
where appropriate. They do not conflict with the harness.

---

## Worktrees

Worktrees are always created as **siblings** of the project repo, never inside it.
The sibling pattern ensures `../harness-core/` resolves correctly from any worktree.

See `../harness-core/docs/worktrees.md` for naming conventions, lifecycle, and commands.

---

## Playwright UI Verification

Any chunk that modifies frontend code **must** be verified with Playwright before
the handoff note is written. Self-reporting ("I started the dev server and it
looked fine") is not acceptable — the agent must execute Playwright tool calls
and record a pass/fail result against each acceptance criterion in the plan.

### What counts as frontend code

Any change under `src/frontend/` (or the project's equivalent frontend directory).
Backend-only chunks do not require Playwright verification.

### Two artefacts that must exist and grow

Every project with a frontend must maintain two E2E test artefacts, both committed
to the project repo:

1. **`docs/e2e-tests.md`** — human-readable manifest. One row per scenario, keyed
   to a PBI. Tells a human exactly what the test suite covers and when each flow was
   last verified. Updated every time a new frontend flow is built or changed.

2. **`src/frontend/e2e/*.spec.ts`** — Playwright spec files. Machine-executable.
   Written in the same language as the MCP session that verifies them. Updated every
   time a new frontend flow is built or changed.

Both files accumulate over time. They are regression documentation: as PBIs are
built, the manifest and specs grow, and every subsequent acceptance session must run
the **full existing suite** (regression) in addition to new scenarios.

### What the agent must do

1. Start the dev server if it is not already running.
2. Run the **full `docs/e2e-tests.md` manifest** via Playwright MCP — not just the
   new scenarios from this chunk. Record PASS or FAIL for every row.
3. Fix any regressions before writing the handoff note.
4. Add new rows to `docs/e2e-tests.md` for any new flows introduced by this chunk.
5. Add or extend spec files in `src/frontend/e2e/` to cover the new flows.
6. Include the full Playwright results in the handoff note under `## UI Verification`.

### Auth walls (e.g. Microsoft Entra / SSO)

Playwright cannot complete SSO login flows automatically. When the app requires
SSO login:

1. Note the limitation explicitly in the session.
2. Ask the user to log in inside the Playwright browser window that has opened.
3. Proceed with Playwright verification once the user confirms they are logged in.

Do not skip Playwright verification because of an auth wall — work around it.

---

## What NOT To Do

| Don't | Do instead |
|-------|-----------|
| Write specs to `docs/superpowers/specs/` for feature work | Write a PBI to `plans/1.backlog/` |
| Write plans to `docs/superpowers/plans/` for feature work | Write a plan to `plans/2.active/` |
| Implement features directly in the main session | Write a plan and orchestrate execute-chunk |
| Fix a bug or CR immediately because it looks trivial | Log a PBI first — even one-liners need "I approve" before touching code |
| Use `superpowers:executing-plans` for harness features | Use the harness orchestrator loop |
| Skip the PBI/approval stage | Always get "I approve" before writing a plan |
| Wait for "I accept" before merging to `main` | Merge automatically after the final chunk (Playwright green) |
| Ask the human to test on the worktree dev server | Merge first, then ask human to test on `main` |
| Create worktrees inside the project repo (e.g. `.worktrees/`) | Create as a sibling: `../icas-app--wt-<branch>` |
| Self-report UI verification ("looks fine to me") | Run Playwright and record pass/fail per criterion |
| Skip Playwright because of an SSO auth wall | Ask the user to log in to the Playwright browser, then proceed |
| Only verify the new flows from this chunk | Run the full `docs/e2e-tests.md` manifest every time (regression) |
| Forget to update `docs/e2e-tests.md` and `e2e/*.spec.ts` | Add new rows/specs for every new flow before writing the handoff note |
