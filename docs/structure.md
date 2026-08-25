# Folder Structure Reference

This document defines what belongs in each folder and what does not.

**The top-level folder structure is frozen. Do not add, remove, or rename top-level folders.** All new work fits into the existing structure. If you think something doesn't fit, re-read this document — it almost certainly does.

**Skills, tools, and agent frameworks must not create their own folder structures.** If a skill or tool wants to write plans, it uses `project/plans/2.active/`. If it wants to write docs, it uses `docs/`. There is no `superpowers/`, no `skills/`, no `.claude/plans/`, no `agent-output/` — none of that. One folder structure. Use it.

## Overview

```
mini-harness/
├── CLAUDE.md
├── docs/
│   ├── features/          # As-built docs + release notes (one per completed feature)
│   └── ...
├── plans/
│   ├── 1.backlog/         # PBI backlog — what & why (permanent)
│   │   ├── .next-id       # PBI number counter (starts at 100)
│   │   ├── registry.md    # Index of all PBIs
│   │   └── PBI-NNN-*.md
│   ├── 2.active/          # In-flight execution plans — how
│   │   └── PBI-NNN-*.md
│   └── 3.completed/       # Archived plans (never delete)
│       └── PBI-NNN-*.md
├── scripts/               # CLI scripts — the agent's hands
├── src/
├── data/
│   ├── pbis/              # Screenshots and assets for PBIs (committed)
│   │   └── PBI-NNN/
│   └── issues/            # Committed record of issues found and fixed
│       └── YYYY-MM-DD-*.md
└── runs/                  # .gitignored — ephemeral scratch space
```

---

## Feature Lifecycle

Features flow through four stages. The PBI number is the thread connecting all artifacts.

```
project/plans/1.backlog/PBI-NNN-name.md    ← PBI: what & why (human + agent dialogue)
project/plans/2.active/PBI-NNN-name.md     ← execution: how (agent-driven)
project/plans/3.completed/PBI-NNN-name.md  ← archived plan (moved here on acceptance)
project/docs/features/PBI-NNN-name.md      ← as-built + release notes (written by agent on acceptance)
```

### Stage gates

| Gate | Trigger | Who |
|------|---------|-----|
| PBI → Plan | Human says **"I approve"** | Human only |
| Built → Accepted | Human says **"I accept"** | Human only |
| Accepted → Closed | Agent writes as-built, moves plan to 3.completed/ | Agent |

Agents must not advance a stage without the explicit human phrase. No inference.

---

## `docs/`

**Purpose:** All documentation. If it explains something, it lives here.

**Belongs here:**
- Architecture and design docs
- Operating principles and beliefs
- Reference material (articles, specs)
- How-to guides for humans and agents
- `features/` — as-built docs written at feature completion

**Does NOT belong here:**
- Active plans or in-progress work → use `project/plans/2.active/`
- Source code → use `src/`, runnable scripts → use `scripts/`
- Test data → use `data/`

---

## `plans/`

**Purpose:** Work items and their history across all lifecycle stages.

### `project/plans/1.backlog/`

The PBI backlog. Each PBI (feature, bug, or change-request) is the conversation between human and agent that defines what to build and why. **Never edited or deleted after approval** — it is the permanent record of intent.

Each PBI:
- Is created from [docs/pbi-template.md](pbi-template.md)
- Has a unique PBI number assigned from `.next-id`
- Has `type: feature | bug | change-request`
- Bugs and CRs include `affects: PBI-NNN` to trace them to the originating feature
- Has `status: draft` until the human says **"I approve"**, at which point the agent sets `status: approved`

Screenshots and assets live in `project/data/pbis/PBI-NNN/`.

### `project/plans/2.active/`

In-flight execution plans. One file per PBI, created only after the PBI is approved.

Each plan:
- Is created from [docs/plan-template.md](plan-template.md)
- References its PBI by PBI number
- Has `status: in-progress` → `built` (agent sets when tests pass) → `accepted` (human says "I accept")

### `project/plans/3.completed/`

Archived plans. Moved here from `2.active/` after acceptance. Never delete — they are a decision log.

### Linking to External Issues (beca.ghe.com)

Plans often originate from GitHub Enterprise issues. The rule:

> The plan is the record. The issue is the pointer.

When a plan originates from a GHE issue:
1. Include the issue URL in the PBI frontmatter
2. Copy or paraphrase the goal and acceptance criteria into the PBI itself
3. Do not rely on the issue for any content the agent needs — it must all be in the PBI

For smaller inline references (e.g. in docs), use this format:

```
[GHE#42](https://beca.ghe.com/org/repo/issues/42) — one-line description of what it is
```

The description is mandatory. A bare URL is not sufficient — agents cannot fetch it.

---

## `scripts/`

**Purpose:** CLI scripts that agents and humans run to operate the harness. These are the agent's hands (see core belief #5).

**Belongs here:**
- `execute-chunk.js` — executes one plan chunk via the Agent SDK (called by the CC orchestrator)
- Bootstrap / setup scripts
- Test runners
- Deploy and validation scripts

Scripts must be runnable from the repo root. Prefer short, single-purpose scripts over complex multi-step wrappers.

**Does NOT belong here:**
- Application library code → use `src/`
- Documentation → use `docs/`

---

## `src/`

**Purpose:** Application source code — library and application logic.

**Belongs here:**
- All production code
- Build configuration

**Does NOT belong here:**
- Runnable CLI scripts → use `scripts/`
- Test fixtures or sample data → use `data/`
- Ephemeral outputs → use `runs/`
- Documentation → use `docs/`

---

## `data/`

**Purpose:** Persistent data and fixtures. Committed to the repo.

**Belongs here:**
- Seed data for tests
- Sample inputs used across multiple test runs
- Static reference datasets
- `pbis/PBI-NNN/` — screenshots and assets for PBIs
- `issues/` — markdown records of issues found and fixed during development (see [docs/issue-log.md](issue-log.md))

**Does NOT belong here:**
- Outputs generated by runs → use `runs/`
- Anything generated automatically (regenerate from source)

---

## `runs/`

**Purpose:** Ephemeral scratch space for a single execution. **Never committed.**

**Belongs here:**
- Test outputs and results
- Temporary inputs/outputs during a run
- Logs from a specific execution
- Intermediate artifacts

**Does NOT belong here:**
- Anything you want to keep — move it to `data/` or `docs/` instead

`.gitignore` excludes everything in this folder except `.gitkeep`.
