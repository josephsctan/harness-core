# execute-chunk.js — Subagent-Driven Pattern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single `query()` call in `execute-chunk.js` with a three-agent pipeline: implementer → spec reviewer → quality reviewer, with retry loops.

**Architecture:** All SDK sessions load `settingSources: ['user']` so they have access to the full superpowers skill namespace. The implementer runs the chunk with full tool access. After it commits, a spec reviewer verifies the work matches the plan chunk, and a quality reviewer checks code cleanliness. Reviewers have read + skill tool access so they can inspect code directly. Spec failures trigger one implementer retry; quality issues are non-blocking warnings logged in the handoff note.

**Tech Stack:** Node.js ESM, `@anthropic-ai/claude-agent-sdk` `query()`, `fs`, `path`, `child_process`

---

## File Map

| File | Change |
|------|--------|
| `harness/scripts/execute-chunk.js` | Refactor: add `runSession()`, spec reviewer, quality reviewer, retry logic |

No new files. No change to external interface or exit codes.

---

### Task 1: Extract `runSession()` helper and add `settingSources`

**Files:**
- Modify: `harness/scripts/execute-chunk.js`

- [ ] Read `harness/scripts/execute-chunk.js` in full

- [ ] Define tool sets and extract the `for await` loop into a reusable helper. Add `settingSources: ['user']` to all sessions so they can use superpowers skills:

```js
const IMPL_TOOLS     = ['Skill', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'];
const REVIEWER_TOOLS = ['Skill', 'Read', 'Bash', 'Glob', 'Grep'];

/**
 * Runs a single Agent SDK session and streams output to the log.
 * @param {string} prompt
 * @param {string} label - shown in log headers e.g. "implementer", "spec-reviewer"
 * @param {string[]} tools - allowedTools list
 * @returns {string} concatenated text output from all assistant messages
 */
async function runSession(prompt, label, tools) {
  log(`\n[${label}] starting`);
  let output = '';
  for await (const message of query({
    prompt,
    options: {
      cwd: process.cwd(),
      allowedTools: tools,
      settingSources: ['user'],
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      maxTurns: 100,
    },
  })) {
    if (message.type === 'assistant') {
      for (const block of message.message?.content ?? []) {
        if (block.type === 'text') {
          emitErr(block.text);
          output += block.text;
        }
      }
      emitErr('\n');
    }
  }
  log(`[${label}] done`);
  return output;
}
```

- [ ] Replace the existing `try { for await ... }` block with:

```js
try {
  await runSession(prompt, 'implementer', IMPL_TOOLS);
} catch (err) {
  emitErr(`\n[execute-chunk] Agent SDK error: ${err.message}\n`);
  process.exit(1);
}
```

- [ ] Smoke-test: run against any real plan chunk and verify behaviour is identical to before:

```bash
node harness/scripts/execute-chunk.js project/plans/2.active/<any-plan>.md "Chunk 1 — <name>"
```

Expected: same output as before, same exit codes.

- [ ] Commit:

```bash
git add harness/scripts/execute-chunk.js
git commit -m "refactor(execute-chunk): extract runSession() with settingSources support"
```

---

### Task 2: Add spec compliance reviewer

**Files:**
- Modify: `harness/scripts/execute-chunk.js`

The spec reviewer is a full SDK session with read + skill tool access. It reads the plan chunk and the handoff directly from the filesystem, then replies `APPROVED` or `ISSUES: <list>`.

- [ ] Add git helpers and capture `startSha` before the implementer runs. Add `import { execSync } from 'child_process'` at the top:

```js
function getCurrentSha() {
  try { return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(); }
  catch { return 'HEAD'; }
}

function getCommitsSince(sha) {
  try { return execSync(`git log ${sha}..HEAD --oneline`, { encoding: 'utf8' }); }
  catch { return '(no new commits)'; }
}
```

Before calling `runSession('implementer')`, add:

```js
const startSha = getCurrentSha();
```

- [ ] After reading the handoff (after the existing `if (!handoff)` guard), build and run the spec review:

