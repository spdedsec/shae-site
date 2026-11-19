# shae.

**The official website, documentation, and interactive playground for the Shae programming language.**

A static Astro site built like a field manual: warm paper, dark ink, one oxide-red signal, precise rules, and technical typography. No React, no client framework, no runtime animation library.

[![Astro](https://img.shields.io/badge/Astro-5.18-FF5D01?style=flat-square)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square)](https://www.typescriptlang.org/)
[![Lighthouse](https://img.shields.io/badge/Lighthouse-100%20%2F%20100%20%2F%20100%20%2F%20100-2D6A3E?style=flat-square)](https://developer.chrome.com/docs/lighthouse/overview)
[![License](https://img.shields.io/badge/License-MIT-B3341B?style=flat-square)](LICENSE)

---

## What this is

The site covers the Shae language, its architecture, benchmark methodology, installation paths, guided tour, and a browser REPL. Product facts, version numbers, benchmarks, and copy are owned by the project — the interface is designed to present them without marketing noise.

**Live:** <https://shae-site.vercel.app>

### Routes

| Route         | Purpose                                                    |
| ------------- | ---------------------------------------------------------- |
| `/`           | Overview, capabilities, telemetry, positioning, quickstart |
| `/docs`       | Complete guide, standard library reference, module map     |
| `/features`   | Architecture, chunks 1–34, parity matrix, CLI              |
| `/benchmarks` | Cold start, throughput, memory, roadmap                    |
| `/download`   | Install paths, platform matrix, verification, editor setup |
| `/tour`       | Guided language walkthrough                                |
| `/repl`       | Interactive browser REPL                                   |

---

## Design direction

**Field Manual / Specimen Sheet.** The site should read like documentation produced by a careful engineering studio, not a SaaS landing page.

- Warm paper (`#F2EEE5`), ink (`#191712`), oxide signal (`#B3341B`).
- Archivo for display, Instrument Sans for body, JetBrains Mono for technical labels.
- Hairline rules, zero border radius, flat surfaces, no gradients or glass.
- Left-aligned editorial composition; spec dossiers, data sheets, and measured claims.
- Light, dark, and vantablack themes.
- Native CSS motion only: typeset reveals, scroll progress, precise hover/focus, cross-document view transitions.
- Full `prefers-reduced-motion` support.

Read the system before changing the interface:

- [`DESIGN.md`](DESIGN.md) — brand, tokens, typography, layout, surfaces, components
- [`MOTION.md`](MOTION.md) — timing, easing, transitions, reduced motion, performance
- [`COMPONENTS.md`](COMPONENTS.md) — component architecture, naming, accessibility, usage
- [`AGENTS.md`](AGENTS.md) — project rules for coding agents

---

## Stack

| Layer           | Choice                                          |
| --------------- | ----------------------------------------------- |
| Framework       | Astro 5.18, static output                       |
| Language        | TypeScript, strict                              |
| Package manager | npm with lockfile                               |
| Styling         | Scoped Astro CSS + global token layer           |
| Fonts           | Self-hosted Fontsource variable fonts (OFL-1.1) |
| Client JS       | Minimal inline scripts only; no framework       |
| Navigation      | Native cross-document View Transitions          |
| Animation       | CSS, View Transitions, `animation-timeline`     |
| Testing         | Playwright, axe-core, Lighthouse CI             |
| Deployment      | Vercel static build (`dist/`)                   |

**Deliberate omissions:** React, GSAP, Motion, Lenis, Three.js, React Three Fiber, Anime.js, React Spring, ClientRouter. The site has no React or 3D surface, and native CSS covers the motion at 0 kB runtime.

---

## Development

```bash
npm install
npm run dev
```

The dev server runs at <http://localhost:4321>.

### Commands

| Command              | Purpose                                 |
| -------------------- | --------------------------------------- |
| `npm run dev`        | Start the local dev server              |
| `npm run build`      | Build the static site into `dist/`      |
| `npm run preview`    | Preview the production build            |
| `npm run check`      | Astro + TypeScript diagnostics          |
| `npm run lint`       | ESLint for Astro and TypeScript         |
| `npm run format`     | Format with Prettier                    |
| `npm run test`       | Full Playwright suite                   |
| `npm run test:a11y`  | axe accessibility scans                 |
| `npm run test:ui`    | Playwright interactive UI               |
| `npm run lighthouse` | Lighthouse CI budgets on the built site |
| `npm run analyze`    | Bundle treemap at `dist/stats.html`     |
| `npm run ship-check` | Typecheck, lint, build, and test        |

---

## Quality gates

| Gate                   | Current result                                                  |
| ---------------------- | --------------------------------------------------------------- |
| `astro check`          | 0 errors, 0 warnings, 0 hints                                   |
| ESLint                 | clean                                                           |
| Production build       | 7 static pages, ~1.7 MB `dist/`                                 |
| Playwright             | 67 passed, 3 skipped (visual tests for the other project)       |
| axe / WCAG 2.1 A/AA    | 0 violations across all routes at 1440 and 390                  |
| Lighthouse `/`         | 100 performance, 100 accessibility, 100 best practices, 100 SEO |
| Lighthouse `/docs`     | 100 / 100 / 100 / 100                                           |
| Lighthouse `/download` | 100 / 100 / 100 / 100                                           |
| Core Web Vitals        | LCP 1.7 s, TBT 0–20 ms, CLS 0                                   |

Visual regression baselines live in `tests/visual.spec.ts-snapshots/`. They are Linux-specific; regenerate them on another OS with `npx playwright test --update-snapshots`.

### What the tests cover

- Every route renders with one `h1` and no console errors.
- No page-level horizontal overflow at desktop or mobile widths.
- Theme persistence, code tabs and keyboard navigation, copy feedback, docs quick nav, benchmark filters, REPL run/clear, audio pressed state.
- Reduced-motion visibility, disabled animation, and no overflow.
- axe scans for WCAG 2.1 A/AA (the site aims for 2.2 AA semantics).
- Visual snapshots of the home hero, docs hero, and mobile hero.

---

## Project structure

```text
src/
  components/       Navigation, Footer, SoundEffects
  layouts/          Layout.astro — head, theme bootstrap, skip link, shell
  pages/            index, docs, features, benchmarks, download, tour, repl
  styles/           global.css — tokens, type, primitives, motion, a11y
tests/              Playwright suites + visual baselines
scripts/            a11y-report.mjs — concise axe report
.agents/skills/     Project-level agent skills
.opencode/          Agents, commands, Impeccable skill
AGENTS.md           Agent rules and verification workflow
DESIGN.md           Visual system
MOTION.md           Motion system
COMPONENTS.md       Component system
```

---

## Agent toolkit

This repository is set up for coding agents as well as humans.

- **Skills:** `frontend-design`, `apple-design`, `impeccable`, `animate`, `animation-performance`, `find-animation-opportunities`, `improve-animations`, `review-animations`, `web-design-guidelines`, `writing-guidelines`.
- **Specialist agents:** creative frontend designer, motion design engineer, frontend performance engineer, accessibility engineer, visual QA engineer, code reviewer.
- **Commands:** `/design-audit`, `/motion-audit`, `/performance-audit`, `/accessibility-audit`, `/responsive-audit`, `/visual-review`, `/component-audit`, `/ship-check`, `/impeccable`.
- **MCP:** Context7, Playwright, Chrome DevTools (project-level `opencode.json`).

See [`AGENTS.md`](AGENTS.md) for the full workflow and constraints.

---

## Deployment

The build is fully static. `npm run build` writes `dist/`; deploy that directory to Vercel or any static host. The canonical site URL is configured in `astro.config.mjs`.

No server routes, environment secrets, or runtime services are required.

---

## Notes

- Astro 5.18.2 has known advisories with no v5 patch. A major upgrade was intentionally not performed during the visual redesign; the site is static, but this remains a tracked risk.
- Lighthouse upload is configured for the local filesystem (`.lighthouseci/`). No external analytics or telemetry is sent.
- `npm run lighthouse` uses `/usr/bin/chromium`; adjust `CHROME_PATH` for other environments.

---

## License

MIT. See [`LICENSE`](LICENSE).
