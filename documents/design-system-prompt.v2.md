# Design Token System Generator (v2, deterministic)

## Objective

Generate a production-ready design token system for a portfolio brand using a strict token pipeline:

`brand -> alias -> mapped -> responsive`

Return:
1. `design-tokens.json` (Tokens Studio compatible)
2. `design-tokens-usage-guide.md`

If any required input is missing, stop and ask exactly one clarifying question before continuing.

---

## Required Inputs

Use these reference files when available:
- color palette screenshot
- gradient samples
- glass material surface reference
- plasticine elements image
- "Design-System-Inspired-by-..." screenshots

Hard requirements:
- Preserve all listed source hex values exactly.
- You may generate additional values only where scales are missing.
- Every generated color must be clearly marked with metadata.

---

## Brand Context

- Personality: clean, elegant, technological, modern, honest, warm
- Visual concept: tactile 3D plasticine elements inside a polished digital framework
- Export targets: Figma (Tokens Studio), Framer/CSS variables, Tailwind config, raw JSON

---

## Source Color Anchors (immutable)

### Brand Core
- `#E54633` red-coral
- `#8CC8DB` teal
- `#FCFCD4` cream

### Surfaces
- `#FDFDFD` white
- `#F6F5E9` warm cream
- `#EEEDEB` light gray

### Text
- `#242424` near-black
- `#333333` dark gray
- `#E54633` action text

### Blue-Lavender Family
- `#5D8DF7` periwinkle blue
- `#A6ACC6` muted lavender
- `#CDD2EB` light lavender

### Missing semantic scales to generate
- success green (warm, muted)
- warning amber (warm, non-neon)
- dark neutrals scale (warm gray, not blue-gray)
- light neutrals scale (warm white/cream family)
- teal full scale
- red-coral full scale
- blue-lavender cohesive scale (or split to blue + lavender only if necessary)

---

## Token Architecture Rules

### 1) Brand Collection (raw primitives only)
- Store raw values only. No semantic meaning.
- Color families grouped by hue.
- Scale range: `100..1200` (lighter to darker).
- Allowed intervals: `100` default, `50` optional, `25` only if needed.
- `white-and-black` family reserved for pure black/white.
- Place immutable source hex values at perceptually correct scale positions.
- Include number scale:
  - `25=1`, `50=2`, `100=4`, `200=8`, `300=12`, `400=16`, `500=20`, `600=24`, `700=28`, `800=32`, `900=40`, `1000=48`, `1100=64`, `1200=80`
- Include typography primitives:
  - Font families: `Wixmadefor Display Variable`, `Wixmadefor Text Variable`, `Newsreader Variable`
  - Weights as strings: `light`, `regular`, `medium`, `semi-bold`, `bold`
  - Styles: `normal`, `italic`

### 2) Alias Collection (semantic only, no raw hex)
- Every alias token must reference brand tokens.
- Roles:
  - primary -> red-coral
  - secondary -> teal
  - tertiary -> blue-lavender
  - information -> bright blue-lavender end
  - success -> generated green
  - warning -> generated amber
  - error -> red-coral
  - neutral-light -> warm light neutrals
  - neutral-dark -> warm dark neutrals
  - foundations -> white-and-black
- Include:
  - border-width: none/small/medium/large
  - border-radius: none/small/medium/large/xl/round
  - font family aliases: display/body/accent
- Single brand only: do not add alias modes.

### 3) Mapped Collection (component-consumable only)
- Mapped tokens must reference alias tokens only.
- Define light and dark modes in the same mapped collection.
- Categories required:
  - surface (page/default/elevated/action/action-hover/action-hover-light/secondary/secondary-hover/disabled/success/warning/information/error/glass/gradient-primary/gradient-accent)
  - text (heading/hero/body/caption/placeholder/action/action-hover/disabled/on-action/on-secondary/on-surface-* and standalone status text)
  - icon (mirror text semantics)
  - border (default/action/action-hover/focus/disabled/subtle/status borders)
- Include default, hover, focus, disabled states; pressed not required.
- If token is identical across modes, use `-fixed` suffix.
- Do not auto-fix accessibility failures; report them.

### 4) Responsive Collection
- Two modes: `desktop` and `mobile`
- Type scale:
  - Desktop sizes: hero 72; h1 60; h2 48; h3 40; h4 32; h5 24; h6 20; body-large 20; body-medium 16; body-small 14; body-x-small 12; caption 12
  - Line height approx size*1.2 rounded to 4px
  - Mobile adjusts hero/headings only: hero 56, h1 48, h2 40, h3 32, h4 28, h5 24, h6 20
  - Body and caption sizes unchanged between desktop/mobile
- Variants per size: regular, semi-bold, bold, italic, link
- Font assignment:
  - display/headings -> display family
  - body/caption -> text family
  - editorial optional -> accent family
- Spacing aliases:
  - none, 2xs, xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl

---

## Output Contract (strict)

Return only:
1. A single JSON object with root keys: `brand`, `alias`, `mapped`, `responsive`, `meta`
2. A markdown usage guide as a separate artifact

JSON schema expectations:
- Each token entry includes:
  - `$value`
  - `$type`
  - `$description` (brief)
- Each generated color includes `"generated": true` in metadata.
- Include `meta.audit` with:
  - input_anchors_confirmed
  - generated_color_count
  - reference_chain_validation
  - wcag_failures (array; empty if none)

Reference syntax:
- Alias references brand with `{brand.path.to.token}`
- Mapped references alias with `{alias.path.to.token}`
- Responsive may reference brand number/typography primitives where appropriate

---

## Execution Checklist (must follow in order)

1. Verify inputs and restate immutable source hex values.
2. Build complete brand primitives and scales.
3. Build alias semantics via references only.
4. Build mapped tokens with light/dark modes.
5. Build responsive typography/spacing with desktop/mobile modes.
6. Validate chain integrity (`mapped -> alias -> brand`).
7. Run WCAG AA checks for text/icon against intended surfaces; report failures.
8. Output final JSON and usage guide.

---

## Non-Negotiable Constraints

1. Never alter immutable source hex values.
2. Always mark generated colors.
3. Never skip tiers.
4. Never introduce alias modes in this single-brand system.
5. Never output pressed state tokens.
6. Always define border strokes for component-ready workflows.
7. Keep paragraph/body sizes identical across desktop/mobile.
8. If blue-lavender split is required, ask first before finalizing.

