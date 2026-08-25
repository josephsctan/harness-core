# Design + Plan: Shepherd–Sheep over Redis + Azure Container Instances

**Date:** 2026-03-21
**Branch:** `dev-aci` (branched from `main`, primitives seeded from `dev-rpc`)
**Status:** Draft — awaiting human review before implementation begins

---

## Background

`dev-rpc` proved the shepherd/sheep concept over stdio: a bidirectional JSON-RPC 2.0 channel between a host process (shepherd) and a Claude Agent SDK child process (sheep), with real-time progress streaming and post-session steering. All three test levels pass.

`dev-aci` takes the next step: replace the stdio pipe with Redis pub/sub and replace the local child process with an ephemeral Azure Container Instance. The JSON-RPC 2.0 protocol is **unchanged** — only the transport and process lifecycle change.

`harness-aci-test` (separate repo) already proves ACI + Agent SDK works. This design builds on those learnings.

---

## What is already on dev-aci (seeded from dev-rpc)

| File | Purpose |
|---|---|
| `harness/scripts/lib/jsonrpc.js` | JSON-RPC 2.0 framing — serialize, parse, make* factories |
| `harness/scripts/lib/session-log.js` | JSONL session log writer (rpc_in, rpc_out, internal entries) |
| `harness/scripts/sheep.js` | Agent SDK session loop, steer queue, progress events — **stdio transport hardcoded** |
| `harness/test/jsonrpc.test.js` | 8 passing unit tests for jsonrpc.js |
| `harness/test/session-log.test.js` | Passing unit tests for session-log.js |

These files are the starting point. The plan below modifies and extends them.

---

## Architecture

```
Developer laptop (CC session — shepherd)
  │
  │  1. token = crypto.randomUUID()
  │  2. subscribe  Redis  sheep:{token}:out
  │  3. az container create ──────────────────────► ACI (sheep container)
  │                                                      │
  │  ◄── sheep:{token}:out ── sheep.ready ───────────────┤  (container subscribed)
  │  ──► sheep:{token}:in  ── sheep.start ───────────────►│
  │  ◄── sheep:{token}:out ── sheep.progress (streaming) ─┤
  │  ◄── sheep:{token}:out ── sheep.done ─────────────────┤
  │                                                      │  process.exit(0)
  │  [if human steers]
  │  ──► sheep:{token}:in  ── sheep.steer ───────────────►│  (second session)
  │  ◄── sheep:{token}:out ── sheep.done ─────────────────┤
  │
  │  4. az container delete
  │  5. transport.close()
  │  6. (optional) download sheep.jsonl from file share
```

**Message bus:** Azure Cache for Redis (pub/sub, TLS)
**Channels:**
- `sheep:{token}:in`  — shepherd → sheep  (`sheep.start`, `sheep.steer`, `sheep.stop`)
- `sheep:{token}:out` — sheep → shepherd  (`sheep.ready`, `sheep.progress`, `sheep.done`)

**Container lifecycle:** One ACI per task. `--restart-policy Never`. Shepherd deletes it after `sheep.done`.

---

## Protocol additions (Redis-only)

One new message not present in the stdio protocol:

| Method | Direction | Payload | Why |
|---|---|---|---|
| `sheep.ready` | sheep → shepherd | `{ token }` | Container subscribes to Redis asynchronously. Shepherd must not send `sheep.start` until sheep has subscribed. Without this handshake, `sheep.start` is lost. |

All other messages (`sheep.start`, `sheep.steer`, `sheep.stop`, `sheep.progress`, `sheep.done`) are **identical** to the stdio design.

---

## Key learnings from harness-aci-test

These must be reflected in the implementation:

