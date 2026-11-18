---
description: Inspect desktop, tablet, and mobile behaviour across every route
agent: build
---

Use the `visual-qa-engineer` subagent to audit responsive behaviour.

Run the site and capture every route at 1440×900, 1024×768, 768×1024, and 390×844. Check page-level horizontal overflow, clipped text, overlapping elements, sticky-header collisions, table/terminal scroll containment, mobile nav wrapping, footer stacking, and touch target sizes. Exercise the theme select, nav, tabs, copy controls, and REPL at 390px.

Return a route × viewport matrix with screenshots and severity-ordered findings. Do not edit source unless explicitly asked to fix.
