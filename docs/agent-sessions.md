# Agent Session Hygiene

Agents work best in short, focused sessions with clear boundaries. Long sessions
accumulate context, hit timeouts, and spiral. This document defines how to run
sessions safely.

## The Golden Rule

**One chunk per session. Commit. Stop. Start fresh.**

A "chunk" is a `## Chunk N` section in a plan. It ends with a commit. That commit
is the session boundary — the executor stops, the orchestrator picks up the next chunk.

## The Session Loop

CC drives the loop directly as the orchestrator. `execute-chunk.js` is the chunk
executor — it takes a plan path and chunk name, runs a three-agent pipeline, and
exits with a structured result. CC decides what to run and what to do with the result.

### What execute-chunk.js does internally

Each `execute-chunk.js` run is a three-agent pipeline:
1. **Implementer** — executes the chunk steps, commits, writes handoff note
2. **Spec reviewer** — reads the plan chunk + handoff + diff, verifies all required steps were done (retries implementer once if not)
3. **Quality reviewer** — reviews the diff for bugs or issues (non-blocking — warnings logged in handoff)

All sessions have `settingSources: ['user']` so superpowers skills are available.
The CC orchestrator sees only the final exit code and `project/runs/next-chunk.md`.

```
CC orchestrator session:
  read plan → find next incomplete chunk
  run: node ../harness-core/scripts/execute-chunk.js <plan> "<chunk>"
  sleep 30 && tail -30 project/runs/last-run.log   ← watch progress
  read project/runs/next-chunk.md                  ← review outcome
  if failed: adjust plan if needed, retry (max 2x, then escalate)
  if success: mark chunk done in plan, go to next chunk
  stop when all chunks done or stuck
```

Start an orchestrator session with:

```
Orchestrate PBI-NNN to completion.
Plan: plans/2.active/PBI-NNN-name.md

For each chunk:
1. Find the next incomplete chunk (unchecked - [ ] under a ## Chunk heading)
2. node ../harness-core/scripts/execute-chunk.js <plan-path> "<chunk name>"
3. sleep 30 && tail -30 runs/last-run.log
4. Read runs/next-chunk.md — review the outcome
5. If status: failed — read the failure notes, adjust the plan if the
   approach needs to change, retry the same chunk. If it fails twice, stop
   and tell me.
6. If status: success — mark the chunk complete in the plan.
   Verify the commit landed on the correct branch:
     git log --oneline <feature-branch> -3
   If the latest commit is not present on the feature branch, stop and tell me before
   proceeding. Then go to 1.
Stop when all chunks are done or you need my input.
```

**Always run from the repo root — or, when using a worktree, from the worktree root.** Running from the main checkout while the worktree is on a different branch causes implementer agents to commit to the wrong branch.

Worktree execution (worktrees are siblings of the project repo in the workspace):
```
cd <worktree-path>
node ../harness-core/scripts/execute-chunk.js <plan-path> "<chunk name>"
```

Never construct session prompts manually.

## After All Chunks Complete — Merge to `main`

When the final chunk writes `next: all done`, the shepherd must:

1. Set plan `status` to `built` in the plan file frontmatter
2. Run the full Playwright suite from the worktree — **do not merge until it is green**
3. Merge the feature branch to `main` (from the main checkout):
   ```bash
   git checkout main && git merge feat/<branch-name>
   ```
4. Remove the worktree and delete the feature branch:
   ```bash
   git worktree remove ../<project>--wt-<branch-name>
   git branch -d feat/<branch-name>
   ```
5. Tell the human: "PBI-NNN merged to main and ready to test. Server is running on main."

The human then tests on main (one server, all features integrated). If issues are found:
- **Minor/visual fixes**: implement directly on main as cosmetic changes
- **Functional bugs or regressions**: log a new PBI, plan and execute in a new worktree, merge back to main

**"I accept"** closes the review cycle (the human is satisfied with the feature) — it does not
trigger the merge. The merge already happened after the final chunk.

Testing always happens on main because:
- Multiple features merged to main may interact in ways not visible in individual worktrees
- Testing across separate dev servers is too error-prone to catch integration failures

## What Every Chunk Must End With

The final step of every chunk:

```markdown
- [ ] **Write handoff note and stop**

Write project/runs/next-chunk.md:

  plan: project/plans/2.active/PBI-NNN-name.md
  completed: Chunk N — <name>
  status: success        <- required: "success" or "failed"
  next: Chunk N+1 — <name>   <- or "all done"

  ## What was done
  [summary of what was implemented and committed]

  ## What failed         <- include only if status: failed
  [full error output so the next attempt has context]

Commit any uncommitted work first. Stop — do not start the next chunk.
```

`status:` is **required**. The orchestrator retries the chunk if it is missing or `failed`.

## Retry Behaviour

If `execute-chunk.js` exits non-zero (status: failed or no handoff), the CC
orchestrator reads the failure notes and decides what to do:

- If the approach was wrong: adjust the plan, then re-run the chunk
- If it's a fixable code error: inject the failure notes into a retry prompt
- If it fails twice: stop and escalate to the human

On retries, the executor prompt is updated with: **implement the fix described in
the failure notes — do not re-investigate from scratch.** Plans should include
explicit implementation steps for any non-trivial fix so the agent has a clear
path without exploring.

## Warning Signs — Stop Immediately

