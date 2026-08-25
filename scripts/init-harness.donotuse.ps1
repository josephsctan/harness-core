<#
.SYNOPSIS
    WARNING: NO LONGER USED. WILL BE DELETED.
    Installs or upgrades the agent harness in a target git repository.

.DESCRIPTION
    Install mode (default):
      Copies harness/ into the target repo, scaffolds project/ structure,
      writes root AGENTS.md and CLAUDE.md, creates package.json, runs npm install.
      Current harness version: see harness/VERSION.

    Upgrade mode (-Upgrade):
      Replaces target harness/ wholesale from this harness source.
      Runs migrations for changes outside harness/ (new project/ folders,
      obsolete root files, .gitignore path updates, etc.)

.PARAMETER Target
    Path to the target git repository. Defaults to current directory.

.PARAMETER FirstId
    Starting PBI number. Used on first install only. Defaults to 100.

.PARAMETER Upgrade
    Run in upgrade mode: replace harness/ and apply migrations.

.EXAMPLE
    # Install into a new repo
    powershell -File harness/scripts/init-harness.ps1 -Target C:\Repos\my-project

    # Upgrade harness in an existing repo
    Remove-Item C:\Repos\my-project\harness -Recurse -Force
    Copy-Item C:\Repos\pypdfnet\harness C:\Repos\my-project\harness -Recurse
    powershell -File C:\Repos\my-project\harness\scripts\init-harness.ps1 -Target C:\Repos\my-project -Upgrade
#>

param(
    [string]$Target  = (Get-Location).Path,
    [int]$FirstId    = 100,
    [switch]$Upgrade
)

$ErrorActionPreference = 'Stop'
$Harness = $PSScriptRoot | Split-Path -Parent   # harness/scripts/../ = harness/
$HarnessVersion = (Get-Content "$Harness\VERSION" -Raw).Trim()

# ── Validate ──────────────────────────────────────────────────────────────────

if (-not (Test-Path $Target)) { Write-Error "Target path does not exist: $Target"; exit 1 }
if (-not (Test-Path "$Target\.git")) { Write-Error "Target is not a git repository: $Target"; exit 1 }

$mode = if ($Upgrade) { "upgrade" } else { "install" }
Write-Host ""
Write-Host "harness · $mode  (v$HarnessVersion)"
Write-Host "  source : $Harness"
Write-Host "  target : $Target"
if (-not $Upgrade) { Write-Host "  first  : PBI-$FirstId" }
Write-Host ""

# ── Helpers ───────────────────────────────────────────────────────────────────

function Copy-File($src, $dst) {
    $dir = Split-Path $dst -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    Copy-Item $src $dst -Force
    Write-Host "  copied  $($dst.Replace($Target, '').TrimStart('\/'))"
}

function Ensure-Dir($path) {
    if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
    $keep = "$path\.gitkeep"
    if (-not (Test-Path $keep)) { New-Item -ItemType File -Path $keep -Force | Out-Null }
    Write-Host "  dir     $($path.Replace($Target, '').TrimStart('\/'))"
}

function Append-Gitignore($entries) {
    $gi = "$Target\.gitignore"
    $existing = if (Test-Path $gi) { Get-Content $gi -Raw } else { "" }
    $toAdd = $entries | Where-Object { $existing -notmatch [regex]::Escape($_) }
    if ($toAdd) {
        $block = "`n# harness`n" + ($toAdd -join "`n") + "`n"
        Add-Content $gi $block
        Write-Host "  .gitignore updated ($($toAdd.Count) entries added)"
    } else {
        Write-Host "  .gitignore already up to date"
    }
}

# ── Install harness/ ──────────────────────────────────────────────────────────

$targetHarness = "$Target\harness"
$selfInstall = (Resolve-Path $Harness).Path -eq (& { try { (Resolve-Path $targetHarness).Path } catch { "" } })

if ($selfInstall) {
    Write-Host "harness/ (self-install — already in place)"
} else {
    Write-Host "harness/"
    if ($Upgrade -and (Test-Path $targetHarness)) {
        Remove-Item $targetHarness -Recurse -Force
        Write-Host "  removed old harness/"
    }
    if (-not (Test-Path $targetHarness)) { New-Item -ItemType Directory -Path $targetHarness -Force | Out-Null }
    Copy-Item "$Harness\*" $targetHarness -Recurse -Force
    Write-Host "  copied  harness/ (v$HarnessVersion)"
}

# ── Migrations (upgrade mode) ─────────────────────────────────────────────────

