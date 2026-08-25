# Issue Capture Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable CC to save a pasted screenshot to disk and create a stub PBI from it in one interaction.

**Architecture:** Documentation-only change. No new scripts. Add an "Issue Capture" section to `harness/docs/agent-sessions.md` describing the exact steps CC must follow when a user pastes an image and mentions an issue. The PowerShell clipboard-save runs inline via Bash when triggered.

**Tech Stack:** PowerShell (Windows clipboard API), existing harness file conventions.

**Working directory:** All commands run from repo root `C:/JST/Repos/mini-harness/` unless otherwise stated.

---

## File Map

- Modify: `C:/JST/Repos/mini-harness/harness/docs/agent-sessions.md` — append Issue Capture section
- Modify: `C:/JST/Repos/mini-harness/AGENTS.md` — add rule to Core Rules
- Modify: `C:/JST/Repos/mini-harness/harness/AGENTS.md` — same change (keeps template in sync)

---

### Task 1: Verify PowerShell clipboard capability

**Files:** None (verification only)

- [ ] **Step 1: Confirm `project/data/pbis/` exists**

```bash
ls C:/JST/Repos/mini-harness/project/data/pbis/
```

If missing: `mkdir -p C:/JST/Repos/mini-harness/project/data/pbis`

- [ ] **Step 2: Test clipboard image capture**

Copy any image to clipboard (e.g. Win+Shift+S snip), then run:

```bash
pwsh -Command "
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing
  \$img = [System.Windows.Forms.Clipboard]::GetImage()
  if (\$img) { Write-Host \"OK: \$(\$img.Width)x\$(\$img.Height)\" } else { Write-Error 'No image in clipboard' }
"
```

Expected output: `OK: <width>x<height>`

If this fails, stop — the capability is not available and the plan cannot proceed.

---

### Task 2: Add Issue Capture section to agent-sessions.md

**Files:**
- Modify: `C:/JST/Repos/mini-harness/harness/docs/agent-sessions.md`

- [ ] **Step 1: Read the current file** to understand structure and confirm the end of file.

Read `C:/JST/Repos/mini-harness/harness/docs/agent-sessions.md`.

- [ ] **Step 2: Append the Issue Capture section using the Write/Edit tool**

Append the following content to the end of `harness/docs/agent-sessions.md`. Use the Edit tool (not a shell heredoc) to avoid nested code-fence issues.

The content to append:

```
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
      \$path = 'C:/JST/Repos/mini-harness/project/data/pbis/issue-' + \$ts + '.png'
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
```

- [ ] **Step 3: Read the file back** and confirm the section was appended cleanly with no broken formatting.

- [ ] **Step 4: Commit**

```bash
cd C:/JST/Repos/mini-harness && git add harness/docs/agent-sessions.md && git commit -m "feat(harness): add issue capture workflow to agent-sessions"
```

---

### Task 3: Add rule to Core Rules in both AGENTS.md files

**Files:**
- Modify: `C:/JST/Repos/mini-harness/AGENTS.md`
- Modify: `C:/JST/Repos/mini-harness/harness/AGENTS.md`

- [ ] **Step 1: Read `AGENTS.md`** and count the current number of items in `### Core Rules`. Note the last item number N.

- [ ] **Step 2: Append rule N+1** to the Core Rules numbered list in `AGENTS.md`:

```
<N+1>. **Pasted screenshot + issue description = log a PBI.** Follow the Issue Capture workflow in [harness/docs/agent-sessions.md](harness/docs/agent-sessions.md).
```

- [ ] **Step 3: Read `harness/AGENTS.md`** and confirm it has the same Core Rules section. Apply the identical change.

- [ ] **Step 4: Commit**

```bash
cd C:/JST/Repos/mini-harness && git add AGENTS.md harness/AGENTS.md && git commit -m "feat(harness): reference issue capture in AGENTS.md core rules"
```

---

### Task 4: Smoke test (manual human step)

**This task requires human interaction — it cannot be performed by an agentic worker.**

- [ ] **Step 1 (human):** Take a screenshot (Win+Shift+S), paste into a CC chat in this repo, type "log this as a PBI — <describe what you see>".

- [ ] **Step 2 (agent — verify file was created):** After the human confirms CC ran the workflow, check:

```bash
ls -lh C:/JST/Repos/mini-harness/project/data/pbis/issue-*.png | tail -1
```

Expected: a non-zero `.png` file with a recent timestamp.

- [ ] **Step 3 (agent — verify PBI was created):** Check the backlog:

```bash
ls C:/JST/Repos/mini-harness/project/plans/1.backlog/PBI-*.md | tail -3
```

Expected: a new `PBI-NNN-*.md` file.

- [ ] **Step 4 (agent — verify registry was updated):**

```bash
tail -3 C:/JST/Repos/mini-harness/project/plans/1.backlog/registry.md
```

Expected: the new PBI appears in the last row.
