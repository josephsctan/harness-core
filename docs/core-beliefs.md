# Core Beliefs — Agent-First Operating Principles

These principles guide how this codebase is built and maintained. They are not suggestions.

1. **CLAUDE.md is the table of contents** — short, links to everything else. Not an encyclopedia.
2. **Docs are the system of record** — if it is not in the repo, it does not exist to the agent.
3. **Progressive disclosure** — agent starts with CLAUDE.md, drills deeper as needed.
4. **Mechanical enforcement** — linters and tests enforce rules. Lint error messages include remediation instructions.
5. **Scripts are the agent's hands** — boot, test, deploy, validate. All callable from CLI.
6. **Plans are first-class artifacts** — versioned, co-located, with progress logs.
7. **Garbage collection** — recurring cleanup prevents drift and debt accumulation.
8. **Validation at boundaries** — all external input validated with Zod. Trust internal code.
9. **Boring tech preferred** — composable, stable APIs, well-represented in training data.
10. **Human taste encoded as rules** — when a pattern matters, promote it from docs to linter.