| Learning | Implication |
|---|---|
| ACI containers run as root | `permissionMode` must be `'acceptEdits'` — `'bypassPermissions'` is rejected by the CLI when running as root |
| No user settings in container | `settingSources` must be `['project']` — agent context comes from CLAUDE.md on the workspace or the prompt param |
| ACI cold start is ~25s | `sheep.ready` timeout in shepherd must be at least 60s |
| Azure File Share directory creation is strict | Create `jobs/` before `jobs/{token}/` — parent dirs must exist first |
| `az acr build` builds in cloud | No local Docker needed — use `--no-wait` + poll `az acr repository show-tags` |
| One image, many agent types | All CLAUDE.md files baked into image; `AGENT_NAME` selects at runtime |

---

## Implementation tasks

### Task 1 — Transport abstraction

**Goal:** Extract the stdio wiring from `sheep.js` into `transport-stdio.js`, and create `transport-redis.js`. Both implement the same interface.

**Transport interface:**
```js
{
  onMessage(handler: (msg: object) => void): void,
  send(msg: object): Promise<void> | void,
  close(): Promise<void>,
}
```

**Files to create:**
- `harness/scripts/lib/transport-stdio.js` — extract existing stdio wiring from sheep.js
- `harness/scripts/lib/transport-redis.js` — Redis pub/sub transport

**`transport-redis.js` outline:**
```js
import { createClient } from 'redis';
import { serialize } from './jsonrpc.js';

export async function createRedisTransport(redisUrl, token, role) {
  // role = 'shepherd' | 'sheep'
  const pub = createClient({ url: redisUrl });
  const sub = createClient({ url: redisUrl });
  await Promise.all([pub.connect(), sub.connect()]);

  const inCh  = `sheep:${token}:in`;
  const outCh = `sheep:${token}:out`;
  const listenOn = role === 'shepherd' ? outCh : inCh;
  const sendTo   = role === 'shepherd' ? inCh  : outCh;

  return {
    onMessage: handler => sub.subscribe(listenOn, msg => handler(JSON.parse(msg))),
    send:      msg     => pub.publish(sendTo, JSON.stringify(msg)),
    close:     ()      => Promise.all([pub.quit(), sub.quit()]).then(() => {}),
  };
}
```

**`package.json`:** add `redis` to dependencies.

**Tests:** Add `harness/test/transport-redis.test.js` — connect two transports (shepherd + sheep roles) on a real local Redis, send 3 messages each direction, verify all received.

> **Note:** This test requires a local Redis running (`redis-server` or Docker). Mark it `node:test skip` if `REDIS_URL` is not set, so CI doesn't break.

---

### Task 2 — Refactor sheep.js to use transport abstraction

**Goal:** sheep.js selects transport at startup based on env vars. Internals use `transport.send()` / `transport.onMessage()` — no direct stdout/stdin references.

**Entry point logic:**
```js
// If REDIS_URL + CHANNEL_TOKEN are set: use Redis transport (running in ACI)
// Otherwise: use stdio transport (local dev/testing)
const transport = process.env.REDIS_URL
  ? await createRedisTransport(process.env.REDIS_URL, process.env.CHANNEL_TOKEN, 'sheep')
  : createStdioTransport();
```

**permissionMode fix:** Change `'bypassPermissions'` → `'acceptEdits'` (required for ACI root).

**settingSources fix:** Change `['user']` → `['project']` (no user settings in container).

**sheep.ready handshake (Redis mode only):** After `transport.onMessage()` is registered, if transport is Redis, immediately send `sheep.ready` before waiting for `sheep.start`.

**RUNS_DIR:** Keep the existing `import.meta.url`-anchored path for stdio mode. In Redis mode, write to `/workspace/jobs/${process.env.CHANNEL_TOKEN}/sheep.jsonl`.

**No behaviour changes** to session logic, steer queue, or done/stop handling.

---

### Task 3 — shepherd-aci.js

**Goal:** New shepherd script that uses Redis transport and spins up ACI containers instead of child processes.

**File:** `harness/scripts/shepherd-aci.js`

