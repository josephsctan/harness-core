# harness-core

Read this file completely before doing anything else.

This is **harness-core** — the upstream methodology repository for the agent harness.
It contains no application code, no PBIs, and no project source.

- If you are here to maintain or improve the harness itself, read on.
- If you are in a project repo that uses the harness, you should be reading that repo's `CLAUDE.md`.

---

## What Is harness-core?

harness-core is the canonical, versioned implementation of the agent harness — a methodology
for growing software with zero human code and zero code review. Humans describe features;
the harness grows them; humans review the result.

The intended setup is a **multi-repo workspace**: harness-core is checked out as a sibling
to the project repo and referenced via relative paths (`../harness-core/`).

---

## Workspace Layout

Projects using this harness live in their own repo, named for the project. Both repos sit
side-by-side in the same workspace directory:

```
workspace/
  harness-core/          ← this repo
  <project-name>/        ← project repo (e.g. halo-asmt-poc, my-app)
    CLAUDE.md            ← project entry point: project context + brief harness preamble
    plans/               ← 1.backlog/, 2.active/, 3.completed/
    docs/                ← as-built docs per feature
    src/                 ← source code
    data/                ← test data and assets
    runs/                ← ephemeral run artifacts (never committed)
```

Note: the project repo is named for the project. All content sits at the repo root — there is
no `project/` subdirectory. `CLAUDE.md` serves as the project context document (tech stack,
conventions, live environment) with a brief harness preamble at the top.

---

## harness-core Structure

```
harness-core/
  docs/           ← all process docs (structure, templates, session hygiene, etc.)
  scripts/        ← execute-chunk.js (chunk executor)
  templates/      ← app templates (scaffold + bootstrap plans for new projects)
  architecture/   ← diagrams and design assets
  test/           ← unit tests for harness scripts
  CLAUDE.md       ← you are here
  CHANGELOG.md    ← what changed per version + migration notes
  VERSION         ← harness semver
  package.json    ← npm deps (Anthropic SDK)
```

---

## Key Harness Docs

| Doc | Purpose |
|-----|---------|
| [docs/core-beliefs.md](docs/core-beliefs.md) | Operating principles — read before making decisions |
| [docs/workflow.md](docs/workflow.md) | How to work in a harnessed project — modes, superpowers integration, cosmetic bypass |
| [docs/structure.md](docs/structure.md) | Detailed folder rules and feature lifecycle |
| [docs/pbi-template.md](docs/pbi-template.md) | Template for new PBIs (features, bugs, CRs) |
| [docs/plan-template.md](docs/plan-template.md) | Template for execution plans |
| [docs/feature-dev.md](docs/feature-dev.md) | Testing requirements and definition of done |
| [docs/agent-sessions.md](docs/agent-sessions.md) | Session hygiene, orchestrator loop, retry behaviour |
| [docs/worktrees.md](docs/worktrees.md) | Parallel development with git worktrees |
| [docs/init-worker-setup.md](docs/init-worker-setup.md) | How to create init-worker.ps1 for a project |
| [docs/troubleshooting.md](docs/troubleshooting.md) | Common environment problems and fixes |
| [templates/](templates/) | App templates — scaffold + bootstrap plans for new projects |

---

## Templates

App templates live in `templates/<template-name>/`. Each template contains:
- `APPLY.md` — step-by-step instructions for the agent to apply the template
- `docs/TECH.md` — tech stack reference (copied to the project's `docs/TECH.md`)
- `scaffold/` — starter source files
- `bootstrap-plan.md` — 3-chunk plan to stand up the app (run via `execute-chunk.js`)

**To apply a template**, the human says "apply the \<template-name\> template" and the
agent reads `../harness-core/templates/<template-name>/APPLY.md` and follows the steps.

| Template | Stack |
|----------|-------|
| [python-react-web-app](templates/python-react-web-app/) | FastAPI + React/Vite |

---

## Core Rules

1. **This file is the map.** Follow links for detail — do not guess at process.
2. **Docs are the system of record.** Knowledge not in this repo does not exist.
3. **`runs/` is never committed.** Ephemeral scratch space only.
4. **PBIs flow through the pipeline.** backlog → active → completed → as-built. No skipping.
5. **PBI approval is human-only.** `"I approve"` is required before writing a plan. Merge to `main` happens automatically after all chunks complete (Playwright green) — do not wait for `"I accept"`. `"I accept"` closes the review cycle after the human tests on `main`.
   **When a user reports a bug or CR: log a PBI. Do not touch code.** Even a one-line fix must be a PBI first. The only exception is a cosmetic change the user explicitly asks to fix right now (see [docs/workflow.md](docs/workflow.md)).
6. **Features are not done until all tests pass.** See [docs/feature-dev.md](docs/feature-dev.md).
7. **One PBI = one worktree = one branch.** See [docs/worktrees.md](docs/worktrees.md).
8. **Read [docs/core-beliefs.md](docs/core-beliefs.md)** before architectural decisions.
9. **`init-worker.ps1` must exist** at the project repo root before any chunk work begins. If it is missing, stop and follow [docs/init-worker-setup.md](docs/init-worker-setup.md) before proceeding.

---

## Orchestrator Session Prompt

Use this prompt from inside the **project repo** when orchestrating a PBI to completion.
Paths assume the standard workspace layout above (harness-core as sibling repo).

```
Orchestrate PBI-NNN to completion.
Plan: plans/2.active/PBI-NNN-name.md

For each chunk:
1. Find the next incomplete chunk (unchecked - [ ] under a ## Chunk heading)
2. node ../harness-core/scripts/execute-chunk.js <plan-path> "<chunk name>"
3. sleep 30 && tail -30 runs/last-run.log
4. Read runs/next-chunk.md — review the outcome
5. If status: failed — read failure notes, adjust plan if needed, retry (max 2x, then stop and tell me)
6. If status: success — mark chunk complete in plan, go to 1

When all chunks are done (next: all done):
7. Run full Playwright suite from the worktree — fix any failures before continuing
8. Merge to main: git checkout main && git merge feat/<branch-name>
9. Remove worktree: git worktree remove ../<project>--wt-<branch-name> && git branch -d feat/<branch-name>
10. Tell me: "PBI-NNN merged to main and ready to test."
```
