---
description: Review component reuse, duplication, and architectural consistency
agent: build
---

Use the `code-reviewer` subagent to audit the component system.

Read `AGENTS.md`, `COMPONENTS.md`, and `DESIGN.md`. Inspect shared primitives (`btn`, `badge`, `card`, `terminal-window`, tables), page-scoped CSS, and duplicated patterns across routes. Check for forked button/card implementations, inconsistent naming, dead classes, duplicated copy logic, accessibility regressions, and missing variants. Verify that the Astro static architecture and dependency policy are intact.

Return findings by severity with file/line references and a concrete consolidation plan. Do not rewrite code unless asked.
