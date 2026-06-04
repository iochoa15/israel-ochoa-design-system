# Israel Ochoa — Design System

A complete, token-first design system for [io-c.design](https://io-c.design) — built with Figma variables, a custom Figma documentation plugin, and Framer-ready token exports.

---

## Preview

| Colors | Typography — Headings | Typography — Body |
|--------|----------------------|-------------------|
| ![Colors](figma%20auto%20frame%20tool%20/screenshots/Better%20design%20samples/Colors.jpg) | ![Headings](figma%20auto%20frame%20tool%20/screenshots/Better%20design%20samples/Headings.jpg) | ![Text](figma%20auto%20frame%20tool%20/screenshots/Better%20design%20samples/Text.jpg) |

---

## What's in this repo

```
israel-ochoa-design-system/
├── design-tokens-fixed.json          # Source of truth — W3C token format, imported via Token Studio
├── design-tokens.json                # Secondary token file
├── design-tokens-usage-guide.md      # Usage rules for surfaces, text, spacing, and components
│
├── figma auto frame tool/
│   ├── manifest.json                 # Figma plugin manifest
│   ├── code.js                       # Plugin logic — generates documentation frames
│   ├── ui.html                       # Plugin UI (8 generator buttons)
│   └── screenshots/                  # Reference frames from Figma canvas
│
├── framer/
│   ├── design-tokens.css             # CSS custom properties
│   ├── design-tokens.ts              # TypeScript token map
│   └── tailwind-tokens.js            # Tailwind config extension
│
├── documents/
│   ├── design-best-practices.md      # Figma + Framer workflow patterns
│   ├── design-system-prompt.md       # System design brief
│   └── references/                   # Visual inspiration references
│
└── tokens claude design/
    └── tokens.figma.json             # Alternative Figma token format
```

---

## Design Tokens

Tokens live in `design-tokens-fixed.json` and are imported into Figma as variables using [Token Studio](https://tokens.studio/).

### Token categories

| Category | Contents |
|----------|----------|
| **Color / Primitive** | 12-step palettes: red-coral, teal, blue-lavender, success-green, warning-amber, neutral-light, neutral-dark, cream, white-and-black |
| **Color / Semantic** | primary, secondary, tertiary, info, success, warning, error, neutral, foundations, surfaces, glass |
| **Typography** | Composite styles for Desktop / Tablet / Mobile across displays, headings, body, label, caption, overline |
| **Spacing** | 4px-grid semantic aliases: 2xs → 5xl |
| **Border** | Width (none / sm / md / lg) + Radius (sm → full) |
| **Shadow** | sm / md / lg / xl — warm-tinted drop shadows |
| **Component / Button** | 6 variants × 3 sizes |

### Typography scale

Built on the golden ratio (φ = 1.618) — display sizes step down by φ across breakpoints.

| Role | Desktop | Tablet | Mobile |
|------|---------|--------|--------|
| Display Large | 110 / 128 lh | 89 / 104 lh | 68 / 84 lh |
| Display Medium | 68 / 84 lh | 55 / 68 lh | 42 / 52 lh |
| Display Small | 42 / 52 lh | 34 / 42 lh | 26 / 32 lh |
| H1 | 42 / 52 lh | 34 / 42 lh | 26 / 32 lh |
| H2 | 34 / 42 lh | 26 / 32 lh | 20 / 26 lh |
| H3 | 26 / 32 lh | 20 / 26 lh | 16 / 20 lh |
| H4 | 20 / 26 lh | 16 / 20 lh | 13 / 16 lh |
| H5 | 16 / 20 lh | 13 / 16 lh | 10 / 14 lh |
| H6 | 13 / 16 lh | 10 / 14 lh | 10 / 14 lh |
| Body Large | 20 / 32 lh | 18 / 29 lh | 16 / 26 lh |
| Body Medium | 16 / 26 lh | 16 / 26 lh | 14 / 22 lh |
| Body Small | 13 / 21 lh | 13 / 21 lh | 13 / 21 lh |
| Body X-Small | 10 / 16 lh | 10 / 16 lh | 11 / 18 lh |
| Label | 13 / 16 lh | 13 / 16 lh | 13 / 16 lh |
| Caption | 11 / 16 lh | 11 / 16 lh | 11 / 16 lh |
| Overline | 10 / 14 lh | 10 / 14 lh | 10 / 14 lh |

### Typefaces

| Role | Font | Weight / Style |
|------|------|---------------|
| Display Large–Small | Newsreader | Regular |
| H1, H2 | Newsreader | Light |
| H3 | Newsreader | Light Italic |
| H4 | Wix Madefor Text | Regular |
| H5 | Newsreader | Italic |
| H6 | Wix Madefor Text | Bold |
| Body Large–X-Small | Wix Madefor Text | Regular |
| Label | Newsreader | Italic |
| Caption | Wix Madefor Text | Regular |
| Overline | Wix Madefor Text | SemiBold — ALL CAPS |

---

## Figma Plugin — Token Frame Generator

The plugin reads imported variables and renders styled documentation frames directly on the Figma canvas.

### Install

1. Open Figma → **Plugins → Development → Import plugin from manifest**
2. Select `figma auto frame tool /manifest.json`

> Use **Plugins → Development**, not the Widgets menu.

### Generators

The plugin UI has 8 buttons:

| Button | Output |
|--------|--------|
| Color Palette | Color swatches grouped by primitive / semantic |
| Typography | Type scale rows for Desktop / Tablet / Mobile |
| Spacing | Spacing scale with visual size bars |
| Border Radius | Radius swatches |
| Shadows | Drop shadow previews |
| Buttons | All 6 variants × 3 sizes |
| Surfaces & Glass | Surface color + glass effect swatches |
| Generate All | Runs all generators at once |

---

## Framer Integration

Token files in `framer/` are ready to drop into a Framer project:

- **`design-tokens.css`** — paste into a global CSS override or code component
- **`design-tokens.ts`** — import and use as typed token constants
- **`tailwind-tokens.js`** — extend your Tailwind config with `extend: require('./tailwind-tokens')`

---

## Button Variants

| Variant | Background | Text |
|---------|-----------|------|
| primary | `#E54633` (red-coral) | white |
| secondary | transparent + border | `#1B1A18` |
| ghost | transparent, no border | `#1B1A18` |
| sky | `#8F99C2` (blue-lavender) | white |
| dark | `#1B1A18` | white |
| soft-red | `#FFF4F1` | `#E54633` |

Sizes: **Small** 8/20px · **Medium** 12/24px · **Large** 16/32px

---

## Tools Used

- [Token Studio](https://tokens.studio/) — Figma variable import
- [Figma](https://figma.com) — design + variable management
- [Framer](https://framer.com) — production site
- Figma Plugin API v1 — custom documentation frame generator