```js
const newCommits = getCommitsSince(startSha);

const specReviewPrompt = [
  `You are a spec compliance reviewer. Your job: verify the implementation matches the plan chunk.`,
  ``,
  `Plan file: ${planPathFwd}`,
  `Chunk: "${chunkName}"`,
  `Handoff note: ${NEXT_CHUNK_FILE}`,
  `New commits since chunk started: ${newCommits || '(none)'}`,
  ``,
  `Steps:`,
  `1. Read the plan file and find the "${chunkName}" section`,
  `2. Read the handoff note`,
  `3. Read any files that were changed (use git diff or Bash as needed)`,
  `4. Determine whether every required step in the chunk was completed`,
  ``,
  `Reply with exactly one of:`,
  `  APPROVED`,
  `or:`,
  `  ISSUES:`,
  `  - <specific gap — what was required vs what was done>`,
  ``,
  `Be concise. Only flag genuine spec gaps — missing required steps, wrong output,`,
  `untested behaviour. Do not flag style or optional improvements.`,
].join('\n');

let specOutput = '';
try {
  specOutput = await runSession(specReviewPrompt, 'spec-reviewer', REVIEWER_TOOLS);
} catch (err) {
  log(`[spec-reviewer] error: ${err.message} — skipping`);
}

const specApproved = specOutput.trim().startsWith('APPROVED');
if (specApproved) {
  log('[spec-reviewer] APPROVED');
} else {
  log('[spec-reviewer] ISSUES FOUND:');
  log(specOutput);
}
```

- [ ] Smoke-test: run a chunk and check the log for `[spec-reviewer] starting` and either `APPROVED` or `ISSUES FOUND`.

- [ ] Commit:

```bash
git add harness/scripts/execute-chunk.js
git commit -m "feat(execute-chunk): add spec compliance reviewer"
```

---

### Task 3: Add implementer retry on spec failure

**Files:**
- Modify: `harness/scripts/execute-chunk.js`

If spec review finds issues, re-run the implementer once with the issues appended to the original prompt. Then re-run the spec reviewer. If still failing, exit(2).

- [ ] Replace the spec parsing block with a retry loop:

```js
let specApproved = specOutput.trim().startsWith('APPROVED');

if (!specApproved) {
  log('[spec-reviewer] ISSUES FOUND — retrying implementer once');
  log(specOutput);

  const retryPrompt = [
    prompt,
    ``,
    `## Spec review feedback — fix these gaps before finishing`,
    specOutput,
    ``,
    `Do not re-investigate from scratch. Address only the listed gaps.`,
    `Re-write ${NEXT_CHUNK_FILE} with the updated outcome when done.`,
  ].join('\n');

  // Delete stale handoff so we can detect if retry writes a new one
  if (fs.existsSync(NEXT_CHUNK_FILE)) fs.unlinkSync(NEXT_CHUNK_FILE);

  try {
    await runSession(retryPrompt, 'implementer-retry', IMPL_TOOLS);
  } catch (err) {
    emitErr(`\n[execute-chunk] retry error: ${err.message}\n`);
    process.exit(1);
  }

  // Re-run spec reviewer against the retry result
  const retryNewCommits = getCommitsSince(startSha);

  const retrySpecPrompt = [
    `You are a spec compliance reviewer. Your job: verify the implementation matches the plan chunk.`,
    ``,
    `Plan file: ${planPathFwd}`,
    `Chunk: "${chunkName}"`,
    `Handoff note: ${NEXT_CHUNK_FILE}`,
    `New commits since chunk started: ${retryNewCommits || '(none)'}`,
    ``,
    `Steps:`,
    `1. Read the plan file and find the "${chunkName}" section`,
    `2. Read the handoff note`,
    `3. Read any files that were changed (use git diff or Bash as needed)`,
    `4. Determine whether every required step in the chunk was completed`,
    ``,
    `Reply with exactly one of:`,
    `  APPROVED`,
    `or:`,
    `  ISSUES:`,
    `  - <specific gap>`,
    ``,
    `Be concise. Only flag genuine spec gaps.`,
  ].join('\n');

  let retrySpecOutput = '';
  try {
    retrySpecOutput = await runSession(retrySpecPrompt, 'spec-reviewer-retry', REVIEWER_TOOLS);
  } catch (err) {
    log(`[spec-reviewer-retry] error: ${err.message} — skipping`);
  }

  specApproved = retrySpecOutput.trim().startsWith('APPROVED');
  if (specApproved) {
    log('[spec-reviewer-retry] APPROVED');
  } else {
    log('[spec-reviewer-retry] still failing — escalating');
    log(retrySpecOutput);
    emitErr('[execute-chunk] spec compliance failed after retry\n');
    process.exit(2);
  }
}
```

- [ ] Smoke-test: temporarily remove a required step from a chunk, run it, confirm the retry loop fires. Restore the chunk.

- [ ] Commit:

```bash
git add harness/scripts/execute-chunk.js
git commit -m "feat(execute-chunk): add spec reviewer retry loop"
```

---

### Task 4: Add code quality reviewer (non-blocking)

**Files:**
- Modify: `harness/scripts/execute-chunk.js`

Quality issues are warnings only — they don't block the pipeline or trigger a retry. They are appended to the handoff note so the CC orchestrator can see them.

- [ ] Add a git diff helper:

```js
function getDiffSince(sha) {
  try {
    return execSync(`git diff ${sha}..HEAD`, { encoding: 'utf8' }).slice(0, 8000);
  } catch { return '(no diff available)'; }
}
```

- [ ] After spec is approved, add the quality review:

```js
const diff = getDiffSince(startSha);

