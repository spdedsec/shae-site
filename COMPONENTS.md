# Component System

## Architecture

- **Astro components** render HTML and scoped CSS. No React, Vue, Svelte, or client UI runtime.
- **Global layer:** `src/styles/global.css` defines tokens, resets, shared primitives (`.container`, `.badge`, `.btn`, `.card`, `.terminal-window`, tables), motion, themes, and accessibility overrides.
- **Page layer:** each route has a scoped `<style>` block. Page-specific classes are prefixed or grouped by section (`hero-*`, `metric-*`, `doc-*`, `bench-*`, `dl-*`, `tour-*`, `repl-*`).
- **Layout:** `src/layouts/Layout.astro` owns the document head, theme bootstrap, skip link, header, main, footer, sound layer, and view transitions.
- **No component library.** shadcn/ui, Radix, Magic UI, React Bits, and Motion Primitives are React-based and are intentionally not installed.

## File map

| File | Responsibility |
| --- | --- |
| `src/layouts/Layout.astro` | Head/meta, fonts, theme FOUC guard, skip link, page shell, view-transition theme sync |
| `src/components/Navigation.astro` | Sticky header, brand, nav, theme select, audio toggle, GitHub link, mobile rows |
| `src/components/Footer.astro` | Brand column, link directory, colophon, status |
| `src/components/SoundEffects.astro` | Optional WebAudio click layer; `toggle-audio` event; `localStorage['shae-audio-muted']` |
| `src/pages/*.astro` | Route content and page-scoped styles |
| `src/styles/global.css` | Design tokens, primitives, motion, themes, a11y |

## Primitives

### `.container`

Max 1280px, centered, fluid gutter. Use once per section; do not nest containers.

### `.btn` variants

```html
<a class="btn btn-primary" href="/download">Get started <span class="arrow-glyph">→</span></a>
<a class="btn btn-secondary" href="/docs">Documentation</a>
<a class="btn btn-ghost" href="/features">Architecture</a>
```

- 0 radius, 1px border, 44px+ touch height.
- Primary: oxide fill; Secondary: transparent; Ghost: text only.
- `:active` scale 0.97; hover translate -1px. No shadows.
- Do not create page-local button styles; extend the global class instead.

### `.badge`

```html
<span class="badge">Chunk 28</span>
<span class="badge badge-red">v0.4.0</span>
<span class="badge badge-dark">Recommended</span>
```

Mono, uppercase, 1px border, transparent fill. Use for short factual labels, not decoration.

### `.card` / `.glass-card`

Legacy class names are preserved for compatibility. They now render **flat, 0-radius, 1px-border** surfaces with no blur or shadow. Prefer `.card`; `.glass-card` is an alias, not a glass effect.

```html
<div class="card">…</div>
<div class="card card-hover">…</div>
```

- Nested cards use `--bg-card-subtle`.
- Interactive cards may use `.card-hover` (2px lift, border emphasis).
- Static content cards must not lift.

### `.terminal-window`

```html
<div class="terminal-window">
  <div class="terminal-header">
    <div class="terminal-dots"><span class="terminal-dot dot-red"></span>…</div>
    <span class="terminal-title">install.sh</span>
  </div>
  <div class="terminal-body"><code>…</code></div>
</div>
```

Ink surface, 1px bright border, square 6px markers, mono content, horizontal scroll inside the body. Keep long lines scrollable; never let them widen the page.

### Tables

Wrap in a `.table-responsive` or page-specific scroll container:

```html
<div class="table-responsive">
  <table class="reference-table">…</table>
</div>
```

Mono uppercase headers, 1px row rules, tabular numerals. Highlight rows with a left accent border, not a fill.

### `.eyebrow` / `.index-mark`

- `.eyebrow` — mono uppercase label with a 1.4rem oxide rule before it. Use once at the top of a hero.
- `.index-mark` — oxide mono label for section numbering (`01 / Capabilities`). Use for real sequence, not arbitrary decoration.

### `.editorial-link`

Underlined inline link with a thickening rule on hover. Use for prose links; use `.btn` for actions.

## Naming

- Lowercase, hyphenated classes: `.metric-cell`, `.compare-card`, `.quick-link`.
- Page prefix when a class is not shared: `.dl-*` (download), `.bench-*`, `.doc-*`, `.tour-*`, `.repl-*`.
- State classes: `.active`, `.is-open`, `[aria-current="page"]`, `[aria-pressed]`.
- Do not introduce BEM double underscores or utility-class sprawl. This is a small, token-driven system.

## Accessibility expectations

- Every interactive element is a real `<a>` or `<button>`; no clickable `<div>`.
- Icon-only controls need `aria-label` and a visible focus ring.
- Tabs use `role="tablist"` / `role="tab"` / `aria-selected` where the markup supports it; otherwise buttons with `aria-pressed`.
- The theme `<select>` has an accessible name; the audio toggle exposes `aria-pressed`.
- One `h1` per page; heading order is sequential.
- All images/diagrams that convey meaning have text alternatives; decorative marks are `aria-hidden`.
- Motion and transparency have media-query fallbacks.
- Test with keyboard only and at 200% zoom.

## Dependencies

Runtime: **fonts only** — `@fontsource-variable/archivo`, `instrument-sans`, `jetbrains-mono` (OFL-1.1). No JS component or animation dependency.

Dev: Playwright, axe-core, ESLint, Prettier, Lighthouse CI, Rollup visualizer. See `package.json`.

## Usage examples

### Section header

```html
<div class="section-intro">
  <div class="section-kicker">
    <span class="index-mark">02 / Telemetry</span>
    <span class="kicker-rule" aria-hidden="true"></span>
  </div>
  <h2 class="section-heading">Architectural metrics</h2>
  <p class="section-desc">Measured with <code>shae bench</code> on release builds.</p>
</div>
```

### Spec dossier

```html
<aside class="hero-dossier" aria-label="Release specification">
  <div class="dossier-head"><span>Release dossier</span><span>SHAE / 04</span></div>
  <dl class="dossier-list">
    <div><dt>Version</dt><dd>0.4.0</dd></div>
    <div><dt>Runtime</dt><dd>Bytecode VM + AST</dd></div>
  </dl>
  <a class="dossier-link" href="/download">Install the binary <span aria-hidden="true">↓</span></a>
</aside>
```

### Copy control

Use a real `<button>` with a stable label and a temporary “Copied” state. Keep the original text in a data attribute or variable so it can be restored; do not rely on animation for feedback. Clear timers on navigation.

## Extending the system

1. Check whether an existing primitive can carry the new content.
2. Add a token before adding a colour or size.
3. Prefer a rule or spacing change over a new surface.
4. Keep page CSS scoped; promote to `global.css` only when at least two pages need it.
5. Run `npm run check`, `npm run lint`, `npm run test`, and inspect screenshots at 390/1440.
6. Update this file and `DESIGN.md` if the system changes.
