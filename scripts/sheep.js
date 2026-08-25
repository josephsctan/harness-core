#!/usr/bin/env node
// harness/scripts/sheep.js
// JSON-RPC 2.0 server over stdio. Wraps Claude Agent SDK session.
// All non-JSON-RPC output goes to stderr only.

import { query } from '@anthropic-ai/claude-agent-sdk';
import { execSync } from 'node:child_process';
import { createParser, makeResponse, makeNotification, serialize } from './lib/jsonrpc.js';
import { createSessionLog } from './lib/session-log.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Anchor RUNS_DIR to the repo root (two levels up from harness/scripts/)
// so logs always land in project/runs/ regardless of where shepherd was invoked.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNS_DIR = path.resolve(__dirname, '../../project/runs');
const log = createSessionLog(RUNS_DIR);

process.stderr.write(`[sheep] pid=${process.pid} log=${log.logPath}\n`);

let stopRequested = false;
const steerQueue = [];

// Resolvers for post-session steer/stop waiting
let steerArrived = null; // set to a resolve fn when waiting for steer
let stopArrived = null;  // set to a resolve fn when waiting for stop

function send(msg) {
  process.stdout.write(serialize(msg));
  log.rpcOut(msg.method ?? `response:${msg.id}`, msg.params ?? msg.result ?? msg.error);
}

const parser = createParser(async msg => {
  log.rpcIn(msg.method, msg.params);

  if (msg.method === 'sheep.start') {
    send(makeResponse(msg.id, { ok: true }));

    const sessionParams = msg.params;

    // Run first session
    await runSession(sessionParams).catch(err => {
      process.stderr.write(`[sheep] session error: ${err.message}\n`);
      process.exit(1);
    });

    // After first session: wait up to 30s for a steer or stop
    process.stderr.write('[sheep] first session done, waiting for steer or stop\n');
    const gotSteer = await waitForSteerOrStop(30_000);

    if (gotSteer && steerQueue.length > 0) {
      const steerMsg = steerQueue.splice(0).join('\n\n');
      const steeredPrompt = `${sessionParams.prompt}\n\n[Shepherd steering note: ${steerMsg}]`;
      send(makeNotification('sheep.progress', { kind: 'steer_injected', text: steerMsg }));
      log.internal('steer_injected', { turn: 0, message: steerMsg });

      await runSession({ ...sessionParams, prompt: steeredPrompt }).catch(err => {
        process.stderr.write(`[sheep] steered session error: ${err.message}\n`);
        process.exit(1);
      });
    }

    // Done — wait for stop
    process.stderr.write('[sheep] sessions complete, waiting for stop\n');
  } else if (msg.method === 'sheep.steer') {
    steerQueue.push(msg.params.message);
    log.internal('steer_queued', { message: msg.params.message });
    if (steerArrived) { steerArrived(true); steerArrived = null; }
  } else if (msg.method === 'sheep.stop') {
    stopRequested = true;
    if (stopArrived) { stopArrived(false); stopArrived = null; }
    if (steerArrived) { steerArrived(false); steerArrived = null; }
    await log.close();
    process.exit(0);
  }
});

// Returns true if a steer arrived, false if stop arrived or timed out
function waitForSteerOrStop(timeoutMs) {
  if (steerQueue.length > 0) return Promise.resolve(true);
  if (stopRequested) return Promise.resolve(false);
  return new Promise(resolve => {
    steerArrived = resolve;
    stopArrived = resolve;
    setTimeout(() => {
      steerArrived = null;
      stopArrived = null;
      resolve(false);
    }, timeoutMs);
  });
}

process.stdin.on('data', chunk => parser.push(chunk.toString()));
process.stdin.on('end', () => process.exit(0));

// ── Session runner ─────────────────────────────────────────────────────────────

function getHeadSha() {
  try { return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(); }
  catch { return ''; }
}

function getChangedFiles(startSha) {
  if (!startSha) return [];
  try {
    const out = execSync(`git diff --name-only ${startSha}..HEAD`, { encoding: 'utf8' });
    return out.trim().split('\n').filter(Boolean);
  } catch { return []; }
}

// NOTE: SDK discovery found no `messages` parameter. Using single query() call with maxTurns: 50.
// Steering via steerQueue is not possible mid-session with this SDK shape.
// Level 3 steering test will be re-evaluated: steer messages received after sheep.done
// will be used to start a fresh session with the amended prompt.
async function runSession({ prompt, allowedTools, cwd }) {
  const sessionCwd = cwd ?? process.cwd();
  const startSha = getHeadSha();
  let lastAssistantText = '';

  try {
    for await (const message of query({
      prompt,
      options: {
        cwd: sessionCwd,
        allowedTools,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        maxTurns: 50,
      },
    })) {
      if (message.type === 'assistant') {
        for (const block of message.message?.content ?? []) {
          if (block.type === 'text') {
            lastAssistantText = block.text;
            send(makeNotification('sheep.progress', { kind: 'assistant', text: block.text }));
          } else if (block.type === 'tool_use') {
            send(makeNotification('sheep.progress', {
              kind: 'tool',
              text: `${block.name}: ${JSON.stringify(block.input).slice(0, 80)}`,
            }));
          }
        }
      }
    }
  } catch (err) {
    process.stderr.write(`[sheep] SDK error: ${err.message}\n`);
    log.internal('sdk_error', { message: err.message });
    await log.close();
    process.exit(1);
  }

  const filesChanged = getChangedFiles(startSha);
  send(makeNotification('sheep.done', { summary: lastAssistantText, filesChanged }));
  log.internal('session_end', { stop_reason: 'end_turn', turns: 1 });
}