const qualityPrompt = [
  `You are a code quality reviewer. Review the changes made during this chunk for issues.`,
  ``,
  `## Git diff (capped at 8000 chars)`,
  '```diff',
  diff,
  '```',
  ``,
  `You also have read access to the repo if you need more context.`,
  ``,
  `Reply with exactly one of:`,
  `  APPROVED`,
  `or:`,
  `  ISSUES:`,
  `  - <specific issue — file:line if possible>`,
  ``,
  `Flag only genuine problems: bugs, security issues, dead code, misleading names.`,
  `Do not flag style preferences, missing docs, or speculative improvements.`,
].join('\n');

let qualityOutput = '';
try {
  qualityOutput = await runSession(qualityPrompt, 'quality-reviewer', REVIEWER_TOOLS);
} catch (err) {
  log(`[quality-reviewer] error: ${err.message} — skipping`);
}

const qualityApproved = qualityOutput.trim().startsWith('APPROVED');
if (qualityApproved) {
  log('[quality-reviewer] APPROVED');
} else {
  log('[quality-reviewer] WARNINGS (non-blocking):');
  log(qualityOutput);
  if (fs.existsSync(NEXT_CHUNK_FILE)) {
    fs.appendFileSync(NEXT_CHUNK_FILE,
      `\n## Quality Reviewer Warnings\n${qualityOutput}\n`);
  }
}
```

- [ ] Smoke-test: run a real chunk end-to-end and verify all three phases appear in the log:

```
[implementer] starting
[implementer] done
[spec-reviewer] starting
[spec-reviewer] done
[spec-reviewer] APPROVED
[quality-reviewer] starting
[quality-reviewer] done
[quality-reviewer] APPROVED
[execute-chunk] status: success
```

- [ ] Commit:

```bash
git add harness/scripts/execute-chunk.js
git commit -m "feat(execute-chunk): add non-blocking quality reviewer"
```

---

### Task 5: Update CHANGELOG, VERSION, and docs

**Files:**
- Modify: `harness/CHANGELOG.md`
- Modify: `harness/VERSION`
- Modify: `harness/docs/agent-sessions.md`

- [ ] Read `harness/CHANGELOG.md` and `harness/VERSION`

- [ ] Update `harness/VERSION` to `0.2.0`

- [ ] Prepend to `harness/CHANGELOG.md`:

```markdown
## 0.2.0 — 2026-03-19

### Changed
- `execute-chunk.js` now runs a three-agent pipeline per chunk:
  implementer → spec reviewer → quality reviewer.
  All sessions load `settingSources: ['user']` giving access to superpowers skills.
  Spec failures trigger one implementer retry. Quality issues are non-blocking warnings
  appended to `project/runs/next-chunk.md`.
```

- [ ] In `harness/docs/agent-sessions.md`, add after the session loop diagram:

```markdown
### What execute-chunk.js does internally

Each `execute-chunk.js` run is a three-agent pipeline:
1. **Implementer** — executes the chunk steps, commits, writes handoff note
2. **Spec reviewer** — reads the plan chunk + handoff + diff, verifies all required steps were done (retries implementer once if not)
3. **Quality reviewer** — reviews the diff for bugs or issues (non-blocking — warnings logged in handoff)

All sessions have `settingSources: ['user']` so superpowers skills are available.
The CC orchestrator sees only the final exit code and `project/runs/next-chunk.md`.
```

- [ ] Commit:

```bash
git add harness/CHANGELOG.md harness/VERSION harness/docs/agent-sessions.md
git commit -m "docs: update CHANGELOG and agent-sessions for subagent pipeline (v0.2.0)"
```
