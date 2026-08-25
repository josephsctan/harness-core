# CLAUDE.md Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `AGENTS.md` with `CLAUDE.md` in harness-core and icas-app so Claude Code natively reads the entry-point file, and add `docs/workflow.md` to define how superpowers skills integrate with the harness and when to use the cosmetic bypass.

**Architecture:** Two new files (`harness-core/CLAUDE.md`, `icas-app/CLAUDE.md`) replace their `AGENTS.md` counterparts with identical structure but correct filenames. A new `docs/workflow.md` in harness-core captures the superpowers integration rules and cosmetic bypass, pointed to from both `CLAUDE.md` files. All existing docs that reference `AGENTS.md` are updated in-place. Historical artifacts (old plans, specs, CHANGELOG history, inspiration docs) are left untouched.

**Tech Stack:** Markdown, git

---

## File Map

| Action | File | Notes |
|--------|------|-------|
| Create | `harness-core/docs/workflow.md` | New doc — superpowers integration + cosmetic bypass |
| Create | `harness-core/CLAUDE.md` | Replaces AGENTS.md — same content, correct filename + workflow.md added to key docs |
| Modify | `harness-core/docs/core-beliefs.md` | 2 refs: AGENTS.md → CLAUDE.md |
| Modify | `harness-core/docs/structure.md` | 1 ref in folder tree |
| Modify | `harness-core/docs/init-worker-setup.md` | 1 ref |
| Modify | `harness-core/docs/init-sh-suggestion.md` | 1 ref |
| Modify | `harness-core/templates/python-react-web-app/APPLY.md` | Step 4 heading + Step 6 git add line |
| Modify | `harness-core/CHANGELOG.md` | Add v0.9.0 entry at top |
| Modify | `harness-core/VERSION` | 0.8.1 → 0.9.0 |
| Delete | `harness-core/AGENTS.md` | Replaced by CLAUDE.md |
| Create | `icas-app/CLAUDE.md` | Replaces AGENTS.md — same content + workflow.md pointer + `## Worktree Directory` section |
| Delete | `icas-app/AGENTS.md` | Replaced by CLAUDE.md |

**Leave untouched:** `docs/superpowers/plans/`, `docs/superpowers/specs/`, `docs/plans/`, `docs/openai-harness-article.md`, `inspiration/`, CHANGELOG historical entries.

---

## Task 1: Create `harness-core/docs/workflow.md`

**Files:**
- Create: `c:/JST/Repos/harnessed-icas/harness-core/docs/workflow.md`

- [ ] **Write `docs/workflow.md`**

Write the file with this exact content:

```markdown
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
brainstorm → PBI (approved) → execution plan → orchestrate execute-chunk
```

Never implement feature work directly in the main session.

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

## What NOT To Do

| Don't | Do instead |
|-------|-----------|
| Write specs to `docs/superpowers/specs/` for feature work | Write a PBI to `plans/1.backlog/` |
| Write plans to `docs/superpowers/plans/` for feature work | Write a plan to `plans/2.active/` |
| Implement features directly in the main session | Write a plan and orchestrate execute-chunk |
| Use `superpowers:executing-plans` for harness features | Use the harness orchestrator loop |
| Skip the PBI/approval stage | Always get "I approve" before writing a plan |
| Create worktrees inside the project repo (e.g. `.worktrees/`) | Create as a sibling: `../icas-app--wt-<branch>` |
```

- [ ] **Verify file exists**

```bash
ls c:/JST/Repos/harnessed-icas/harness-core/docs/workflow.md
```

Expected: file listed with no error.

- [ ] **Commit**

```bash
cd c:/JST/Repos/harnessed-icas/harness-core
git add docs/workflow.md
git commit -m "feat: add docs/workflow.md — superpowers integration + cosmetic bypass"
```

---

## Task 2: Create `harness-core/CLAUDE.md`

**Files:**
- Create: `c:/JST/Repos/harnessed-icas/harness-core/CLAUDE.md`

- [ ] **Write `harness-core/CLAUDE.md`**

Write the file with this exact content (derived from `AGENTS.md`, updating all internal `AGENTS.md` references to `CLAUDE.md` and adding `workflow.md` to the Key Harness Docs table):

```markdown
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
5. **Stage gates are human-only.** PBI approval = **"I approve"**. Acceptance = **"I accept"**. Never infer from context.
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
Stop when all chunks done or you need my input.
```
```

