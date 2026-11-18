# Motion System

Motion on the Shae site is **typesetting, state, and orientation** — never decoration. The site is static documentation; reading speed and perceived precision matter more than spectacle.

## 1. Principles

1. **Motion explains a change.** A page transition says “new sheet.” A tab underline says “this panel.” A button press says “received.”
2. **One system.** Native CSS, the View Transitions API, and the browser’s scroll timeline. No GSAP, Motion, Lenis, or React Spring in this Astro project.
3. **Fast by default.** Most transitions are 140–240ms. Page transitions are 320ms. Nothing loops except a 2.4s status pulse and the scroll progress rule.
4. **Never block reading.** Content is visible without JavaScript. Animation only adds a short entrance or state cue.
5. **Respect the user.** `prefers-reduced-motion`, `prefers-reduced-transparency`, and `prefers-contrast` all have explicit fallbacks.
6. **Transform and opacity first.** `clip-path` is used for the page/hero reveal; no layout-triggering properties are animated.

## 2. Timing and easing

| Token | Value | Use |
| --- | --- | --- |
| `--dur-fast` | 140ms | Hover, colour, border, press |
| `--dur-base` | 240ms | Tabs, nav underline, card border |
| `--dur-slow` | 620ms | Page-load typeset reveal |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entrances, reveals |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Symmetric state changes |

Press feedback is intentionally near-instant (80ms, `scale(0.97)`) so controls feel physical.

## 3. Patterns

### Page load: typeset reveal

`.animate-fade-up` (legacy class name) uses `typeset-in`: `clip-path: inset(0 0 100% 0)` → `inset(0)`, with opacity rising. It reads like a line being set, not a card floating up. Stagger with `.delay-100` … `.delay-500`.

- Hero eyebrow: 0ms
- Title: 100ms
- Subtitle: 200ms
- Actions: 300ms
- Dossier/terminal: 300–400ms

Only above-the-fold content uses entrance animation. Sections below the fold do not animate on scroll.

### Page navigation: sheet wipe

The site ships **no client router**. Cross-document transitions are declared with CSS:

```css
@view-transition { navigation: auto; }
```

Chromium animates same-origin navigations; other browsers perform a normal navigation. The effect is zero-JS and progressive.

- Old page: 160ms fade to 40% opacity.
- New page: 320ms `clip-path` wipe from bottom (`inset(0 0 100% 0)` → `inset(0)`).
- The header and footer use `view-transition-name`, so they persist without re-animating.
- `prefers-reduced-motion` disables all view-transition animation.

### Scroll: native progress rule

A 2px oxide rule at the top of the viewport scales from 0 to 1 using `animation-timeline: scroll(root)`. It is CSS-only, does not hijack scroll, and disappears under reduced motion. There are no scroll-triggered reveals.

### Hover and focus

- Nav: 2px underline grows from left over 240ms.
- Links: 1px underline thickens to 2px; colour shifts to oxide.
- Cards: border colour changes over 240ms; interactive cards lift 2px.
- Buttons: arrow shifts 3px; no bounce.
- Focus: 2px oxide outline, 3px offset, always visible.

### Tabs and panels

- Active tab: oxide 2px bottom border + full-opacity text.
- Panels switch instantly; no height animation (avoids layout thrash and content jump).
- Copy buttons: label changes to “Copied” for 1.6–2s, then resets.

### Header material

The sticky header is the only translucent surface: `color-mix(in srgb, var(--header-bg) 84%, transparent)` + `backdrop-filter: blur(18px) saturate(1.15)`. It is a navigation material, not a glass card.

Fallbacks:

- `prefers-reduced-transparency: reduce` → opaque `--header-bg`, no blur.
- `prefers-contrast: more` → opaque, stronger border.

## 4. Reduced motion

Global override in `global.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

Additionally: scroll behaviour becomes `auto`, the scroll progress rule is hidden, all entrance classes are forced visible, and hover transforms are removed. Content must be complete with animation disabled.

Playwright test `tests/motion.spec.ts` emulates `reducedMotion: 'reduce'` and asserts that hero content is visible and no long animation runs.

## 5. Performance constraints

- Animate only `transform`, `opacity`, and `clip-path`.
- No `requestAnimationFrame` loops, no scroll listeners, no parallax.
- No continuously animated canvases, blurs, or filters. The header blur is a single 68px strip.
- No `will-change` unless a measured jank issue appears; avoid permanent compositor layers.
- No layout reads/writes in animation handlers. There are no animation handlers.
- Terminal and table overflow scroll inside their containers; page-level overflow is a bug.
- Test on a throttled CPU (Chrome DevTools MCP) before adding any new effect.

## 6. Libraries evaluated but not installed

| Library | Decision | Reason |
| --- | --- | --- |
| Motion | Not installed | No React; the site needs no JS animation runtime. |
| GSAP + ScrollTrigger | Not installed | No orchestrated timelines or scroll storytelling; would add ~70KB+ and scroll coupling. |
| Lenis | Not installed | Native scroll is correct for a documentation site; smooth-scroll hijacking harms accessibility. |
| Three.js / React Three Fiber | Not installed | No genuine 3D content; cost outweighs value. |
| Anime.js | Not installed | No advantage over CSS for the current interactions. |
| React Spring | Not installed | No React. |
| React Bits / Magic UI / Motion Primitives | Not installed | React source components; would introduce a second visual system. |

If the project later gains a genuinely interactive canvas or timeline-driven product demo, evaluate **one** library against bundle size, licence, accessibility, and reduced-motion support before adding it. Do not install a library for a single hover effect.

## 7. Motion review checklist

- [ ] Does the motion explain a state change or orient the user?
- [ ] Is it under 320ms unless it is a deliberate page transition?
- [ ] Does it animate only transform/opacity/clip-path?
- [ ] Is there a reduced-motion path that leaves content intact?
- [ ] Does it work on touch and with keyboard focus?
- [ ] Does it avoid competing with reading or scroll?
- [ ] Is it cleaned up on unmount/navigation (no leaked timers/listeners)?
- [ ] Was it inspected in the browser at 390px and 1440px?
