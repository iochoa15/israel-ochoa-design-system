# Design Token System Generator — One-Shot Prompt

You are a senior design systems architect.

Generate a complete, production-ready design token system for a personal portfolio brand.

Return exactly two artifacts:
1. `design-tokens.json` (Tokens Studio DTCG-compatible, single-set format — see JSON Contract)
2. `design-tokens-usage-guide.md`

Return no extra commentary.

---

## Context

This system is for a portfolio showcasing AI product design, brand design, and art direction.

Brand personality: clean, elegant, technological, modern, honest, warm.
Visual concept: tactile plasticine-inspired illustration elements balanced by a polished digital framework.
Targets: Figma (Tokens Studio with W3C DTCG mode), Framer/CSS custom properties, Tailwind config, raw JSON.

---

## Required Inputs

Use attached references:
- Color palette screenshot
- Gradient samples
- Glass material reference
- Plasticine elements image
- "Design-System-Inspired-by-..." screenshots

If any required input is missing or ambiguous, ask one concise clarifying question and stop.

---

## Immutable Source Hex Values (must be preserved exactly)

- `#E54633` (red-coral)
- `#8CC8DB` (teal)
- `#FCFCD4` (cream)
- `#FDFDFD` (white)
- `#F6F5E9` (warm cream)
- `#EEEDEB` (light gray)
- `#242424` (near-black)
- `#333333` (dark gray)
- `#5D8DF7` (periwinkle blue)
- `#A6ACC6` (muted lavender)
- `#CDD2EB` (light lavender)

Never alter these values.

---

## Missing Scales You Must Generate

Generate cohesive scales for:
- success green (warm, muted; no neon/mint)
- warning amber (warm amber/gold; no harsh orange)
- dark neutrals (warm gray, not blue-gray)
- light neutrals (warm white/cream family)
- teal full scale
- red-coral full scale
- blue-lavender cohesive scale

If blue and lavender must be split into two separate scales, ask for confirmation before finalizing.

Every generated color must include: `"$extensions": { "generated": true }`.
Immutable source colors must NOT include the generated flag.

---

## Architecture Rules

The entire token system lives in ONE token set named `design-system`. All collections are groups within that single set. This is required for Tokens Studio DTCG mode to resolve cross-collection references correctly.

### Collection structure (in this exact order)

```
design-system
├── color
│   ├── primitive       ← raw palette (no semantic meaning)
│   ├── semantic        ← semantic roles referencing color.primitive
│   ├── surface         ← component layer referencing color.semantic
│   ├── text            ← component layer referencing color.semantic
│   ├── icon            ← component layer referencing color.semantic
│   └── stroke          ← component layer border colors referencing color.semantic
├── typography
│   ├── primitive       ← font-family, font-weight, font-style raw values
│   ├── alias           ← semantic font-family aliases referencing typography.primitive
│   ├── vars
│   │   ├── font-size   ← individual Number variables per breakpoint per scale
│   │   └── line-height ← individual Number variables per breakpoint per scale
│   └── styles          ← composite typography tokens per breakpoint
│       ├── desktop, desktop-rem
│       ├── tablet, tablet-rem
│       └── mobile, mobile-rem
├── spacing             ← dimension tokens referencing number scale
├── border
│   ├── width
│   └── radius
└── number              ← 4pt primitive scale
```

### color.primitive (raw palette only)

- No semantic meaning. Group by hue family.
- Color scale range `100..1200` (lighter to darker).
- Allowed increments: 100 default, 50 optional, 25 only when needed.
- Keep pure black/white in `color.primitive.white-and-black`.
- Place immutable colors at their perceptually correct scale position.

### color.semantic (semantic roles)

- Must reference `color.primitive` tokens only — never raw hex.

Semantic roles:
- primary → red-coral
- secondary → teal
- tertiary → blue-lavender
- information → brighter blue-lavender range
- success → generated green
- warning → generated amber
- error → red-coral
- neutral-light → warm light neutrals
- neutral-dark → warm dark neutrals
- foundations → white/black

