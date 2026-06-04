# Operator Prompt — Generate Tokens

You are generating a complete design token system JSON and usage guide.

## Return Format

Return exactly two artifacts:
1. `design-tokens.json`
2. `design-tokens-usage-guide.md`

No extra commentary.

## Token Pipeline (required)

Use strict references:

`brand -> alias -> mapped -> responsive`

- `alias` must never use raw hex.
- `mapped` must never reference `brand` directly.
- `mapped` must include light and dark modes.
- `responsive` must include desktop and mobile modes.

## Immutable Source Anchors

Preserve exactly:
- `#E54633`, `#8CC8DB`, `#FCFCD4`
- `#FDFDFD`, `#F6F5E9`, `#EEEDEB`
- `#242424`, `#333333`
- `#5D8DF7`, `#A6ACC6`, `#CDD2EB`

## Required Generated Scales

Generate cohesive scales for:
- success green (warm/muted)
- warning amber (warm)
- dark neutrals (warm gray)
- light neutrals (warm white/cream)
- teal scale
- red-coral scale
- blue-lavender scale

Mark every generated color with metadata `"generated": true`.

## Required Collections

Root keys:
- `brand`
- `alias`
- `mapped`
- `responsive`
- `meta`

Each token requires:
- `$value`
- `$type`
- `$description`

## Brand Requirements

- Hue-grouped color families
- Scale range 100..1200
- Number scale:
  - 25=1, 50=2, 100=4, 200=8, 300=12, 400=16, 500=20, 600=24, 700=28, 800=32, 900=40, 1000=48, 1100=64, 1200=80
- Typography primitives:
  - font families: Wixmadefor Display Variable, Wixmadefor Text Variable, Newsreader Variable
  - font weights: light, regular, medium, semi-bold, bold
  - font styles: normal, italic

## Alias Requirements

Roles:
- primary, secondary, tertiary, information, success, warning, error
- neutral-light, neutral-dark, foundations
- border-width tokens
- border-radius tokens
- font-family aliases

Single-brand only. No alias modes.

## Mapped Requirements

Include categories and states:
- surface: page/default/elevated/action/action-hover/action-hover-light/secondary/secondary-hover/disabled/success/warning/information/error/glass/gradient-primary/gradient-accent
- text: heading/hero/body/caption/placeholder/action/action-hover/disabled/on-action/on-secondary/on-surface-success/on-surface-warning/on-surface-information/on-surface-error/success/warning/information/error
- icon: mirror text intent
- border: default/action/action-hover/focus/disabled/subtle/success/warning/information/error

Rules:
- default, hover, focus, disabled states only (no pressed)
- add `-fixed` suffix if unchanged across light/dark
- include WCAG notes in `meta.audit.wcag_failures` without auto-correcting

## Responsive Requirements

Modes: desktop, mobile

Desktop sizes:
- hero 72/84
- h1 60/72
- h2 48/56
- h3 40/48
- h4 32/40
- h5 24/28
- h6 20/24
- body-large 20/28
- body-medium 16/24
- body-small 14/20
- body-x-small 12/16
- caption 12/16

Mobile heading/hero sizes:
- hero 56
- h1 48
- h2 40
- h3 32
- h4 28
- h5 24
- h6 20

Body/caption sizes unchanged on mobile.

Variants per size:
- regular, semi-bold, bold, italic, link

Spacing:
- none, 2xs, xs, sm, md, lg, xl, 2xl, 3xl, 4xl, 5xl

## Metadata Requirements

Include:
- `meta.audit.input_anchors_confirmed`
- `meta.audit.generated_color_count`
- `meta.audit.reference_chain_validation`
- `meta.audit.wcag_failures` (array)