- [ ] **Verify file exists**

```bash
ls c:/JST/Repos/harnessed-icas/harness-core/CLAUDE.md
```

Expected: file listed with no error.

- [ ] **Commit**

```bash
cd c:/JST/Repos/harnessed-icas/harness-core
git add CLAUDE.md
git commit -m "feat: add CLAUDE.md — replaces AGENTS.md as harness entry point"
```

---

## Task 3: Update `harness-core/docs/core-beliefs.md`

**Files:**
- Modify: `c:/JST/Repos/harnessed-icas/harness-core/docs/core-beliefs.md`

Two references to update.

- [ ] **Update belief #1**

Find:
```
1. **AGENTS.md is the table of contents** — short, links to everything else. Not an encyclopedia.
```

Replace with:
```
1. **CLAUDE.md is the table of contents** — short, links to everything else. Not an encyclopedia.
```

- [ ] **Update belief #3**

Find:
```
3. **Progressive disclosure** — agent starts with AGENTS.md, drills deeper as needed.
```

Replace with:
```
3. **Progressive disclosure** — agent starts with CLAUDE.md, drills deeper as needed.
```

- [ ] **Verify**

```bash
grep "AGENTS.md" c:/JST/Repos/harnessed-icas/harness-core/docs/core-beliefs.md
```

Expected: no output.

- [ ] **Commit**

```bash
cd c:/JST/Repos/harnessed-icas/harness-core
git add docs/core-beliefs.md
git commit -m "chore: update core-beliefs.md — AGENTS.md → CLAUDE.md"
```

---

## Task 4: Update `harness-core/docs/structure.md`

**Files:**
- Modify: `c:/JST/Repos/harnessed-icas/harness-core/docs/structure.md`

One reference in the folder tree diagram.

- [ ] **Update folder tree**

Find:
```
├── AGENTS.md
```

Replace with:
```
├── CLAUDE.md
```

- [ ] **Verify**

```bash
grep "AGENTS.md" c:/JST/Repos/harnessed-icas/harness-core/docs/structure.md
```

Expected: no output.

- [ ] **Commit**

```bash
cd c:/JST/Repos/harnessed-icas/harness-core
git add docs/structure.md
git commit -m "chore: update structure.md — AGENTS.md → CLAUDE.md"
```

---

## Task 5: Update `init-worker-setup.md` and `init-sh-suggestion.md`

**Files:**
- Modify: `c:/JST/Repos/harnessed-icas/harness-core/docs/init-worker-setup.md`
- Modify: `c:/JST/Repos/harnessed-icas/harness-core/docs/init-sh-suggestion.md`

- [ ] **Update `init-worker-setup.md`**

Find:
```
   - Read `AGENTS.md` for tech stack and test commands
```

Replace with:
```
   - Read `CLAUDE.md` for tech stack and test commands
```

- [ ] **Update `init-sh-suggestion.md`**

Find:
```
Harness-core relies on `AGENTS.md` + the plan to orient a new agent session.
```

Replace with:
```
Harness-core relies on `CLAUDE.md` + the plan to orient a new agent session.
```

- [ ] **Verify both files**

```bash
grep "AGENTS.md" c:/JST/Repos/harnessed-icas/harness-core/docs/init-worker-setup.md
grep "AGENTS.md" c:/JST/Repos/harnessed-icas/harness-core/docs/init-sh-suggestion.md
```

Expected: no output from either command.

- [ ] **Commit**

```bash
cd c:/JST/Repos/harnessed-icas/harness-core
git add docs/init-worker-setup.md docs/init-sh-suggestion.md
git commit -m "chore: update init docs — AGENTS.md → CLAUDE.md"
```

---

## Task 6: Update `templates/python-react-web-app/APPLY.md`

**Files:**
- Modify: `c:/JST/Repos/harnessed-icas/harness-core/templates/python-react-web-app/APPLY.md`

Two references: the Step 4 heading and the git add command in Step 6.

- [ ] **Update Step 4 heading**

Find:
```
### Step 4 — Update AGENTS.md
```

Replace with:
```
### Step 4 — Update CLAUDE.md
```

- [ ] **Update Step 4 body**

