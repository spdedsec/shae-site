# Design System — Field Manual

The Shae site is a **field manual / specimen sheet** for a systems language: warm paper, dark ink, one oxide-red signal, precise rules, and technical labels. It should read like documentation produced by a careful engineering studio, not a SaaS landing page.

## 1. Brand personality

| Trait | Expression |
| --- | --- |
| Precise | Hairline rules, aligned data, mono metadata, no decorative noise |
| Technical | Spec dossiers, chunk numbers, terminal surfaces, measured claims |
| Editorial | Large display type, left-aligned heroes, asymmetric two-column layouts |
| Confident | One accent colour, generous negative space, no gradients or glows |
| Low ceremony | Flat surfaces, no shadows, zero radius, direct copy |

The product is fast and unornamented. The design must feel the same way.

## 2. Visual direction

- **Ground:** warm paper (`#f2eee5`) rather than pure white.
- **Ink:** near-black warm brown (`#191712`) for text and inverted blocks.
- **Signal:** oxide red (`#b3341b`) for active state, emphasis, and one CTA per view.
- **Structure:** 1px rules create the grid. Cards are defined by borders, not shadows.
- **Geometry:** 0 radius everywhere. No pills, no blobs, no floating rounded panels.
- **Type:** Archivo for display, Instrument Sans for body, JetBrains Mono for labels and code.
- **Composition:** left-aligned heroes, ruled section kickers, numbered dossiers, asymmetric grids.
- **Density:** editorial spacing with compact technical metadata. Tables and spec lists are encouraged.

## 3. Colour tokens

All tokens are defined in `src/styles/global.css`.

| Token | Light | Dark | Vantablack | Use |
| --- | --- | --- | --- | --- |
| `--bg-base` | `#f2eee5` | `#17161a` | `#000000` | Page ground |
| `--bg-surface` | `#f7f4ec` | `#1d1c21` | `#080808` | Section bands, dossier |
| `--bg-card` | `#f7f4ec` | `#1d1c21` | `#080808` | Cards, panels |
| `--bg-card-subtle` | `#eae4d7` | `#242228` | `#111111` | Nested surfaces |
| `--bg-code` | `#17150f` | `#101014` | `#000000` | Terminal/code blocks |
| `--text-main` | `#191712` | `#e9e3d6` | `#ededed` | Primary text |
| `--text-muted` | `#5b564b` | `#a49c8d` | `#9a9a9a` | Body secondary |
| `--text-dim` | `#837c6d` | `#746d61` | `#666666` | Metadata |
| `--accent-primary` | `#b3341b` | `#ff6a45` | `#ff4d24` | Signal |
| `--accent-primary-hover` | `#8c2713` | `#ff8a6c` | `#ff7a5a` | Hover |
| `--border-color` | `rgba(25,23,18,.18)` | `rgba(233,227,214,.16)` | `#242424` | Default rules |
| `--border-bright` | `rgba(25,23,18,.42)` | `rgba(233,227,214,.4)` | `#454545` | Emphasis rules |
| `--border-focus` | `#b3341b` | `#ff6a45` | `#ff4d24` | Focus ring |

Semantic accents: `--accent-cyan` (code/links), `--accent-amber` (warnings), `--accent-green` (passing status). Do not use them as decoration.

### Theme rules

- Three themes only: `light`, `dark`, `vantablack` (legacy `oled` maps to `vantablack`).
- Theme is set on `<html data-theme>` and persisted in `localStorage['shae-theme']`.
- Inverted panels must use fixed paper text (`#f2eee5` / `--bg-code`), not `--bg-base`, so they stay readable in dark mode.
- Maintain WCAG AA contrast. Muted text is for secondary copy, not essential labels.

## 4. Typography

| Role | Family | Weight | Size | Notes |
| --- | --- | --- | --- | --- |
| Display | Archivo Variable | 700 | `clamp(2.55rem, 5.3vw, 4.55rem)` | `-0.045em`, line-height 0.96 |
| Section heading | Archivo | 700 | `clamp(2rem, 3.6vw, 3.15rem)` | `-0.04em` |
| Card title | Archivo | 700 | 1.4–1.7rem | `-0.03em` |
| Body | Instrument Sans | 400 | 1rem / 1.6 | Max 62–68ch |
| Lead | Instrument Sans | 400 | 1.02–1.14rem | Muted |
| Label | JetBrains Mono | 500 | 0.6–0.68rem | Uppercase, `0.1–0.14em` tracking |
| Code | JetBrains Mono | 400 | 0.8–0.86rem | Line-height 1.7 |