**Responsibilities:**
1. Load `.env` (via `dotenv` or manual `fs.readFileSync`)
2. Generate `token = crypto.randomUUID()`
3. Create Azure File Share directories for the job
4. Create Redis transport (shepherd role), subscribe to `sheep:{token}:out`
5. Spin up ACI container with token + credentials as env vars
6. Wait for `sheep.ready` (timeout 60s)
7. Send `sheep.start`
8. Stream `sheep.progress` events to console
9. On `sheep.done`: log summary, optionally download `sheep.jsonl`
10. Send `sheep.stop`
11. Wait for container to terminate (poll `az container show`, timeout 60s)
12. Force-delete container
13. `transport.close()`

**ACI create command (via `execSync` or `spawn`):**
```bash
az container create \
  --resource-group $RG \
  --name sheep-${token} \
  --image harnessacitest.azurecr.io/cc-agent-sheep:latest \
  --restart-policy Never \
  --environment-variables \
    REDIS_URL="$REDIS_URL" \
    CHANNEL_TOKEN="$token" \
    CLAUDE_CODE_USE_FOUNDRY=1 \
    ANTHROPIC_FOUNDRY_API_KEY="$KEY" \
    ANTHROPIC_FOUNDRY_BASE_URL="$URL" \
    ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-haiku-4-5 \
    ANTHROPIC_DEFAULT_SONNET_MODEL=claude-sonnet-4-6 \
  --azure-file-volume-account-name $STORAGE_ACCOUNT \
  --azure-file-volume-share-name agent-jobs \
  --azure-file-volume-mount-path /workspace \
  --cpu 1 --memory 1.5 \
  --no-wait
```

**Test flags (same pattern as shepherd.js on dev-rpc):**
- `--test=redis` — Level 1: Redis transport smoke test (no ACI, local sheep process)
- `--test=sdk`   — Level 2: Full ACI round-trip, trivial prompt
- `--test=steer` — Level 3: ACI steering test

**`.env` file** (gitignored, lives at repo root):
```
REDIS_URL=rediss://:...@harness-redis.redis.cache.windows.net:6380
AZURE_RESOURCE_GROUP=...
AZURE_STORAGE_ACCOUNT=...
AZURE_STORAGE_KEY=...
ANTHROPIC_FOUNDRY_API_KEY=...
ANTHROPIC_FOUNDRY_BASE_URL=...
```

---

### Task 4 — Container image

**Goal:** Build a new image `harnessacitest.azurecr.io/cc-agent-sheep:latest` that runs sheep.js.

**Dockerfile:** `harness/docker/Dockerfile.sheep`

```dockerfile
FROM harnessacitest.azurecr.io/cc-agent:latest

WORKDIR /app/sheep

# Copy sheep runtime
COPY harness/scripts/lib/jsonrpc.js        ./lib/jsonrpc.js
COPY harness/scripts/lib/session-log.js    ./lib/session-log.js
COPY harness/scripts/lib/transport-redis.js ./lib/transport-redis.js
COPY harness/scripts/sheep.js              ./sheep.js
COPY package.json                          ./package.json

RUN npm install --omit=dev

CMD ["node", "./sheep.js"]
```

**Build command** (no local Docker):
```bash
az acr build \
  --registry harnessacitest \
  --image cc-agent-sheep:latest \
  --file harness/docker/Dockerfile.sheep \
  .
```

**Note:** The base image `cc-agent:latest` already has Node.js, the Agent SDK, and the APIM-compatible Claude CLI. We only add the sheep-specific files and the `redis` npm package.

---

### Task 5 — Level 1: Redis transport smoke test

**Goal:** Validate the Redis transport in isolation. No ACI. Shepherd spawns sheep.js locally as a child process but with `REDIS_URL` + `CHANNEL_TOKEN` set, so both sides use Redis instead of stdio.

**Run:** `node harness/scripts/shepherd-aci.js --test=redis`

