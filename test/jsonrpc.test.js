import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  serialize,
  createParser,
  makeRequest,
  makeNotification,
  makeResponse,
  makeErrorResponse,
} from '../scripts/lib/jsonrpc.js';

test('serialize produces newline-terminated JSON', () => {
  const msg = makeNotification('sheep.progress', { kind: 'status', text: 'hi' });
  const out = serialize(msg);
  assert.ok(out.endsWith('\n'));
  assert.deepEqual(JSON.parse(out.trimEnd()), msg);
});

test('createParser handles a single complete message', () => {
  const messages = [];
  const parser = createParser(msg => messages.push(msg));
  const msg = makeNotification('sheep.done', { summary: 'ok', filesChanged: [] });
  parser.push(serialize(msg));
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0], msg);
});

test('createParser handles two messages in one chunk', () => {
  const messages = [];
  const parser = createParser(msg => messages.push(msg));
  const a = makeNotification('sheep.progress', { kind: 'tool', text: 'Glob' });
  const b = makeNotification('sheep.done', { summary: 'done', filesChanged: [] });
  parser.push(serialize(a) + serialize(b));
  assert.equal(messages.length, 2);
});

test('createParser handles a message split across two chunks', () => {
  const messages = [];
  const parser = createParser(msg => messages.push(msg));
  const msg = makeRequest(1, 'sheep.start', { prompt: 'hello', allowedTools: [] });
  const full = serialize(msg);
  parser.push(full.slice(0, 10));
  assert.equal(messages.length, 0);
  parser.push(full.slice(10));
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0], msg);
});

test('makeRequest produces valid JSON-RPC 2.0 request', () => {
  const r = makeRequest(42, 'sheep.start', { prompt: 'x' });
  assert.equal(r.jsonrpc, '2.0');
  assert.equal(r.id, 42);
  assert.equal(r.method, 'sheep.start');
});

test('makeNotification has no id field', () => {
  const n = makeNotification('sheep.steer', { message: 'go' });
  assert.equal(n.jsonrpc, '2.0');
  assert.equal('id' in n, false);
});

test('makeResponse includes result', () => {
  const r = makeResponse(1, { ok: true });
  assert.deepEqual(r.result, { ok: true });
  assert.equal(r.id, 1);
});

test('makeErrorResponse includes error object', () => {
  const r = makeErrorResponse(1, -32000, 'init failed');
  assert.equal(r.error.code, -32000);
  assert.equal(r.error.message, 'init failed');
});
