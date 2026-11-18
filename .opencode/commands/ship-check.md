---
description: Run typecheck, lint, build, tests, and visual checks before shipping
agent: build
---

Run the full ship check for this repository. Stop and report on the first hard failure.

```sh
npm run check
npm run lint
npm run build
npm run test
```

Then start the preview server and verify:

- Every route returns 200 and has one `h1`.
- No console errors or page-level horizontal overflow at 1440px and 390px.
- Theme switch, nav active state, code tabs, copy feedback, and REPL still work.
- Dark and vantablack themes remain legible.
- `npm run lighthouse` passes the configured budgets (report warnings, not false success).

Return a compact checklist of commands, results, and any remaining risks. Do not deploy. Do not claim a check passed unless it actually ran.