**What happens:**
1. Shepherd generates token, creates Redis transport
2. Shepherd spawns `node harness/scripts/sheep.js` with env `REDIS_URL=...` and `CHANNEL_TOKEN=...`
3. Sheep starts, creates Redis transport, sends `sheep.ready`
4. Shepherd sends `sheep.start` with trivial stub prompt
5. Sheep sends `sheep.done` immediately (stub mode — no real SDK call, just echoes a canned response)
6. Shepherd receives `sheep.done`, sends `sheep.stop`, child exits

**Pass:** Round-trip completes within 10s. No ACI involved.

> **Stub mode:** sheep.js checks for `STUB_MODE=1` env var. If set, skips the SDK call and sends a canned `sheep.done` response. This allows transport testing without API credentials.

---

### Task 6 — Level 2: ACI integration test

**Goal:** Full ACI round-trip with a real Agent SDK session.

**Run:** `node harness/scripts/shepherd-aci.js --test=sdk`

**Prompt:** `"List the files in /workspace and write a one-sentence description of what the workspace is for."`

**Pass criteria:**
- Container reaches Running state
- At least one `sheep.progress { kind: 'tool' }` received
- At least one `sheep.progress { kind: 'assistant' }` received
- `sheep.done` with non-empty summary received within 3 minutes
- Container terminates and is deleted
- `sheep.jsonl` exists on file share

---

### Task 7 — Level 3: ACI steering test

**Goal:** Post-session steering over ACI + Redis, same behavioural criterion as the stdio Level 3.

**Run:** `node harness/scripts/shepherd-aci.js --test=steer`

**What happens:**
1. Sheep runs first session — explores `/workspace` and summarises all files found
2. Shepherd receives `sheep.done`, sends `sheep.steer` — "Produce a summary covering ONLY the CLAUDE.md files."
3. Sheep runs second session with amended prompt
4. Shepherd receives second `sheep.done`

**Pass criteria:**
1. `sheep.progress { kind: 'steer_injected' }` received before second session
2. Second summary covers only CLAUDE.md files (human-evaluated)

---

## Infrastructure

### Azure Cache for Redis (new resource)

```bash
az redis create \
  --resource-group <rg> \
  --name harness-redis \
  --sku Basic \
  --vm-size C0 \
  --location australiaeast
```

SKU Basic C0 is sufficient (pub/sub only, no persistence needed).
Connection string uses TLS: `rediss://:${KEY}@harness-redis.redis.cache.windows.net:6380`

### Azure File Share

Re-uses existing `agent-jobs` share from harness-aci-test.
Shepherd creates `jobs/{token}/` before container starts.

### ACR

Re-uses `harnessacitest.azurecr.io`. New image tag: `cc-agent-sheep:latest`.

---

## File map

```
harness/
  scripts/
    lib/
      jsonrpc.js              ← seeded (unchanged)
      session-log.js          ← seeded (unchanged)
      transport-stdio.js      ← Task 1 (new — extracted from sheep.js)
      transport-redis.js      ← Task 1 (new)
    sheep.js                  ← Task 2 (modified — transport abstraction, permissionMode fix)
    shepherd-aci.js           ← Task 3 (new)
  docker/
    Dockerfile.sheep          ← Task 4 (new)
  test/
    jsonrpc.test.js           ← seeded (unchanged)
    session-log.test.js       ← seeded (unchanged)
    transport-redis.test.js   ← Task 1 (new)

package.json                  ← Task 1 (add redis dep, add transport-redis.test.js to test script)
.env                          ← Task 3 (gitignored, created manually)
.env.example                  ← Task 3 (new — committed, shows required vars)
```

---

## Out of scope for dev-aci

- GitHub Issues / PBI integration
- Multiple concurrent sheep (parallel ACI instances)
- Warm/pooled containers
- Automatic retry on container failure
- A shepherd that persists across CC sessions
- Anything requiring changes to harness-aci-test repo

---

## Success criterion

Level 3 passes over ACI: a steering message demonstrably changes the sheep's output, with the sheep running as an ephemeral Azure Container Instance and all communication flowing through Redis pub/sub. The full stack — CC shepherd → Redis → ACI sheep → Anthropic via APIM — is proven end-to-end.
