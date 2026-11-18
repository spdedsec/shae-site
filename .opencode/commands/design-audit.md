---
description: Audit the interface for generic design, hierarchy, typography, layout, and usability
agent: build
---

Use the `creative-frontend-designer` subagent to audit the Shae site.

Scope: $ARGUMENTS (default: all routes).

Read `AGENTS.md`, `DESIGN.md`, and `COMPONENTS.md`. Start the site, inspect 1440px and 390px screenshots of every route, then evaluate hierarchy, composition, typography, spacing, colour discipline, and whether the page feels specific to a systems language. Flag AI-slop patterns (generic SaaS grids, gradients, glass, pills, decorative numbers, repeated fade-ups). Check light, dark, and vantablack.

Return findings by severity with file/selector references and a prioritized fix list. Do not make changes unless the command is followed by an explicit request to fix.