Find:
```
Add the following section immediately after the `## Application Context` section
(or at the end of the file if that section doesn't exist):
```

Replace with (no change to this line — leave as-is). Then find the instruction text:

Find:
```
### Step 4 — Update CLAUDE.md

Add the following section immediately after the `## Application Context` section
(or at the end of the file if that section doesn't exist):
```

This is already correct after the heading update above — no further body change needed.

- [ ] **Update Step 6 git add**

Find:
```
git add src/ docs/TECH.md plans/2.active/bootstrap.md AGENTS.md
```

Replace with:
```
git add src/ docs/TECH.md plans/2.active/bootstrap.md CLAUDE.md
```

- [ ] **Verify**

```bash
grep "AGENTS.md" c:/JST/Repos/harnessed-icas/harness-core/templates/python-react-web-app/APPLY.md
```

Expected: no output.

- [ ] **Commit**

```bash
cd c:/JST/Repos/harnessed-icas/harness-core
git add templates/python-react-web-app/APPLY.md
git commit -m "chore: update APPLY.md template — AGENTS.md → CLAUDE.md"
```

---

## Task 7: Update CHANGELOG, VERSION, delete AGENTS.md — commit harness-core

**Files:**
- Modify: `c:/JST/Repos/harnessed-icas/harness-core/CHANGELOG.md`
- Modify: `c:/JST/Repos/harnessed-icas/harness-core/VERSION`
- Delete: `c:/JST/Repos/harnessed-icas/harness-core/AGENTS.md`

- [ ] **Update VERSION**

Write `c:/JST/Repos/harnessed-icas/harness-core/VERSION`:
```
0.9.0
```

- [ ] **Add CHANGELOG entry**

Read `CHANGELOG.md` to confirm the current first line (it should begin with the v0.8.x entry). Then prepend this block at the very top of the file, before any existing content:

```markdown
## v0.9.0 — 2026-04-03

### Changes

- `AGENTS.md` renamed to `CLAUDE.md` in harness-core — Claude Code natively reads `CLAUDE.md`; `AGENTS.md` was not auto-read
- `docs/workflow.md` added — defines cosmetic vs feature modes, superpowers integration rules, and the cosmetic bypass
- `docs/core-beliefs.md`: belief #1 and #3 updated to reference `CLAUDE.md`
- `docs/structure.md`: folder tree updated to show `CLAUDE.md`
- `docs/init-worker-setup.md`, `docs/init-sh-suggestion.md`: references updated
- `templates/python-react-web-app/APPLY.md`: Step 4 and Step 6 updated

### Migration

For existing projects using harness-core:
1. Rename `AGENTS.md` to `CLAUDE.md` at the project repo root
2. Update any internal references from `AGENTS.md` to `CLAUDE.md` in that project's docs
3. Add `Read \`../harness-core/docs/workflow.md\` before starting any work.` to the Harness section of the project's new `CLAUDE.md`

---

```

- [ ] **Delete AGENTS.md**

```bash
cd c:/JST/Repos/harnessed-icas/harness-core
git rm AGENTS.md
```

- [ ] **Verify AGENTS.md is gone**

```bash
ls c:/JST/Repos/harnessed-icas/harness-core/AGENTS.md 2>&1
```

Expected: error — file not found.

- [ ] **Commit**

```bash
cd c:/JST/Repos/harnessed-icas/harness-core
git add CHANGELOG.md VERSION
git commit -m "chore: v0.9.0 — AGENTS.md → CLAUDE.md migration"
```

---

## Task 8: Migrate `icas-app` — create CLAUDE.md, delete AGENTS.md

**Files:**
- Create: `C:/Users/JT773/source/repos/harnessed-icas/icas-app/CLAUDE.md`
- Delete: `C:/Users/JT773/source/repos/harnessed-icas/icas-app/AGENTS.md`

- [ ] **Write `icas-app/CLAUDE.md`**

Write the file with this exact content:

```markdown
# Agent Entry Point

Read this file completely before doing anything else.

This is **icas-app** — an app that helps students study for ICAS (International
Competitions and Assessments for Schools) by displaying past exam questions scanned
from past papers.

---

## Harness

This project uses the agent harness at `../harness-core/`. Read
`../harness-core/CLAUDE.md` for the full methodology and orchestrator session prompt.

Read `../harness-core/docs/workflow.md` before starting any work — it defines
the two working modes (cosmetic vs feature) and where superpowers skills fit.

Scripts are invoked as:

```
node ../harness-core/scripts/execute-chunk.js <plan-path> "<chunk name>"
```

---

## Project Structure

```
icas-app/
  CLAUDE.md              ← you are here
  plans/
    1.backlog/           ← PBI backlog (.next-id, registry.md, PBI-NNN-*.md)
    2.active/            ← in-flight execution plans
    3.completed/         ← archived plans (never delete)
  docs/
    features/            ← as-built docs per completed feature
  src/                   ← application source code
  data/
    pbis/                ← screenshots and assets for PBIs (committed)
    issues/              ← issue records (committed)
  runs/                  ← ephemeral scratch space (.gitignored)
```

---

## Application Context

**What it does:** Displays past ICAS exam questions (scanned from paper) so students
can practise. Questions are sourced from scanned past papers.

**Tech stack:** FastAPI (Python backend) + React/Vite (frontend). See [docs/TECH.md](docs/TECH.md) for run commands, test commands, env vars, and conventions.

**Key domain concepts:**
- **ICAS** — International Competitions and Assessments for Schools; multiple
  subject areas (English, Maths, Science, etc.) and year levels
- **Past paper** — a scanned exam paper from a prior year; source of all questions
- **Question** — a single item from a past paper, with subject, year, and difficulty

---

## Worktree Directory

Worktrees are created as **siblings** of this repo, not inside it. Use the naming
convention `icas-app--wt-<branch-name>`:

```
git worktree add ../icas-app--wt-<branch-name> -b feat/<branch-name>
```

See `../harness-core/docs/worktrees.md` for the full convention.

---

## Core Rules

1. Read `../harness-core/CLAUDE.md` and `../harness-core/docs/core-beliefs.md` before
   making architectural decisions.
2. Read `../harness-core/docs/workflow.md` before starting any work.
3. PBIs flow: `plans/1.backlog/` → `plans/2.active/` → `plans/3.completed/` → `docs/features/`.
   Never skip a stage.
4. Stage gates are human-only: **"I approve"** advances a PBI to planning;
   **"I accept"** accepts a built feature.
5. `runs/` is never committed.
6. Read [docs/TECH.md](docs/TECH.md) before writing any code — it defines run commands, test commands, and conventions for this stack.
```

- [ ] **Delete AGENTS.md**

```bash
cd C:/Users/JT773/source/repos/harnessed-icas/icas-app
git rm AGENTS.md
```

- [ ] **Verify**

```bash
ls C:/Users/JT773/source/repos/harnessed-icas/icas-app/CLAUDE.md
grep "AGENTS.md" C:/Users/JT773/source/repos/harnessed-icas/icas-app/CLAUDE.md
```

Expected: `CLAUDE.md` exists, grep returns no output.

- [ ] **Commit**

```bash
cd C:/Users/JT773/source/repos/harnessed-icas/icas-app
git add CLAUDE.md
git commit -m "chore: AGENTS.md → CLAUDE.md — harness v0.9.0 migration"
```

---

## Self-Review

### Spec coverage

| Requirement | Task |
|-------------|------|
| harness-core/CLAUDE.md created | Task 2 |
| docs/workflow.md created (superpowers + cosmetic bypass) | Task 1 |
| core-beliefs.md updated | Task 3 |
| structure.md updated | Task 4 |
| init-worker-setup.md updated | Task 5 |
| init-sh-suggestion.md updated | Task 5 |
| APPLY.md template updated | Task 6 |
| CHANGELOG + VERSION bumped | Task 7 |
| harness-core/AGENTS.md deleted | Task 7 |
| icas-app/CLAUDE.md created (with `## Worktree Directory` section) | Task 8 |
| icas-app/AGENTS.md deleted | Task 8 |
| docs/workflow.md includes worktrees section + "What NOT To Do" row | Task 1 |

All requirements covered. No gaps.

### Placeholder scan

No TBD, TODO, or "similar to Task N" patterns. All file content is fully specified.

### Consistency check

All references to `CLAUDE.md` in new files point to correct relative paths. `workflow.md` is listed in `CLAUDE.md`'s Key Harness Docs table and referenced from both `icas-app/CLAUDE.md` Core Rules.
