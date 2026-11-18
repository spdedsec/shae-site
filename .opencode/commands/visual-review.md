---
description: Run the app, inspect browser output, and identify visual problems
agent: build
---

Use the `visual-qa-engineer` subagent for a visual review.

Start the site, inspect every route at 1440px and 390px, and capture screenshots. Look for broken composition, awkward line breaks, inconsistent rules, misaligned grids, empty cells, clipped content, low-contrast text, sticky-header collisions, and generic AI-slop patterns. Check light, dark, and vantablack. Exercise interactive states (theme, nav, tabs, copy, REPL) and check the console.

Return annotated findings with screenshot paths, selectors, and severity. Fix only if explicitly requested.
