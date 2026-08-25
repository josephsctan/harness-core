# Plan Template

Copy this file to `project/plans/2.active/PBI-NNN-short-name.md` to start a new plan.
A plan must have a corresponding approved PBI in `project/plans/1.backlog/` before work begins.

---

# PBI-NNN — \<Title\>

pbi: <!-- project/plans/1.backlog/PBI-NNN-short-name.md --\>
branch: <!-- feat/PBI-NNN-short-name -->
worktree: <!-- ../mini-harness--wt-PBI-NNN-short-name — delete if running in main checkout -->
status: in-progress <!-- in-progress | built | accepted -->
started: <!-- YYYY-MM-DD -->

## Local Run Prerequisites

<!-- List everything a developer needs before they can run this plan's output.
     Include: required env vars, how to obtain them, and any one-time setup steps.
     Create a `.env.example` with placeholder values checked into git.
     The `.env` itself must be in `.gitignore`.

     NEW PROJECT: If this is the first plan for this project, include a step in
     Chunk 1 to write init-worker.ps1 (Windows) or init-worker.sh (Linux/Mac) at
     the repo root. execute-chunk.js will run it automatically before each chunk.
     See harness-core/docs/init-sh-suggestion.md for the expected contents. -->

| Env var / step | How to obtain |
|----------------|---------------|
| `EXAMPLE_API_KEY` | ... |

## Goal

<!-- What are we delivering and why? Derived from the PBI but written for execution.
     Must be self-contained — do not rely on the PBI for content the agent needs. -->

## Acceptance Criteria

- [ ] ...
- [ ] ...

## Steps

- [ ] Step one
- [ ] Step two

## Testing Checklist

<!-- See docs/feature-dev.md and docs/workflow.md — all items must be checked before status can be set to "built" -->

- [ ] Unit tests written and passing
- [ ] Integration tests written and passing (if applicable)
- [ ] No skipped or commented-out tests introduced

<!-- If any chunk touches frontend code, the following are mandatory (see workflow.md — Playwright UI Verification): -->
- [ ] Playwright verification run for all affected user flows (frontend chunks only)
- [ ] Pass/fail recorded per acceptance criterion in the final handoff note

## Chunk Template

Each chunk must end with this step:

```
- [ ] **Write handoff note and stop**

Commit any uncommitted work. Then write runs/next-chunk.md:

  plan: project/plans/2.active/<this-file>
  completed: Chunk N — <name>
  status: success        <- required: "success" or "failed"
  next: Chunk N+1 — <name>   <- or "all done"

  ## What was done
  [one paragraph summary]

  ## What failed         <- include only if status: failed
  [full error output]

Stop — do not start the next chunk.
```

**Chunk sizing rules** (see docs/agent-sessions.md for full guidance):
- 3–8 explicit steps per chunk, one focused commit
- Never write "investigate failures and fix" — diagnose first, specify the fix
- Split iterative work: one chunk to implement, one chunk to verify

## Final Chunk Template

The last chunk in every plan must end with these steps instead of the standard chunk template:

```
- [ ] **Write handoff note and stop**

Commit any uncommitted work. Then write project/runs/next-chunk.md:

  plan: project/plans/2.active/<this-file>
  completed: Chunk N — <name>
  status: success
  next: all done

  ## What was done
  [one paragraph summary]

Then:
- [ ] Set plan status to `built` in the plan frontmatter
- [ ] Stop — do not merge to main, do not push to production

The human accepts the build by saying "I accept". Do not merge until then.
```

---

## Decision Log

<!-- Record significant choices made during execution and the reasoning behind them. -->

| Decision | Rationale | Date |
|----------|-----------|------|
| | | |