Single-brand system: do not create alias modes.

### color.surface / color.text / color.icon / color.stroke (component layer)

- Must reference `color.semantic` tokens only — never `color.primitive` directly.
- Include `light` and `dark` sub-groups for each.
- Include default, hover, focus, disabled states (no pressed state).
- If a token has the same value across light and dark modes, suffix it with `-fixed`.

Required surface tokens:
- page, default, elevated, action, action-hover, action-hover-light
- secondary, secondary-hover, disabled
- success, warning, information, error
- `glass-fixed` (composite: `$type: "composition"`, value has background, opacity, border, blur)
- `gradient-primary-fixed` (`$type: "gradient"`, linear-gradient using color.semantic references)
- `gradient-accent-fixed` (`$type: "gradient"`, linear-gradient using color.semantic references)

Note: glass and gradients use the `-fixed` suffix because they are intentionally mode-invariant.

Required text tokens:
- heading, hero, body, caption, placeholder
- action, action-hover, disabled
- on-action, on-secondary
- on-surface-success, on-surface-warning, on-surface-information, on-surface-error
- success, warning, information, error
- on-action-aa (AA-safe alternate)

Icon tokens mirror text semantics.

Stroke tokens:
- default, action, action-hover, focus, disabled, subtle
- success, warning, information, error

### typography.primitive

- font-family: `Wixmadefor Display Variable`, `Wixmadefor Text Variable`, `Newsreader Variable`
- font-weight: use the **weight name string** exactly as Figma exposes it for the font — never use numeric CSS values (300, 500, 700). Numeric values cause "Error setting font family/weight combination" in Tokens Studio.
  - `light` → `"Light"`
  - `regular` → `"Regular"`
  - `medium` → `"Medium"`
  - `semi-bold` → `"SemiBold"`
  - `bold` → `"Bold"`
- font-style (strings): `normal`, `italic`

### typography.alias

- `display` → references `typography.primitive.font-family.display`
- `body` → references `typography.primitive.font-family.body`
- `accent` → references `typography.primitive.font-family.accent`

### typography.vars (Figma Number variables)

For each breakpoint (`desktop`, `tablet`, `mobile`) and each type scale step, generate:
- `typography.vars.font-size.<breakpoint>.<scale>` — `$type: "number"`, unitless integer (px value without unit)
- `typography.vars.line-height.<breakpoint>.<scale>` — `$type: "number"`, unitless integer

These allow Tokens Studio to push font-size and line-height as Figma Number variables (separate from text styles).

### typography.styles (composite text styles)

Six breakpoints: `desktop`, `desktop-rem`, `tablet`, `tablet-rem`, `mobile`, `mobile-rem`.

- `desktop` and `mobile` use `px` units (e.g. `"72px"`). `*-rem` variants use `rem` units (base 16px).
- `tablet` sizes are the midpoint between desktop and mobile for headings; body and caption are unchanged.

Desktop type scale (fontSize/lineHeight):
- hero: 72/84
- h1: 60/72
- h2: 48/56
- h3: 40/48
- h4: 32/40
- h5: 24/28
- h6: 20/24
- body-large: 20/28
- body-medium: 16/24
- body-small: 14/20
- body-x-small: 12/16
- caption: 12/16

Tablet heading font sizes (lineHeights match desktop):
- hero: 64, h1: 54, h2: 44, h3: 36, h4: 30, h5: 24, h6: 20

Mobile heading font sizes (lineHeights match desktop):
- hero: 56, h1: 48, h2: 40, h3: 32, h4: 28, h5: 24, h6: 20

Body and caption sizes are identical across all three breakpoints.

Style variants per size: `regular`, `semi-bold`, `bold`, `italic`, `link`
- `italic` uses `typography.alias.accent` (Newsreader) as fontFamily
- `link` uses fontWeight medium and textDecoration underline
- All others use `typography.alias.display` as fontFamily

### spacing

Tokens reference the `number` scale. Value format: `{number.200}` — never append `px` to a reference string.

