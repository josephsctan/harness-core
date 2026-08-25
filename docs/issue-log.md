# Issue Log Convention

Issues found and fixed during development are recorded in `data/issues/`. This is the committed, permanent record — not `runs/`, not a comment in Slack.

## When to log an issue

Log an issue when:
- A bug is found and fixed during a feature build
- An environment problem is diagnosed and resolved
- Unexpected behaviour is discovered that required investigation

Do not log:
- Known tasks or planned work → use PBIs/plans
- One-line gotchas already captured in `docs/troubleshooting.md`

## Naming convention

```
data/issues/YYYY-MM-DD-<short-slug>.md
```

Examples:
- `data/issues/2026-03-18-vite-hmr-breaks-on-windows.md`
- `data/issues/2026-03-18-auth-token-not-cleared-on-logout.md`

Use the date the issue was **found**, not the date it was fixed.

## Entry format

```markdown
---
date: YYYY-MM-DD
status: fixed          # open | fixed
title: Short description of the issue
tags: [env, auth, api] # optional freeform tags
---

## Summary

One paragraph: what was observed, when, and in what context.

## Root Cause

What actually caused it.

## Fix

What was done to resolve it. Include file paths and commit references if relevant.

## Verification

How it was confirmed as fixed.
```

## Relationship to troubleshooting.md

`docs/troubleshooting.md` captures **reusable environment tips** — patterns worth repeating. `data/issues/` captures **specific incidents** — what happened, why, and how it was fixed. If an issue reveals a pattern worth generalising, add the tip to `docs/troubleshooting.md` and note that in the issue entry.
