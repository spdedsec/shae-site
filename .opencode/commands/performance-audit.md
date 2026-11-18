---
description: Analyse rendering, bundle size, assets, and Core Web Vitals
agent: build
---

Use the `frontend-performance-engineer` subagent to audit performance.

Read `AGENTS.md` and `MOTION.md`. Establish a baseline with `npm run build`, `npm run analyze`, and `npm run lighthouse` (or a single-route Lighthouse run if time is tight). Inspect JS/CSS/font payloads, render-blocking work, image dimensions, and runtime rendering. Report measured numbers, not guesses. Do not add analytics, SSR, or a client framework. Do not trade accessibility for score.

Return a baseline table, ranked bottlenecks, low-risk fixes, and before/after evidence for anything changed.
