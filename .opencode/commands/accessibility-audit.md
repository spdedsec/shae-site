---
description: Inspect WCAG accessibility, keyboard support, focus, contrast, and reduced motion
agent: build
---

Use the `accessibility-engineer` subagent to audit the Shae site.

Run `npm run test:a11y` and inspect every route with axe-core. Manually verify the skip link, header nav, theme select, audio toggle, code tabs, copy buttons, REPL controls, and footer links with keyboard only. Check heading order, landmarks, accessible names, focus visibility, 200% zoom, 320px width, contrast in all three themes, and reduced-motion/reduced-transparency fallbacks.

Return findings by severity with WCAG references and file/line fixes. Fix only what is explicitly in scope; do not claim AA compliance from axe alone.
