# Parallel Agent Development with Git Worktrees

Git worktrees let multiple agents work on independent plans simultaneously, each in a fully isolated copy of the repo. This is the primary mechanism for parallelism in this harness.

## The Core Idea

One plan = one worktree = one agent = one branch.

Each agent works in its own directory with its own working tree, its own `runs/` folder, and its own branch. Agents never share working state. When the plan is done, the branch is merged and the worktree is removed.

## Conventions

### Naming

Worktrees are named after the plan they correspond to:

```
wt/<plan-name>
```

Examples: `wt/add-user-auth`, `wt/fix-login-redirect`, `wt/refactor-db-layer`

This matches the plan file name in `plans/active/<plan-name>.md`.

### Location

Worktrees live **one level above the repo root**, as siblings of the main checkout:

```
parent/
├── mini-harness/          # main checkout (your working directory)
├── mini-harness--wt-add-user-auth/
├── mini-harness--wt-fix-login-redirect/
└── ...
```

Using a sibling directory (rather than a subfolder) keeps worktrees outside the repo and avoids `.gitignore` complexity.

### Branch naming

Each worktree runs on its own branch, named to match:

```
feat/<plan-name>
fix/<plan-name>
```

## Lifecycle

### 1. Start a plan

```bash
# From the repo root
git worktree add ../mini-harness--wt-<plan-name> -b feat/<plan-name>
```

Create the plan file in `plans/active/<plan-name>.md` (in the **main** checkout, not the worktree — plans are shared state).

### 2. Work in the worktree

The agent operates entirely inside `../mini-harness--wt-<plan-name>/`. It has its own `runs/` folder (ephemeral, never committed). It reads plans from `plans/active/` and updates them as it works.

**The worktree is the canonical directory for that plan.** When debugging, hot-fixing, or reviewing agent output, always confirm you are in the worktree — not the main checkout. Editing files in the main checkout while the agent runs in the worktree creates invisible conflicts, even if both are on the same branch. Run `git worktree list` if unsure which directory is active.

**Run `execute-chunk.js` from the worktree root, not the main checkout:**

```bash
cd <worktree-path>
node ../harness-core/scripts/execute-chunk.js <plan-path> "<chunk name>"
```

Running `execute-chunk.js` from the main checkout while the worktree is on a different branch causes implementer agents to edit and commit to the wrong branch. Run from the worktree root — `../harness-core/` resolves correctly from any worktree since worktrees are siblings of the project repo.

### 3. Complete the plan and merge to `main`

When the final chunk writes `next: all done`:

1. Confirm plan checklist is complete and plan file is moved to `plans/completed/`
2. Run the full Playwright suite from the worktree — **do not merge until green**
3. Merge to `main` (run from the main checkout):

```bash
git checkout main && git merge feat/<plan-name>
```

4. Tell the human: "PBI-NNN merged to main and ready to test."

**Do not wait for "I accept" before merging.** The merge happens as the final step of the
orchestrator loop, before the human tests. The human tests on `main` — not on the worktree server.

### 4. Clean up after human review

Once the human is satisfied with the feature on `main`:

```bash
# Remove the worktree
git worktree remove ../mini-harness--wt-<plan-name>

# Delete the branch
git branch -d feat/<plan-name>
```

If the worktree is already removed (merge happened and server is off), just delete the branch.

## Running Multiple Agents in Parallel

Each agent gets its own worktree. They can run simultaneously as long as their plans are independent (no overlapping files or shared mutable state).

**Before dispatching parallel agents:**
- Confirm the plans do not touch the same files
- Each agent reads the plan from `plans/active/` in its own worktree (plans are committed, so they're visible everywhere)
- Each agent writes only to its own branch

**If plans converge** (e.g. both touch `src/db/`), run them sequentially instead. Parallelism is only safe when work is genuinely independent.

## Listing Active Worktrees

```bash
git worktree list
```

Each line shows the worktree path, current commit, and branch — use this to audit what agents are currently running.

## Stale Worktrees

If an agent fails or a plan is abandoned, clean up manually:

```bash
git worktree remove ../mini-harness--wt-<plan-name>
git branch -d feat/<plan-name>
```

Add the abandoned plan to `plans/tech-debt-tracker.md` if the work is worth resuming later.