| Sign | Action |
|------|--------|
| Agent writing debug/diagnostic scripts for > 5 min without implementing | Kill — investigation spiral |
| Agent re-reading files it already read | Context loop — kill |
| No new commits after 20+ minutes | Likely hit turn limit silently — kill |
| Agent asks a question it already answered | Context loop — kill |
| API timeout errors appearing | Kill immediately |

Check `project/runs/last-run.log` to see what the agent was doing before you kill it.

## A Stuck Session Cannot Be Recovered

Once a session is stuck, kill it. The last commit is the safe point. The CC
orchestrator reads the failure notes and retries with context from the prior attempt.

**Do not:**
- Try to redirect a stuck session with new instructions
- Wait for it to recover
- Let it keep retrying

**To kill a runaway agent on Windows:**
```powershell
Get-Process node,claude | Stop-Process -Force
```

## The Investigation Spiral Anti-Pattern

The most common failure mode on retries: the agent receives detailed failure notes
describing exactly what to implement, ignores them, and starts its own investigation
from scratch — writing debug scripts, re-running comparisons, re-reading docs.

**Symptoms:** Agent writes "Let me investigate..." or "Let me write a debug script..."
on a retry. No new code after 10+ minutes.

**Fix in plans:** Replace open-ended steps like "investigate any failures and fix"
with explicit implementation steps. The plan should describe *what to build*,
not just *what the problem is*. See chunk size guidelines below.

## How CC Keeps Running Without Pings

CC agents in VS Code run in agentic mode: as long as the model emits
`stop_reason: tool_use`, the loop continues. The session only stops when the
model emits text with `stop_reason: end_turn`. This means a CC session can
make an unlimited number of sequential tool calls — including `sleep` — with no
human involvement.

The orchestrator exploits this: each `sleep && tail` call is a tool call that
keeps the session alive. The orchestrator wakes up, reviews progress, takes
action if needed, then sleeps again. No SDK, no special mechanism — just standard
CC agentic tool calling.

### Context lifetime — the orchestrator's hard limit

An orchestrator session accumulates context with each sleep+tail cycle. `/compact`
cannot be self-initiated by the agent — it is a user-side VS Code command only.
This means **orchestrator sessions have a finite lifespan**: they will silently
degrade after enough cycles.

The only reliable self-termination trigger is a fixed cycle count. The agent
cannot introspect its own token count — "stop when context feels heavy" is
meaningless; it has no way to detect this.

**Self-terminating pattern:** Include a cycle limit in the orchestrator prompt:

```
After every 10 sleep+tail cycles, write runs/orchestrator-resume.md:
  watched_through: Chunk N
  remaining: Chunks N+1 ... M
  last_status: <what the log showed>
Then stop. I will restart with a fresh session pointing at this note.
```

10 cycles at 60s each is ~10 minutes of unattended running — enough for 1–2
chunks. Adjust the number to suit your chunk duration.

## Chunk Size Guidelines

A well-sized chunk:
- Produces one focused commit
- Has 3–8 explicit steps
- Has a clear, testable output

**Iterative chunks must be pre-split.** Do not write "implement X and fix until
all tests pass" — the agent will loop on failures until the session dies.

Instead split them:
- Chunk N: implement the fix (concrete steps, specific files, expected outcome)
- Chunk N+1: verify and iterate (run comparison, fix small gaps if any)

If a chunk involves "investigate failures", the failures must be diagnosed in
advance and the chunk must specify the fix — not ask the agent to find it.

## Issue Capture — Logging a Bug or Change Request from a Screenshot

When the user pastes an image and expresses intent to log an issue
(e.g. "log this", "raise a PBI", "issue here", "that's a bug"),
follow these steps exactly — do not ask for clarification first.

### Step 1 — Save the clipboard image

Run this in bash (from repo root):

    pwsh -Command "
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      \$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
      \$path = (Get-Location).Path + '/project/data/pbis/issue-' + \$ts + '.png'
      \$img = [System.Windows.Forms.Clipboard]::GetImage()
      if (\$img) { \$img.Save(\$path, [System.Drawing.Imaging.ImageFormat]::Png); Write-Host \$path }
      else { Write-Error 'No image in clipboard — ask the user to copy the screenshot again' }
    "

Note the saved path. If clipboard is empty, ask the user to re-copy the screenshot.

### Step 2 — Get the next PBI ID

    cat project/plans/1.backlog/.next-id

Read the number N. Compute N+1 and write it back:

    echo <N+1> > project/plans/1.backlog/.next-id

### Step 3 — Create the stub PBI

Write `project/plans/1.backlog/PBI-<N>-<slug>.md` where slug is a 2-4 word kebab-case
summary. Choose type: "bug" for defects, "change" for enhancement requests.

    # PBI-<N> — <Title from user description>

    type: bug | change    <- pick one
    status: backlog

    ## Context

    <User's description verbatim>

    ## Screenshot

    ![issue](../../../data/pbis/issue-YYYYMMDD-HHMMSS.png)

    ## Acceptance Criteria

    - [ ] <to be defined>

### Step 4 — Update the registry

Append to `project/plans/1.backlog/registry.md`:

    | PBI-<N> | bug | <Title> | backlog | — | — |

### Step 5 — Commit

    git add project/plans/1.backlog/PBI-<N>-*.md \
            project/plans/1.backlog/registry.md \
            project/plans/1.backlog/.next-id \
            project/data/pbis/issue-*.png
    git commit -m "feat: log PBI-<N> — <title>"

Tell the user the PBI path and commit hash.