Spacing steps: `none`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`

### border

- `border.width`: none, small (1), medium (2), large (3)
- `border.radius`: none, small, medium, large, xl (reference `number` tokens), round (9999)

### number (4pt primitive scale)

- 25=1, 50=2, 100=4, 200=8, 300=12, 400=16, 500=20, 600=24, 700=28, 800=32, 900=40, 1000=48, 1100=64, 1200=80

---

## JSON Contract (strict)

### Single-set wrapper (required)

The entire output must be wrapped in a single top-level key:

```json
{
  "design-system": {
    "color": { ... },
    "typography": { ... },
    "spacing": { ... },
    "border": { ... },
    "number": { ... }
  }
}
```

This is required because Tokens Studio DTCG mode does not resolve cross-set references. All tokens must live in one set so references resolve within the same set.

### Each token must include

- `$value`
- `$type`
- `$description`

### Reference style (all paths relative to the design-system set root)

- `color.semantic` → `{color.primitive...}`
- `color.surface/text/icon/stroke` → `{color.semantic...}`
- `typography.alias` → `{typography.primitive.font-family...}`
- `typography.styles` → `{typography.alias...}` and `{typography.primitive.font-weight/font-style...}`
- `spacing`, `border.radius` → `{number...}`

References never cross collection boundaries with old-style prefixes (`brand.`, `alias.`, `mapped.`, `responsive.`). All paths use the new structure above.

### Generated color flag

Use `$extensions` — never place `generated` at the token root level:

```json
"$extensions": { "generated": true }
```

### Spacing reference format

Always use a bare token reference — never concatenate a reference with a unit string:

```json
"$value": "{number.200}"
```
Not: `"{number.200}px"` (invalid in DTCG).

### Metadata

Include a `meta` key at the root of `design-system` (not a token set) with:
- `meta.audit.input_anchors_confirmed` (all immutable hex values)
- `meta.audit.generated_color_count`
- `meta.audit.reference_chain_validation`
- `meta.audit.wcag_failures` (array — do not auto-correct, only report)

---

## Tokens Studio Import Instructions (include in usage guide)

1. Open Tokens Studio in Figma.
2. Go to Settings → set **Token Format** to **W3C DTCG** before importing.
3. Load the JSON file via **Sync → Load from file**.
4. You should see exactly **one token set** named `design-system` in the left panel.
5. Enable it. All references will resolve within the single set.

If you see multiple sets (brand, alias, mapped, etc.) the file was generated without the single-set wrapper — regenerate it.

---

## Usage Guide Requirements

In `design-tokens-usage-guide.md`, explain:
- Tokens Studio setup (DTCG mode, single-set import)
- Collection structure and what each group contains
- When to use each surface token (page/default/elevated/glass/gradient)
- When to use each text token (heading/hero/body/caption)
- Typography: text styles vs Number variables — when to use each
- How to apply text styles in Tokens Studio (select layer → click token)
- Breakpoint coverage: desktop, tablet, mobile — what changes and what doesn't
- Rem variants: when to use `*-rem` breakpoints for CSS output
- Glass implementation in CSS (backdrop-filter, opacity, border)
- Gradient usage in CSS and recommended scenarios
- Plasticine integration guidance and contrast considerations
- Border-radius philosophy (when to use each size)
- Typography pairings (Display vs Text vs Newsreader)
- Light vs dark mode behavior (what changes, what remains fixed)
- Primary vs secondary vs tertiary usage guidance

---

## Non-Negotiables

1. Never alter immutable source hex values.
2. Always mark generated colors with `$extensions: { "generated": true }` — not at the token root.
3. Never skip tiers.
4. Do not create semantic alias modes.
5. Do not create pressed state tokens.
6. Always support border/stroke tokenization for component workflows.
7. Keep body and caption sizes identical across all breakpoints.
8. Always wrap the full output in `{ "design-system": { ... } }`.
9. Never use `{token.reference}px` — spacing/dimension references must not have a unit suffix.
10. Return only the two requested artifacts.
