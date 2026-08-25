// harness/scripts/lib/session-log.js
// Persistent JSONL session log. One file per sheep session.
// Written incrementally (flushed per line) — partial logs survive crashes.

import fs from 'node:fs';
import path from 'node:path';

export function createSessionLog(runsDir) {
  fs.mkdirSync(runsDir, { recursive: true });
  const ts = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
  const filename = `sheep-${ts}-${process.pid}.jsonl`;
  const logPath = path.join(runsDir, filename);
  const stream = fs.createWriteStream(logPath);

  function write(entry) {
    stream.write(JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n');
  }

  return {
    logPath,
    rpcIn:    (method, payload) => write({ type: 'rpc_in',   method, payload }),
    rpcOut:   (method, payload) => write({ type: 'rpc_out',  method, payload }),
    internal: (event,  data)    => write({ type: 'internal', event,  ...data }),
    close: () => new Promise((resolve, reject) =>
      stream.end(err => err ? reject(err) : resolve())
    ),
  };
}
