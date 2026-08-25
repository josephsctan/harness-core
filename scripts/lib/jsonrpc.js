// harness/scripts/lib/jsonrpc.js
// JSON-RPC 2.0 framing for newline-delimited stdio transport.

export function serialize(msg) {
  return JSON.stringify(msg) + '\n';
}

export function createParser(onMessage) {
  let buf = '';
  return {
    push(chunk) {
      buf += chunk;
      const lines = buf.split('\n');
      buf = lines.pop(); // last element is incomplete or empty
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) onMessage(JSON.parse(trimmed));
      }
    },
  };
}

export function makeRequest(id, method, params) {
  return { jsonrpc: '2.0', id, method, params };
}

export function makeNotification(method, params) {
  return { jsonrpc: '2.0', method, params };
}

export function makeResponse(id, result) {
  return { jsonrpc: '2.0', id, result };
}

export function makeErrorResponse(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}
