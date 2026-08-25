# Troubleshooting

Environment-specific tips and known gotchas. Scan for your stack before debugging.
Add new entries as you encounter them — note the environment at the top of the section.

---

## If you're working on Windows (all stacks)

### Junction paths are transparent — mostly

`C:\JST\Repos` is a Windows junction pointing to `C:\Users\JT773\source\repos\`.
They are the same directory. Do not treat them as separate locations. Most tools
handle this transparently, but a few (Vite, some path resolvers) resolve to the real
path — see the Vite entry below.

### Never use `2>/dev/null`

On Windows, `2>/dev/null` creates a file literally named `nul` in the working
directory. It cannot be deleted via Explorer.

Use `2>&1 | Out-Null` in PowerShell instead, or just let errors show.

To delete an accidentally created `nul` file:
```powershell
Remove-Item -Path .\nul -Force
```

### Killing a runaway agent

If a Node/Claude process won't respond to Ctrl+C:
```powershell
Get-Process node,claude | Stop-Process -Force
```
`taskkill` via cmd/bash is unreliable on Windows — use PowerShell.

---

## If you're working with a Python backend

### Stale `__pycache__` blocks hot-reload fixes

**Symptom:** A fix is confirmed in the `.py` file but the running server still
exhibits the old behaviour after Uvicorn's hot-reload.

**Cause:** The bytecode cache (`__pycache__`) is stale. The hot-reload picked up the
old `.pyc` before the new one was written.

**Fix:** Stop the server, clear the cache, restart clean:
```bash
find . -type d -name __pycache__ -exec rm -rf {} +
```

**Prevention:** Startup scripts should delete `__pycache__` before starting Uvicorn:
```powershell
Get-ChildItem -Recurse -Filter __pycache__ | Remove-Item -Recurse -Force
uvicorn app.main:app --reload
```

---

## If you're working with a Vite frontend

### Windows junction paths break `fs.strict`

**Symptom:** Vite dev server starts but requests fail with
`403 The request url is outside of Vite serving allow list`. Only happens when
started from a junction path (e.g. `C:\JST\Repos\...`).

**Cause:** Vite computes `fs.allow` from CWD but resolves it to the real path.
Requests via the junction path don't match.

**Fix:** Anchor `fs.allow` to the config file's real path in `vite.config.js`:
```js
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  server: {
    fs: { allow: [__dirname] }
  }
})
```
`import.meta.url` always resolves to the real path regardless of how the server
was started. Include this in any plan that sets up a Vite frontend on Windows.

---

## If you're working with Node / the harness scripts

### `node_modules` missing in a new worktree

**Symptom:** `node scripts/execute-chunk.js` fails with `ERR_MODULE_NOT_FOUND` for
`@anthropic-ai/claude-agent-sdk` immediately after `git worktree add`.

**Cause:** `node_modules` is gitignored and not shared between worktrees.

**Fix:**
```bash
cd ../mini-harness--wt-<plan-name>
npm install
```

---

## If you're working with a React frontend

### `useEffect` fires twice on mount in development

React Strict Mode intentionally fires effects twice in development to surface
side-effect bugs. Any `useEffect` that triggers an API call on mount must include
an idempotency guard:
```js
useEffect(() => {
  if (dataAlreadyLoaded) return   // ← always include this
  fetchData()
}, [trigger])
```
Without the guard, two concurrent requests fire on every mount during development.

### Markdown in assistant responses renders as raw text

Claude's responses use markdown. If you render them as plain text, users see
`**bold**` instead of **bold**. Use `react-markdown` for assistant message bubbles;
plain text is fine for user bubbles.
