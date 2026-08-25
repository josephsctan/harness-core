# Effective Harnesses for Long-Running Agents

**Source:** https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
**Published:** November 26, 2025
**Author:** Justin Young (with contributions from Anthropic's code RL and Claude Code teams)

---

## Overview

As AI agents become increasingly capable, developers are tasking them with complex work spanning hours or even days. However, agents struggle to maintain consistent progress across multiple context windows—each new session begins without memory of previous work.

## The Core Challenge

The fundamental problem mirrors a software team working in shifts where each new engineer arrives with no context about prior work. Since context windows are limited and complex projects exceed single-window capacity, agents need mechanisms to bridge sessions.

## The Two-Part Solution

Anthropic developed a solution comprising:

1. **Initializer Agent**: The first session uses specialized prompting to establish the environment, including an `init.sh` script, `claude-progress.txt` file documenting agent actions, and an initial git commit showing added files.

2. **Coding Agent**: Subsequent sessions focus on incremental progress while leaving structured updates for the next session.

## Environment Management Components

### Feature List

The initializer agent creates comprehensive feature requirements (200+ for the claude.ai clone example) in JSON format, initially marked as "failing." Coding agents only modify the `passes` field, preventing inappropriate edits.

### Incremental Progress

Rather than attempting entire implementations, agents work on single features. Git commits with descriptive messages and progress file summaries maintain clean, recoverable states.

### Testing

Claude performs better with explicit browser automation tools (like Puppeteer MCP). When prompted to test as humans would, agents identify and fix bugs missed by unit tests alone.

## Getting Up to Speed

Each session follows standard steps:

- Run `pwd` to verify working directory
- Read git logs and progress files
- Select highest-priority unfinished features

This conserves tokens and establishes consistent workflows.

## Common Failure Modes & Solutions

| Problem | Initializer Behavior | Coding Behavior |
|---------|---------------------|-----------------|
| Agent declares victory prematurely | Create feature list file | Read list at session start, work on single feature |
| Buggy, undocumented progress left | Write git repo + progress notes | Start by reading notes/logs, test, end with commits |
| Features marked complete without testing | Set up feature list | Self-verify thoroughly before marking passing |
| Time spent understanding app setup | Write `init.sh` script | Start session by reading `init.sh` |

## Future Directions

Key open questions remain:

- Does a single general-purpose agent outperform specialized multi-agent architectures?
- Can these patterns generalize beyond web development to scientific research or financial modeling?

The authors note ongoing limitations, such as Claude's inability to detect browser-native alert modals through available tools.

## Key Takeaways for Harness Design

- **Structured handoff files** (`claude-progress.txt`, feature lists) are essential for multi-session continuity
- **`init.sh` scripts** eliminate setup time at the start of each session
- **Git as progress tracker** — frequent commits with descriptive messages allow recovery and context reconstruction
- **Feature lists in JSON** with a `passes` boolean field create a clear, agent-manipulable task registry
- **Single-feature focus per session** prevents partial states and makes progress measurable
- **Browser automation tools** (Puppeteer MCP etc.) dramatically improve testing quality over unit tests alone