Rules:

- One display face and one text face. Do not introduce a third family.
- Mono is for metadata, labels, code, and numeric data — not body copy.
- Use `font-variant-numeric: tabular-nums` for data and counters.
- Avoid all-caps body text. Uppercase is reserved for short labels.
- No italic serif pull quotes; the old Times/burgundy editorial layer is retired.

## 5. Spacing and layout

- Base unit: 4px.
- Page gutter: `clamp(1.25rem, 4vw, 2.5rem)`.
- Container: max 1280px, centered.
- Section padding: 4.5–5.5rem desktop, 3rem mobile.
- Hero padding: 4.5rem top desktop, 3rem mobile.
- Grid gaps: 0 when rules form the grid; 2–4.5rem for content columns.
- Reading measure: 62–68ch for prose, 58ch for hero subtitles.

Breakpoints:

| Width | Behaviour |
| --- | --- |
| 1020px | Nav scrolls; chunk grids 2 columns; metrics 2 columns |
| 900px | Hero and major splits collapse to one column |
| 760px | Mobile header: controls row + nav row; cards stack |
| 680px | Chunk grids 1 column |
| 640px | Metrics 1 column; CTAs full width |

## 6. Surfaces and borders

- **Paper:** default page ground.
- **Surface band:** alternate section background for rhythm (metrics, footer).
- **Ink block:** `--bg-code` with paper text for deep-dive CTAs, publication cards, and terminals.
- **Card:** 1px border, flat fill, 0 radius, 1.35–1.75rem padding.
- **Rule:** 1px `--border-color`; use as section divider, table divider, or grid line.
- **Dossier:** bordered list with mono keys and values; header row uses accent.

Never use:

- `backdrop-filter` except the single sticky header material.
- `box-shadow` for elevation.
- Gradients as backgrounds or text fills.
- Border radius on cards, buttons, badges, inputs, or terminals.

## 7. Component standards

### Buttons

- Height 44px minimum on touch, 38px minimum on desktop compact controls.
- Primary: oxide fill, white text (dark themes use dark text for contrast).
- Secondary: transparent, 1px border, ink text.
- Ghost: text only, accent on hover.
- 0 radius. `:active` scales to 0.97–0.98 for immediate feedback.
- Arrow glyph may shift 3px on hover; no bouncing.

### Badges / labels

- Mono, uppercase, 0.6–0.68rem, 1px border, transparent fill.
- Use for release status, chunk IDs, categories, and spec labels.
- Never use as decorative confetti or repeated pill rows.

### Cards

- Border-defined, flat, 0 radius.
- Hover changes border colour; only interactive cards may translate 2px.
- Nested cards use `--bg-card-subtle`.
- No glass, no shadow, no gradient edge.

### Terminals

- Ink surface, 1px bright border, 0 radius.
- Header: 6px square markers (first accent), mono title, optional tag.
- Body: JetBrains Mono, 0.8–0.86rem, horizontal scroll for long lines.
- Terminal content must remain legible in all themes.

### Tables

- Full-width, 1px row rules, mono uppercase headers, tabular numerals.
- Wrap in `overflow-x: auto` on mobile; never let a table widen the page.
- Highlight recommended rows with an accent left border, not a fill.

## 8. Imagery and icons

- Prefer typographic diagrams and ASCII/terminal art over stock imagery.
- Icons are rare; use simple geometric marks (squares, arrows, plus/minus) rather than emoji.
- Do not add decorative SVG blobs, grids, or noise overlays.

## 9. Motion

See `MOTION.md`. Motion is typesetting and state feedback, not decoration. The header is the only translucent material.

## 10. Responsive behaviour

- Heroes left-align at every width; no centered mobile hero.
- Two-column splits collapse at 900px.
- Nav becomes a second row at 760px, horizontally scrollable, with 40px targets.
- Tables and terminal code scroll inside their own containers.
- No horizontal page overflow at 320–1440px. Verify at 390px.
- Footer stacks to one column below 760px.

## 11. Quality checklist

- [ ] One `h1`, clear hierarchy, no orphan headings.
- [ ] Accent used for signal, not decoration.
- [ ] Every card earns its border; no card grid used as filler.
- [ ] Mono labels are short and factual.
- [ ] No generic SaaS, gradient, glass, or pill patterns.
- [ ] Text contrast AA; focus visible; keyboard paths complete.
- [ ] Layout verified at 1440, 1024, 768, 390.
- [ ] Reduced motion and reduced transparency respected.
- [ ] Screenshots inspected, not just typechecked.
