# Design: Issue Capture Workflow

**Date:** 2026-03-19
**Status:** Approved

## Problem

When reviewing a feature, the human spots issues and takes screenshots. Currently
they must manually save the screenshot, locate a folder, and dictate a PBI to CC.
This friction discourages timely issue logging.

## Solution

A documented CC workflow: paste an image into the chat, describe the issue briefly,
CC saves the clipboard image to disk and creates a stub PBI in one interaction.

## Workflow

**Trigger:** User pastes an image into the CC chat and expresses intent to log an
issue (e.g. "log this", "raise a PBI", "issue here", or any similar phrasing).

**Steps CC performs:**

1. **Save image** — Run PowerShell to read the clipboard and write the image to
   `project/data/pbis/issue-YYYYMMDD-HHMMSS.png`

2. **Get next PBI ID** — Read `project/plans/1.backlog/.next-id`, increment and
   write back

3. **Create stub PBI** — Write `project/plans/1.backlog/PBI-NNN-<slug>.md`:
   ```markdown
   # PBI-NNN — <Title from description>

   type: bug | change
   status: backlog

   ## Context
   <User's description verbatim>

   ## Screenshot
   ![issue](../../../data/pbis/issue-YYYYMMDD-HHMMSS.png)

   ## Acceptance Criteria
   - [ ] <to be defined>
   ```

4. **Update registry** — Append row to `project/plans/1.backlog/registry.md`

5. **Commit** — `feat: log PBI-NNN — <title>`

## Scope

- No new scripts. CC performs all steps inline using Bash (PowerShell) + Write/Edit tools.
- Workflow documented in `harness/docs/agent-sessions.md` under a new "Issue Capture" section.
- Referenced from `AGENTS.md` core rules.

## PowerShell Clipboard Save

```powershell
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img) {
    $path = "project/data/pbis/issue-$(Get-Date -Format 'yyyyMMdd-HHmmss').png"
    $img.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host $path
} else {
    Write-Error "No image in clipboard"
}
```

## Out of Scope

- Full PBI authoring (acceptance criteria, chunks) — stub only
- Non-Windows platforms
- Running without CC (no standalone script)