if ($Upgrade) {
    Write-Host "migrations/"

    # Remove obsolete root-level files
    @('scripts\run.js', 'docs\brief-template.md') | ForEach-Object {
        $p = "$Target\$_"
        if (Test-Path $p) { Remove-Item $p -Force; Write-Host "  removed $_ (obsolete)" }
    }

    # Migrate flat layout → project/ split (pre-0.1.0 → 0.1.0)
    $flatDirs = @('docs','plans','src','data','runs','scripts')
    $hasFlatLayout = ($flatDirs | Where-Object {
        $d = $_; (Test-Path "$Target\$d") -and $d -ne 'harness' -and $d -ne 'project'
    }).Count -gt 0

    if ($hasFlatLayout) {
        Write-Host "  detected pre-0.1.0 flat layout — migrating to project/ ..."
        foreach ($d in $flatDirs) {
            $src = "$Target\$d"; $dst = "$Target\project\$d"
            if ((Test-Path $src) -and $d -ne 'harness' -and $d -ne 'project') {
                if (-not (Test-Path "$Target\project")) { New-Item -ItemType Directory "$Target\project" -Force | Out-Null }
                Move-Item $src $dst -Force
                Write-Host "  moved $d -> project/$d"
            }
        }
        # briefs → backlog
        if (Test-Path "$Target\project\plans\1.briefs") {
            $bl = "$Target\project\plans\1.backlog"
            if (-not (Test-Path $bl)) { New-Item -ItemType Directory $bl -Force | Out-Null }
            Get-ChildItem "$Target\project\plans\1.briefs" | ForEach-Object { Move-Item $_.FullName $bl -Force }
            Remove-Item "$Target\project\plans\1.briefs" -Force -Recurse
            Write-Host "  migrated plans/1.briefs -> project/plans/1.backlog"
        }
        # BR- → PBI-
        @('project\plans\1.backlog','project\plans\2.active','project\plans\3.completed') | ForEach-Object {
            $full = "$Target\$_"
            if (Test-Path $full) {
                Get-ChildItem $full -Filter "BR-*.md" | ForEach-Object {
                    $n = $_.Name -replace '^BR-','PBI-'
                    Rename-Item $_.FullName $n -Force
                    Write-Host "  renamed $_\$($_.Name) -> $n"
                }
            }
        }
        # data/briefs → project/data/pbis
        if ((Test-Path "$Target\project\data\briefs") -and -not (Test-Path "$Target\project\data\pbis")) {
            Rename-Item "$Target\project\data\briefs" "pbis" -Force
            Write-Host "  migrated project/data/briefs -> project/data/pbis"
        }
    }
}

# ── project/ structure ────────────────────────────────────────────────────────

Write-Host "project/"
Ensure-Dir "$Target\project\plans\1.backlog"
Ensure-Dir "$Target\project\plans\2.active"
Ensure-Dir "$Target\project\plans\3.completed"
Ensure-Dir "$Target\project\docs\features"
Ensure-Dir "$Target\project\data\pbis"
Ensure-Dir "$Target\project\runs"
Ensure-Dir "$Target\project\scripts"

if (-not (Test-Path "$Target\project\plans\1.backlog\registry.md")) {
    Set-Content "$Target\project\plans\1.backlog\registry.md" @"
# PBI Registry

| ID | Type | Name | Status | Plan | As-Built |
|----|------|------|--------|------|---------|
"@
    Write-Host "  created project/plans/1.backlog/registry.md"
} else { Write-Host "  kept    project/plans/1.backlog/registry.md (existing)" }

if (-not (Test-Path "$Target\project\plans\1.backlog\.next-id")) {
    Set-Content "$Target\project\plans\1.backlog\.next-id" "$FirstId"
    Write-Host "  created project/plans/1.backlog/.next-id ($FirstId)"
} else { Write-Host "  kept    project/plans/1.backlog/.next-id (existing)" }

if (-not (Test-Path "$Target\project\PROJECT.md")) {
    Set-Content "$Target\project\PROJECT.md" @"
# Project: $(Split-Path $Target -Leaf)

## What We're Building

<describe what this project builds — one paragraph>

## Tech Stack

<languages, frameworks, test tools>

## Key Conventions

<any repo-specific conventions agents need to know>

## Important Docs

- [project/plans/1.backlog/](project/plans/1.backlog/) — feature backlog
- [project/docs/features/](project/docs/features/) — as-built docs
"@
    Write-Host "  created project/PROJECT.md (fill this in!)"
} else { Write-Host "  kept    project/PROJECT.md (existing)" }

# ── Root files ────────────────────────────────────────────────────────────────

Write-Host "root/"

# AGENTS.md — harness-owned, always overwrite (project context lives in project/PROJECT.md)
$agentsMdSrc = "$Harness\AGENTS.md"
if (-not (Test-Path $agentsMdSrc)) {
    Write-Error "harness/AGENTS.md not found — harness copy may be incomplete"; exit 1
}
Copy-Item $agentsMdSrc "$Target\AGENTS.md" -Force
Write-Host "  wrote   AGENTS.md"

Set-Content "$Target\CLAUDE.md" @"
# Use AGENTS.md
This project is agent-agnostic.
Instructions must live in AGENTS.md.
Do not put instructions here.
Repeat: Use and load AGENTS.md
"@
Write-Host "  wrote   CLAUDE.md"

if (-not (Test-Path "$Target\package.json")) {
    Set-Content "$Target\package.json" @"
{
  "name": "$(Split-Path $Target -Leaf)",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.2.76",
    "@anthropic-ai/sdk": "^0.79.0"
  }
}
"@
    Write-Host "  created package.json"
} else { Write-Host "  kept    package.json (existing)" }

Append-Gitignore @('project/runs/', 'node_modules/', 'project/src/**/bin/', 'project/src/**/obj/')

# ── npm install ───────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Installing dependencies..."
Push-Location $Target
npm install --silent
Pop-Location

# ── Done ──────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "Done. (harness v$HarnessVersion)"
if (-not $Upgrade) {
    Write-Host "  Next steps:"
    Write-Host "  1. Fill in project/PROJECT.md"
    Write-Host "  2. Create your first PBI: harness/docs/pbi-template.md -> project/plans/1.backlog/PBI-$FirstId-<name>.md"
    Write-Host "  3. Start a CC orchestrator session (see harness/docs/agent-sessions.md)"
}
Write-Host ""
