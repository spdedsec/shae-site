# Shae Site — Agent Instructions

## What this project is

The official static site for **Shae**, a systems scripting language. Astro 5.18.2, TypeScript strict, npm, no React, no client framework, no runtime animation library. Pages: `/`, `/docs`, `/features`, `/benchmarks`, `/download`, `/tour`, `/repl`.

Deployed at <https://shae-site.vercel.app>. Content and product facts are owned by the project; **do not invent versions, benchmarks, chunk counts, or test results**. Preserve existing copy unless the task explicitly asks for content changes.

## Design identity

**Field Manual / Specimen Sheet.** Warm paper, ink, one oxide-red signal, hairline rules, zero border radius, flat surfaces, left-aligned editorial composition, technical mono labels. Read `DESIGN.md`, `MOTION.md`, and `COMPONENTS.md` before visual work.

The site must never look like generic AI output. Do not introduce:

- SaaS hero + three rounded feature cards.
- Purple/blue AI gradients, random glows, glassmorphism stacks.
- Pill buttons, floating rounded cards, drop shadows on everything.
- Repetitive fade-up-on-scroll for every section.
- Decorative numbers, badges, or icons with no informational job.
- Stock dashboard aesthetics or fake data.
- Scroll hijacking or animation that blocks reading.

Every visual decision must serve the product: a precise, fast, low-ceremony systems language. When in doubt, use a rule, a mono label, and better typography instead of an effect.

## Motion policy

Use native CSS and the View Transitions API. Do not add GSAP, Motion, Lenis, Three.js, or React animation packages unless the project gains a genuine interactive/3D surface and the task justifies the cost. One animation system at a time. Respect `prefers-reduced-motion` and never make content depend on animation. Details in `MOTION.md`.

## Accessibility

WCAG 2.1 A/AA is the automated floor; aim for 2.2 AA semantics. Semantic landmarks, one `h1` per page, visible focus, keyboard-operable controls, 38–44px touch targets on mobile, accessible names, no color-only meaning, reduced-motion and reduced-transparency fallbacks. Run `npm run test:a11y` after UI changes.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server on `:4321` |
| `npm run build` | Static production build |
| `npm run preview` | Preview `dist/` |
| `npm run check` | Astro + TypeScript diagnostics |
| `npm run lint` | ESLint (Astro + TS) |
| `npm run test` | Playwright E2E, interactions, a11y, motion |
| `npm run test:ui` | Playwright interactive UI |
| `npm run lighthouse` | Lighthouse CI budgets on the built site |
| `npm run analyze` | Bundle treemap at `dist/stats.html` |
| `npm run ship-check` | Typecheck + lint + build + tests |

## Tooling

- Skills live in `.agents/skills/` and `.opencode/skills/`. Relevant: `frontend-design`, `apple-design`, `impeccable`, `animate`, `review-animations`, `improve-animations`, `animation-performance`, `find-animation-opportunities`, `web-design-guidelines`, `writing-guidelines`.
- MCP servers: `context7`, `playwright`, `chrome-devtools` (project `opencode.json`).
- Specialist subagents: `creative-frontend-designer`, `motion-design-engineer`, `frontend-performance-engineer`, `accessibility-engineer`, `visual-qa-engineer`, `code-reviewer`.
- Use Context7 for library docs; use Playwright/Chrome DevTools to inspect the actual browser, not assumptions.

## Engineering rules

- Keep the Astro static architecture and npm lockfile. Do not replace the framework or add a UI framework for a visual change.
- Preserve all routes, scripts, theme/audio state, and links.
- Prefer page-scoped CSS over new global classes; use existing tokens and aliases.
- No new runtime dependency without a measured need, licence check, and maintenance check.
- No `!important` unless overriding third-party styles or reduced-motion safety.
- Verify with `npm run check`, `npm run lint`, `npm run build`, and browser screenshots before claiming completion.
- Astro 5.18.2 has known advisories with no v5 patch; do **not** major-upgrade during visual work. Report it as a remaining risk (static output, no server routes).
