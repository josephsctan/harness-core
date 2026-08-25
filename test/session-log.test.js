import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createSessionLog } from '../scripts/lib/session-log.js';

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'session-log-test-'));
}

function readLines(logPath) {
  return fs.readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(l => l.trim())
    .map(l => JSON.parse(l));
}

test('creates a .jsonl file in the given directory', async () => {
  const dir = tmpDir();
  const log = createSessionLog(dir);
  log.rpcIn('sheep.start', { prompt: 'hello' });
  await log.close();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'));
  assert.equal(files.length, 1);
});

test('rpcIn writes a type:rpc_in entry', async () => {
  const dir = tmpDir();
  const log = createSessionLog(dir);
  log.rpcIn('sheep.start', { prompt: 'x' });
  await log.close();
  const [entry] = readLines(log.logPath);
  assert.equal(entry.type, 'rpc_in');
  assert.equal(entry.method, 'sheep.start');
  assert.deepEqual(entry.payload, { prompt: 'x' });
  assert.ok(entry.ts);
});

test('rpcOut writes a type:rpc_out entry', async () => {
  const dir = tmpDir();
  const log = createSessionLog(dir);
  log.rpcOut('sheep.done', { summary: 'done', filesChanged: [] });
  await log.close();
  const [entry] = readLines(log.logPath);
  assert.equal(entry.type, 'rpc_out');
  assert.equal(entry.method, 'sheep.done');
});

test('internal writes a type:internal entry with event field', async () => {
  const dir = tmpDir();
  const log = createSessionLog(dir);
  log.internal('turn_start', { turn: 1 });
  await log.close();
  const [entry] = readLines(log.logPath);
  assert.equal(entry.type, 'internal');
  assert.equal(entry.event, 'turn_start');
  assert.equal(entry.turn, 1);
});

test('multiple entries written in order', async () => {
  const dir = tmpDir();
  const log = createSessionLog(dir);
  log.rpcIn('sheep.start', {});
  log.internal('turn_start', { turn: 1 });
  log.rpcOut('sheep.done', { summary: '', filesChanged: [] });
  await log.close();
  const entries = readLines(log.logPath);
  assert.equal(entries.length, 3);
  assert.equal(entries[0].type, 'rpc_in');
  assert.equal(entries[1].type, 'internal');
  assert.equal(entries[2].type, 'rpc_out');
});
