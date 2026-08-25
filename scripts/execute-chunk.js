#!/usr/bin/env node
/**
 * harness-core/scripts/execute-chunk.js — chunk executor with subagent review pipeline
 *
 * Runs a three-agent pipeline per chunk:
 *   1. Implementer   — executes the chunk, commits, writes handoff note
 *   2. Spec reviewer — verifies work matches plan chunk (retries implementer once if not)
 *   3. Quality reviewer — checks code quality (non-blocking, warnings only)
 *
 * All sessions load settingSources: ['user'] so superpowers skills are available.
 *
 * Usage:
 *   node ../harness-core/scripts/execute-chunk.js <plan-path> "<chunk name>"
 *
 * Example:
 *   node ../harness-core/scripts/execute-chunk.js project/plans/2.active/PBI-102-pypdfnet-v2.md "Chunk 4 — Stream filters"
 *
 * Exit codes:
 *   0 — agent reported status: success
 *   1 — Agent SDK error
 *   2 — agent reported status: failed (or no handoff written, or spec failed after retry)
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const [planPath, chunkName] = process.argv.slice(2);

if (!planPath || !chunkName) {
  process.stderr.write('Usage: node ../harness-core/scripts/execute-chunk.js <plan-path> "<chunk name>"\n');
  process.exit(1);
}

const NEXT_CHUNK_FILE = 'runs/next-chunk.md';
const LOG_FILE        = 'runs/last-run.log';

const IMPL_TOOLS     = ['Skill', 'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'];
const REVIEWER_TOOLS = ['Skill', 'Read', 'Bash', 'Glob', 'Grep'];

// ── Logging — mirrors output to project/runs/last-run.log ────────────────────

if (!fs.existsSync('runs')) fs.mkdirSync('runs', { recursive: true });
const logStream = fs.createWriteStream(LOG_FILE);

function emit(msg)    { process.stdout.write(msg); logStream.write(msg); }
function emitErr(msg) { process.stderr.write(msg); logStream.write(msg); }
function log(...args) { emit(args.join(' ') + '\n'); }

// ── Git helpers ───────────────────────────────────────────────────────────────

function getCurrentSha() {
  try { return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(); }
  catch { return 'HEAD'; }
}

function getCommitsSince(sha) {
  try { return execSync(`git log ${sha}..HEAD --oneline`, { encoding: 'utf8' }); }
  catch { return '(no new commits)'; }
}

function getDiffSince(sha) {
  try { return execSync(`git diff ${sha}..HEAD`, { encoding: 'utf8' }).slice(0, 8000); }
  catch { return '(no diff available)'; }
}

// ── Session runner ────────────────────────────────────────────────────────────

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

// ── Build implementer prompt ──────────────────────────────────────────────────

const pbiFile     = path.basename(planPath);
const pbiPath     = `plans/1.backlog/${pbiFile}`;
const planPathFwd = planPath.replace(/\\/g, '/');

function getGitStatus() {
  try { return execSync('git status --short', { encoding: 'utf8' }).trim() || '(clean)'; }
  catch { return '(unavailable)'; }
}

function getRecentCommits() {
  try { return execSync('git log --oneline -10', { encoding: 'utf8' }).trim(); }
  catch { return '(unavailable)'; }
}

function buildImplPrompt(extraContext) {
  return [
    `You are an implementation agent working in this repo.`,
    ``,
    `## Current repo state (recorded before this session started)`,
    ``,
    `### git status`,
    getGitStatus(),
    ``,
    `### recent commits`,
    getRecentCommits(),
    ``,
    `---`,
    ``,
    `Your task:`,
    `1. Read ${planPathFwd}`,
    `2. Read ${pbiPath} (if it exists — PBI may predate this run)`,
    `3. Execute "${chunkName}" — complete every step listed under that chunk heading`,
    `4. Verify your work: run tests with Bash and capture the actual output`,
    `5. Commit with a meaningful message`,
    `6. Write ${NEXT_CHUNK_FILE} with:`,
    `   - plan: <plan file path>`,
    `   - completed: <chunk name>`,
    `   - status: success   (or: failed)`,
    `   - next: <next chunk name, or "all done" if this was the last>`,
    `   - A brief "## What was done" summary`,
    `   - If status is failed: full error output under "## What failed"`,
    `7. Stop. Do not proceed to the next chunk.`,
    ``,
    `IMPORTANT — exit discipline:`,
    `If verification still fails after 2 attempts, stop trying. Instead:`,
    `  - Commit your work-in-progress: git commit -m "wip: ${chunkName} — tests failing"`,
    `  - Write ${NEXT_CHUNK_FILE} with status: failed and the full error output`,
    `  - Stop immediately.`,
    ...(extraContext ? [``, `## Additional context`, extraContext] : []),
  ].join('\n');
}

// ── Init worker ───────────────────────────────────────────────────────────────

function runInitWorker() {
  const ps1 = path.join(process.cwd(), 'init-worker.ps1');
  const sh  = path.join(process.cwd(), 'init-worker.sh');

  let cmd = null;
  if      (fs.existsSync(ps1)) cmd = 'pwsh -File init-worker.ps1';
  else if (fs.existsSync(sh))  cmd = 'bash init-worker.sh';

  if (!cmd) return; // no init script — skip

  log(`[init-worker] running: ${cmd}`);
  try {
    const output = execSync(cmd, { encoding: 'utf8', cwd: process.cwd() });
    log(`[init-worker] exit 0`);
    if (output) log(output);
  } catch (err) {
    emitErr(`[init-worker] failed (exit ${err.status}):\n${err.stdout}\n${err.stderr}\n`);
    const failNote = [
      `plan: ${planPath}`,
      `completed: (none — init-worker failed before chunk started)`,
      `status: failed`,
      `next: (none)`,
      ``,
      `## What failed`,
      `init-worker script exited with code ${err.status}`,
      ``,
      `### stdout`,
      err.stdout || '(none)',
      ``,
      `### stderr`,
      err.stderr || '(none)',
    ].join('\n');
    fs.writeFileSync(NEXT_CHUNK_FILE, failNote);
    process.exit(2);
  }
}

// ── Execute ───────────────────────────────────────────────────────────────────

log(`[execute-chunk] ${new Date().toISOString()}`);
log(`plan:  ${planPath}`);
log(`chunk: ${chunkName}`);
log('─'.repeat(60));

runInitWorker();

const startSha = getCurrentSha();

try {
  await runSession(buildImplPrompt(), 'implementer', IMPL_TOOLS);
} catch (err) {
  emitErr(`\n[execute-chunk] Agent SDK error: ${err.message}\n`);
  process.exit(1);
}

log('\n' + '─'.repeat(60));
log('Implementer session ended.');

// ── Evaluate handoff ──────────────────────────────────────────────────────────

let handoff = fs.existsSync(NEXT_CHUNK_FILE)
  ? fs.readFileSync(NEXT_CHUNK_FILE, 'utf8')
  : null;

// If no handoff was written, run a recovery implementer that writes one
// (implementer may have done valid work but forgotten the final write step)
if (!handoff) {
  emitErr('[execute-chunk] No handoff note written — running recovery implementer.\n');

  const recoveryPrompt = buildImplPrompt([
    `## Recovery task`,
    `The implementer just ran but forgot to write the handoff note.`,
    ``,
    `Review the commits made since the chunk started (git log ${startSha}..HEAD) and`,
    `determine whether the chunk requirements were satisfied.`,
    `Then write ${NEXT_CHUNK_FILE} with the correct status and summary.`,
    `If the chunk is complete, set status: success.`,
    `If gaps remain, set status: failed and list them under "## What failed".`,
    `Do not redo any implementation work — only write the handoff note.`,
  ].join('\n'));

  try {
    await runSession(recoveryPrompt, 'implementer-recovery', IMPL_TOOLS);
  } catch (err) {
    emitErr(`\n[execute-chunk] recovery error: ${err.message}\n`);
    process.exit(1);
  }
}

handoff = fs.existsSync(NEXT_CHUNK_FILE)
  ? fs.readFileSync(NEXT_CHUNK_FILE, 'utf8')
  : null;

if (!handoff) {
  emitErr('[execute-chunk] Handoff still missing after recovery — giving up.\n');
  process.exit(2);
}

const statusMatch = handoff.match(/^status:\s*(.+)$/m);
const status = statusMatch ? statusMatch[1].trim() : null;

if (!status) {
  emitErr('[execute-chunk] Handoff missing "status:" field.\n');
  process.exit(2);
}

if (status !== 'success') {
  emitErr(`[execute-chunk] status: ${status}\n`);
  process.exit(2);
}

// ── Spec compliance review ────────────────────────────────────────────────────

const newCommits = getCommitsSince(startSha);

function buildSpecPrompt(commits) {
  return [
    `You are a spec compliance reviewer. Your job: verify the implementation matches the plan chunk.`,
    ``,
    `Plan file: ${planPathFwd}`,
    `Chunk: "${chunkName}"`,
    `Handoff note: ${NEXT_CHUNK_FILE}`,
    `New commits since chunk started: ${commits || '(none)'}`,
    ``,
    `Steps:`,
    `1. Read the plan file and find the "${chunkName}" section`,
    `2. Read the handoff note`,
    `3. Read any files that were changed (use Bash/git diff as needed)`,
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
}

let specOutput = '';
try {
  specOutput = await runSession(buildSpecPrompt(newCommits), 'spec-reviewer', REVIEWER_TOOLS);
} catch (err) {
  log(`[spec-reviewer] error: ${err.message} — skipping`);
}

let specApproved = /^\s*APPROVED\s*$/m.test(specOutput);

if (specApproved) {
  log('[spec-reviewer] APPROVED');
} else {
  log('[spec-reviewer] ISSUES FOUND — retrying implementer once');
  log(specOutput);

  const retryPrompt = buildImplPrompt([
    `## Spec review feedback — fix these gaps before finishing`,
    specOutput,
    ``,
    `Do not re-investigate from scratch. Address only the listed gaps.`,
    `Re-write ${NEXT_CHUNK_FILE} with the updated outcome when done.`,
  ].join('\n'));

  if (fs.existsSync(NEXT_CHUNK_FILE)) fs.unlinkSync(NEXT_CHUNK_FILE);

  try {
    await runSession(retryPrompt, 'implementer-retry', IMPL_TOOLS);
  } catch (err) {
    emitErr(`\n[execute-chunk] retry error: ${err.message}\n`);
    process.exit(1);
  }

  const retryCommits = getCommitsSince(startSha);
  let retrySpecOutput = '';
  try {
    retrySpecOutput = await runSession(buildSpecPrompt(retryCommits), 'spec-reviewer-retry', REVIEWER_TOOLS);
  } catch (err) {
    log(`[spec-reviewer-retry] error: ${err.message} — skipping`);
  }

  specApproved = /^\s*APPROVED\s*$/m.test(retrySpecOutput);
  if (specApproved) {
    log('[spec-reviewer-retry] APPROVED');
  } else {
    log('[spec-reviewer-retry] still failing — escalating');
    log(retrySpecOutput);
    emitErr('[execute-chunk] spec compliance failed after retry\n');
    process.exit(2);
  }
}

// ── Quality review (non-blocking) ─────────────────────────────────────────────

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

const qualityApproved = /^\s*APPROVED\s*$/m.test(qualityOutput);
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

// ── Done ──────────────────────────────────────────────────────────────────────

log('\n' + '─'.repeat(60));
log('[execute-chunk] status: success');
