# Feature Development Rules

These rules define what "done" means for a feature. They are not optional.

## The Rules

### 1. All code must be tested

Every feature ships with tests. No exceptions. If code is not tested, it is not done.

### 2. Playwright for web apps

If the feature touches a web UI, tests must include Playwright end-to-end tests. Unit tests alone are not sufficient.

### 3. e2e tests must be updated and must pass

Before a feature is marked complete:
- e2e tests must be updated to cover the new behaviour
- The full e2e suite must be run and pass — not just the new tests

A single passing test against broken neighbours does not count.

### 4. Visual smoke check for UI plans

Passing e2e tests do not guarantee a working UI. Mocked tests verify state machine
logic — they cannot catch broken layout, missing components, or visual regressions.

After e2e tests pass on any UI-touching plan, run a visual smoke check against the
live stack (real backend, real API — not mocked):
- Use Playwright `browser_screenshot` + `browser_snapshot` to verify key screens load
- Confirm the primary interaction works end-to-end (e.g. send a message, get a response)
- If the plan includes a mockup, confirm the rendered UI matches it structurally

Mandatory before marking a UI plan as `built`.

### 5. E2E test runs must produce saved evidence

A chunk that runs Playwright e2e tests must save artifacts, not just log pass/fail counts.
When the PBI involves a web app and the chunk runs e2e tests:

- Generate a Playwright HTML report: `npx playwright test --reporter=html`
- All artifacts (report, screenshots, notes) must be saved to `project/runs/` with a
  name prefix of `YYYY-MM-DD-<adjective>-<noun>`:

  ```
  project/runs/2026-03-20-snarky-potato-e2e.html
  project/runs/2026-03-20-snarky-potato-image-01.png
  project/runs/2026-03-20-snarky-potato-notes.md
  ```

- Reference the artifact prefix and report path in the handoff note (`next-chunk.md`)

A handoff that says "14/14 passed" with no saved report is not sufficient evidence for
human review.

### 6. Plans must cross-check against mockups before approval

Before a plan is approved, the author must verify that executing the plan produces a
UI that matches each screen's mockup. Structural gaps (missing sidebar, wrong layout,
absent component) must be addressed in the plan — not discovered post-implementation.

### 6. No feature is complete with failing tests

If any test fails — unit, integration, or e2e — the feature is not complete. Fix the tests or fix the code. Do not merge, do not mark the plan complete, do not move the plan to `plans/completed/`.

## Completion Checklist

Before moving a plan from `plans/active/` to `plans/completed/`, verify all of the following:

- [ ] Unit tests written and passing
- [ ] Integration tests written and passing (if applicable)
- [ ] e2e tests updated to cover the new behaviour (if web app is involved)
- [ ] Full e2e suite run and passing (if web app is involved)
- [ ] Visual smoke check run against live stack (if web app is involved)
- [ ] UI matches mockup structurally (if mockup exists)
- [ ] E2E test artifacts saved to `project/runs/` with `YYYY-MM-DD-<adjective>-<noun>` prefix, path referenced in handoff (if e2e tests were run)
- [ ] No skipped or commented-out tests introduced
- [ ] Test coverage has not regressed

### 7. Bug fix commits require explicit user approval

Before committing on any `fix/*` branch:

1. Run `git diff --staged`
2. Show the full diff to the user in the conversation
3. Wait for explicit approval — **"LGTM"**, **"approved"**, **"looks good"**, or equivalent
4. Only then run the commit

Do not commit, do not proceed, do not infer approval from silence or prior context.
This applies even to trivial one-line fixes. The rule exists because unapproved fixes
have been committed in past sessions — the gate is unconditional.

## Rationale

Agents ship fast. Fast without tests compounds debt exponentially. The test suite is the feedback loop that keeps the harness coherent over time. Treating a failing test as a blocker (not a nuisance) is what keeps that loop intact.

See [docs/core-beliefs.md](core-beliefs.md) — belief #7 (garbage collection) and #4 (mechanical enforcement).
