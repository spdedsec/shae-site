---
description: Review animations for purpose, timing, easing, performance, interruption, and reduced motion
agent: build
---

Use the `motion-design-engineer` subagent to audit motion on the Shae site.

Read `MOTION.md` and `AGENTS.md`. Inspect page-load reveals, view transitions, hover/press feedback, tabs, copy feedback, the scroll progress rule, and the sticky header material. Check `prefers-reduced-motion` with Playwright, and inspect a Chrome DevTools trace if an effect is expensive. Flag decorative motion, competing systems, layout-triggering properties, leaked timers, and scroll hijacking.

Return a findings table (issue, severity, evidence, fix) and the exact timings/easing you recommend. Do not add an animation library.
