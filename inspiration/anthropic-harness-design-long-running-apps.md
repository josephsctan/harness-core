# Harness Design for Long-Running Application Development

**Source:** https://www.anthropic.com/engineering/harness-design-long-running-apps
**Published:** March 24, 2026

## Overview

This engineering article by Prithvi Rajasekaran explores how specialized harness design enables Claude to produce high-quality frontend designs and build complete applications autonomously over multi-hour sessions.

## Key Concepts

### The Problem with Naive Approaches

Two primary failure modes emerge in long-running agentic coding tasks:

1. **Context coherence deterioration**: Models lose coherence as context windows fill. Some exhibit "context anxiety," prematurely concluding work as they approach perceived limits. While context compaction (summarizing earlier conversations) preserves continuity, it doesn't provide the clean slate needed to eliminate anxiety.

2. **Self-evaluation bias**: When assessing their own work, agents consistently overpraise outputs. This proves particularly problematic for subjective tasks like design, where objective verification criteria don't exist.

### Generator-Evaluator Architecture

Inspired by GANs, the solution separates generation from evaluation. This approach enables:
- Concrete grading criteria that make subjective judgments measurable
- External feedback loops driving improvement
- Easier tuning of evaluator skepticism versus generator self-criticism

## Frontend Design Implementation

Four grading criteria guide both generation and evaluation:

- **Design quality**: Coherent integration of colors, typography, and imagery
- **Originality**: Custom decisions rather than template defaults or AI patterns
- **Craft**: Technical execution (hierarchy, spacing, harmony, contrast)
- **Functionality**: Usability independent of aesthetics

The evaluator actively navigates generated interfaces via Playwright, taking screenshots and studying implementations before scoring. Iterations (5-15 per generation) progressively refine outputs, sometimes triggering aesthetic pivots when initial directions plateau.

## Full-Stack Coding Architecture

A three-agent system addresses distinct gaps:

**Planner Agent**
Transforms brief prompts (1-4 sentences) into comprehensive product specifications, emphasizing scope ambition while avoiding over-specification of implementation details. It identifies opportunities for AI feature integration.

**Generator Agent**
Implements features incrementally using React, Vite, FastAPI, and PostgreSQL stacks. Self-evaluation occurs after each sprint before QA handoff. Git version control manages iterations.

**Evaluator Agent**
Uses Playwright MCP to test running applications like end users would, exercising UI features, APIs, and database states. Before each sprint, generator and evaluator negotiate a "sprint contract" defining success criteria, bridging specification gaps.

## Results Comparison

**Solo run (Retro Game Maker)**
- Duration: 20 minutes
- Cost: $9
- Output: Interface present but game mechanics broken; entities unresponsive to input

**Full harness run (Retro Game Maker)**
- Duration: 6 hours
- Cost: $200
- Output: Functional game with working physics, playable test mode, polished UI, and integrated AI features for sprite/level generation

## Iterative Refinement

As models improve, harness complexity can reduce. Testing with Claude Opus 4.6 revealed:

- Sprint decomposition became optional due to improved long-context handling
- Single-pass evaluation replaced per-sprint checking for simpler tasks
- Context resets, previously essential with Sonnet 4.5, became unnecessary

**Updated harness (DAW application)**
- Duration: 3 hours 50 minutes
- Cost: $124.70
- Capability: Multi-hour coherent builds without sprint decomposition

The evaluator continued identifying meaningful gaps: missing interactive depth (draggable clips, instrument panels), stubbed features (audio recording), and missing visualizations (EQ curves). Approximately 30% of identified issues required generator refinement in subsequent rounds.

## Key Learnings

1. **Assume nothing persists**: Every harness component encodes assumptions about model limitations. These assumptions become outdated as capabilities improve.

2. **Decomposition enables coherence**: Breaking complex tasks into tractable chunks with specialized agents dramatically improves output quality—20x cost investment yielded production-ready applications versus non-functional solo outputs.

3. **Evaluation frameworks drive improvement**: Explicit criteria—whether for design or functionality—shape model behavior more effectively than vague quality requests.

4. **Separation enables skepticism**: Evaluators more readily adopt critical perspectives than generators can maintain toward their own work.

5. **Harness flexibility matters**: As models improve, continuously reassess which components remain load-bearing and which can be removed without degrading performance.

## Conclusion

As AI capabilities expand, opportunities for novel harness combinations don't diminish—they shift. The meaningful engineering work increasingly involves identifying optimal agent combinations and orchestration patterns for emerging task categories, rather than building universal scaffolding around baseline model limitations.
