# Design System Token Generation — Project Command

> **Usage:** Save this as a project command in Cursor (Settings > Rules and Commands) or paste directly into Claude. Attach all referenced files when running.

---

## Role

You are a senior design systems architect. Your job is to generate a complete, production-ready design token system following a strict three-tier token architecture (Brand → Alias → Mapped + Responsive). You will output a single JSON file compatible with Tokens Studio for Figma import.

---

## Context

This design system is for a personal portfolio website showcasing work in AI product design, brand design, and art direction. The owner is a Brooklyn-based Creative Manager and Design Lead with 15+ years of experience.

**Brand personality:** Clean, elegant, technological, modern, honest, and warm.

**Visual concept:** The site features 3D plasticine-textured illustration elements — a metaphor for building things by hand as a child, and now building with AI. The system must complement these organic, tactile graphics with a polished digital framework.

**Target platforms:** Figma (design), Framer (site build), Cursor/Claude Code (development). Components will be exported to all three environments.

**References for scope and structure:** Google Material Design 3 and IBM Carbon Design System. See also the attached "Design-System-Inspired-by-..." screenshots for visual direction.

---

## Attached Inputs (required)

When running this command, attach the following files:

1. **Color palette screenshot** — the exact hex values listed below. Visual reference for how they were originally grouped.
2. **Gradient samples** — reference for gradient token definitions.
3. **Glass material surface** — reference for glass/frosted surface effect tokens.
4. **Plasticine elements image** — reference for understanding the illustration style the system must complement.
5. **"Design-System-Inspired-by-..." screenshots** — visual references for the desired output structure and presentation.

---

## Color Palette — Exact Hex Values

These are the brand's source colors. Do NOT alter any hex value. You may reorganize them into hue-grouped scales, but every color below must appear in the Brand Collection.

### Brand Core

| Color | Hex | Description |
|-------|-----|-------------|
| Red-coral | `#E54633` | Primary brand color — warm, energetic red |
| Teal | `#8CC8DB` | Cool counterpoint — approachable, technological |
| Cream | `#FCFCD4` | Warm neutral — light, inviting foundation |

### Surfaces

| Color | Hex | Description |
|-------|-----|-------------|
| White | `#FDFDFD` | Near-white page background |
| Warm cream | `#F6F5E9` | Warm surface — cards, containers |
| Light gray | `#EEEDEB` | Subtle warm gray — secondary surfaces, dividers |

### Text

| Color | Hex | Description |
|-------|-----|-------------|
| Near-black | `#242424` | Primary heading text |
| Dark gray | `#333333` | Body text |
| Red-coral (text) | `#E54633` | Action/link text (reuses brand red) |

### Blue-Lavender Family

| Color | Hex | Description |
|-------|-----|-------------|
| Periwinkle blue | `#5D8DF7` | Bright blue accent |
| Muted lavender | `#A6ACC6` | Mid-tone lavender gray |
| Light lavender | `#CDD2EB` | Soft lavender tint |

### Colors to Generate (missing from palette)

The palette above does not include dedicated scales for several semantic roles. Generate these scales by deriving a harmonious set of hex values that feel native to the existing warm, elegant palette. Mark all generated colors clearly in the output so I can review and approve them.

| Semantic Need | Guidance |
|---------------|----------|
| **Success green** | Warm, slightly muted green that complements the cream/coral palette. Avoid neon or cold mint. Think sage or warm olive-green. |
| **Warning amber** | Warm amber/gold — sits naturally between the red-coral and cream. Not harsh orange. |
| **Dark neutrals (scale)** | Expand `#242424` and `#333333` into a full warm-gray neutral scale (100–1200) for dark mode surfaces, disabled states, and mid-range UI. Should lean warm, not blue-gray. |
| **Light neutrals (scale)** | Expand `#FDFDFD`, `#F6F5E9`, `#EEEDEB` into a fuller warm-white/cream neutral scale for surfaces, subtle borders, and hover tints. |
| **Teal scale** | Expand `#8CC8DB` into a full scale (lighter tints for surfaces, darker shades for text-on-teal). |
| **Red-coral scale** | Expand `#E54633` into a full scale (lighter tints for error surfaces, darker shades for hover/pressed). |
| **Blue-lavender scale** | Expand `#5D8DF7`, `#A6ACC6`, `#CDD2EB` into a cohesive blue-lavender scale. These three may land at different positions on the same scale or form the basis for two separate scales (blue + lavender) — use your judgment but explain the decision. |

---

## Token Architecture — Three-Tier System

Follow this strict hierarchy. Never skip tiers.

```
Brand (raw values) → Alias (semantic roles) → Mapped (component consumption)
                                                 ↑ only layer components touch
```

### Tier 1 — Brand Collection

**Purpose:** Store every raw value in its purest form. Nothing in this collection implies intent, role, UI usage, or component usage.

**Color rules:**
- All colors stored as pure hex values
- Colors grouped by hue family (e.g., `red/`, `teal/`, `cream/`, `neutral-warm/`, `blue/`, `lavender/`, `green/`, `amber/`)
- Scales use a 100–1200 range. Lower number = lighter, higher number = darker
- Allowed increments: 100 by default, 50 when intermediate values are needed, 25 if further refinement is required
- White and black live in their own group called `white-and-black`
- Place my exact hex values at the correct position in each scale based on their lightness, then fill in the remaining stops

**Number scale:** One master scale based on multiples of 4:

| Token | Value |
|-------|-------|
| scale/25 | 1 |
| scale/50 | 2 |
| scale/100 | 4 |
| scale/200 | 8 |
| scale/300 | 12 |
| scale/400 | 16 |
| scale/500 | 20 |
| scale/600 | 24 |
| scale/700 | 28 |
| scale/800 | 32 |
| scale/900 | 40 |
| scale/1000 | 48 |
| scale/1100 | 64 |
| scale/1200 | 80 |

**Typography primitives (string variables):**
- Font families: `Wixmadefor Display Variable` (headings/display), `Wixmadefor Text Variable` (body/UI), `Newsreader Variable` (editorial/accent)
- Font weights: `light`, `regular`, `medium`, `semi-bold`, `bold` (as string variables matching exact weight names)
- Font styles: `normal`, `italic` (as string variables)

---

### Tier 2 — Alias Collection

**Purpose:** Translate raw brand colors into semantic meaning. Alias is the only layer allowed to assign intent and group meaning. Alias tokens MUST always reference brand tokens — never raw hex values.

**Color role mapping:**

| Semantic Role | Brand Hue Source | Notes |
|---------------|-----------------|-------|
| Primary | Red-coral (`#E54633` scale) | Main brand action color — buttons, links, CTAs |
| Secondary | Teal (`#8CC8DB` scale) | Supporting interactive color — tags, highlights, secondary actions |
| Tertiary | Blue-lavender (`#5D8DF7` / `#A6ACC6` / `#CDD2EB` scale) | Accent — badges, decorative elements, subtle highlights |
| Information | Blue-lavender (brighter end) | Info banners, tooltips |
| Success | Generated green scale | Confirmation, positive feedback |
| Error | Red-coral scale (reuse primary) | Error states share the red family — differentiate through mapped tokens |
| Warning | Generated amber scale | Caution, non-blocking alerts |
| Neutral light | Warm-white/cream scale (`#FDFDFD`, `#F6F5E9`, `#EEEDEB` expanded) | Surfaces, borders, subtle UI in light mode |
| Neutral dark | Warm-gray scale (`#242424`, `#333333` expanded) | Text, surfaces in dark mode |
| Foundations | `white-and-black` | Pure white, pure black |

**Rules:**
- If during scale generation you find the blue-lavender family works better as two separate scales (a blue scale from `#5D8DF7` and a lavender scale from `#A6ACC6`/`#CDD2EB`), explain the decision and ask for confirmation before splitting tertiary into two roles.
- Each aliased role gets a full scale mirroring the brand scale range (e.g., `primary/100` through `primary/1200`, with `primary/500` optionally renamed to `primary/default`).

**Border width tokens** (referencing brand number scale):
- `border-width/none` → 0
- `border-width/small` → scale/25 (1px)
- `border-width/medium` → scale/50 (2px)
- `border-width/large` → scale/100 (4px)

**Border radius tokens** (soft, rounded corners per brand personality):
- `border-radius/none` → 0
- `border-radius/small` → scale/100 (4px)
- `border-radius/medium` → scale/200 (8px)
- `border-radius/large` → scale/400 (16px)
- `border-radius/xl` → scale/600 (24px)
- `border-radius/round` → 9999 (pill/circle)

**Modes:** Alias modes exist only when multiple brands are present. This is a single-brand system — do not create multiple modes. If I later need additional modes, I will request them.

**Typography aliases:** Font families, weights, and styles can be pulled into alias from brand:
- `font-family/display` → Wixmadefor Display Variable
- `font-family/body` → Wixmadefor Text Variable
- `font-family/accent` → Newsreader Variable

---

### Tier 3 — Mapped Collection

**Purpose:** These are the ONLY tokens components may consume. Mapped tokens reference alias tokens — never brand tokens directly.

**Token categories:**

#### Surface
- `surface/page` — page background
- `surface/default` — card/container default (subtle differentiation from page)
- `surface/elevated` — raised surfaces (modals, dropdowns)
- `surface/action` — primary action backgrounds (buttons)
- `surface/action-hover` — hover state for action surfaces
- `surface/action-hover-light` — subtle hover for fields, menus, list items
- `surface/secondary` — secondary action backgrounds (teal)
- `surface/secondary-hover` — hover state for secondary surfaces
- `surface/disabled` — disabled interactive elements
- `surface/success`, `surface/warning`, `surface/information`, `surface/error` — feedback surface tints
- `surface/glass` — frosted glass effect (reference attached glass material; define as a composite token with background opacity, backdrop-filter blur, and border values)
- `surface/gradient-primary` — primary gradient (reference attached gradient samples)
- `surface/gradient-accent` — accent/secondary gradient

#### Text
- `text/heading` — headings (near-black, high contrast)
- `text/hero` — hero/display text (may differ from heading)
- `text/body` — body copy (#333333 range)
- `text/caption` — captions, metadata
- `text/placeholder` — placeholder/ghost text
- `text/action` — interactive text/links (red-coral)
- `text/action-hover` — hover state for interactive text
- `text/disabled` — disabled text
- `text/on-action` — text on primary action surfaces (must contrast with `surface/action`)
- `text/on-secondary` — text on secondary/teal surfaces
- `text/on-surface-success`, `text/on-surface-warning`, `text/on-surface-information`, `text/on-surface-error` — text on feedback surfaces
- `text/success`, `text/warning`, `text/information`, `text/error` — standalone feedback text

#### Icon
- Mirror the text token structure for consistency (icon next to text of the same intent should match):
- `icon/default`, `icon/action`, `icon/action-hover`, `icon/disabled`, `icon/on-action`, `icon/on-secondary`
- `icon/success`, `icon/warning`, `icon/information`, `icon/error`

#### Border
- `border/default` — subtle default borders
- `border/action` — active/selected borders (red-coral)
- `border/action-hover` — hover state
- `border/focus` — focus ring (matches action color)
- `border/disabled` — disabled borders
- `border/subtle` — very light separator borders
- `border/success`, `border/warning`, `border/information`, `border/error` — feedback borders

**Light & Dark modes:**
- Every mapped token defines both a light value and a dark value (two modes in one collection)
- For dark mode: invert neutral scales, swap feedback surface tints from light end (e.g., 100) to dark end (e.g., 800)
- If a token must NOT change across modes, suffix it with `-fixed`
- Text and icons must meet WCAG AA contrast requirements in both modes
- On-color tokens must be tuned for their specific colored surfaces
- Disabled tokens reduce contrast but remain legible
- Focus tokens reuse semantic action colors

---

### Tier 4 — Responsive Collection

**Purpose:** All responsive typography and spacing tokens. Has two modes: `desktop` (1440px) and `mobile` (440px). Optionally add `tablet` if requested.

**Typography scale** (use typescale.com Major Third as starting reference, then round to 4px grid):

Desktop type scale:

| Token | Size | Line Height (size × 1.2, rounded to nearest 4px) |
|-------|------|--------------------------------------------------|
| display/hero | 72 | 84 |
| headings/h1 | 60 | 72 |
| headings/h2 | 48 | 56 |
| headings/h3 | 40 | 48 |
| headings/h4 | 32 | 40 |
| headings/h5 | 24 | 28 |
| headings/h6 | 20 | 24 |
| body/large | 20 | 28 |
| body/medium | 16 | 24 |
| body/small | 14 | 20 |
| body/x-small | 12 | 16 |
| caption/default | 12 | 16 |

Mobile adjustments: Scale down headings (h1=48, h2=40, h3=32, h4=28, h5=24, h6=20, hero=56). Paragraph/body sizes stay identical on mobile and desktop.

**Text style variants per size:** `regular`, `semi-bold`, `bold`, `italic`, `link` (underline). Group as: `headings/h1/regular`, `headings/h1/semi-bold`, `body/medium/regular`, `body/medium/link`, etc.

**Font family assignments:**
- `display/*` and `headings/*` → Wixmadefor Display Variable
- `body/*` and `caption/*` → Wixmadefor Text Variable
- `editorial/*` (optional accent group for pull quotes, callouts) → Newsreader Variable

**Spacing tokens** (alias the number scale for semantic spacing):
- `spacing/none` → 0
- `spacing/2xs` → scale/25 (1px)
- `spacing/xs` → scale/50 (2px)
- `spacing/sm` → scale/100 (4px)
- `spacing/md` → scale/200 (8px)
- `spacing/lg` → scale/400 (16px)
- `spacing/xl` → scale/600 (24px)
- `spacing/2xl` → scale/800 (32px)
- `spacing/3xl` → scale/900 (40px)
- `spacing/4xl` → scale/1000 (48px)
- `spacing/5xl` → scale/1100 (64px)

---

## Execution Steps

Follow this exact order. Do not skip or combine steps.

**Step 1 — Audit inputs.** Review all attached files. Confirm you understand the color palette, gradient references, glass material, and plasticine aesthetic. List back to me the exact hex values you found so I can verify nothing was misread. If any input is missing or ambiguous, STOP and ask before proceeding.

**Step 2 — Generate Brand Collection.** Place each of my hex values at the correct lightness position within its hue scale, then generate the remaining stops to complete each 100–1200 scale. Clearly mark which values are my originals vs. generated fills. Include the number scale, font families, and font weights.

**Step 3 — Generate Alias Collection.** Map brand hues to semantic roles per the table above. Generate border-width and border-radius tokens referencing the number scale. Generate typography aliases.

**Step 4 — Generate Mapped Collection.** Create all surface, text, icon, and border tokens for both light and dark modes. Include all interaction states (default, hover, focus, disabled). Include glass surface and gradient composite tokens. Ensure no mapped token references brand values directly — everything chains through alias.

**Step 5 — Generate Responsive Collection.** Create typography tokens for desktop and mobile modes. Create spacing tokens.

**Step 6 — Validate chain integrity.** Verify that every mapped token traces back through alias to brand. Flag any broken references.

**Step 7 — Accessibility check.** Verify that text and icon tokens meet WCAG AA contrast ratios against their intended surface tokens in both light and dark modes. Flag any failures — do not silently auto-correct.

**Step 8 — Output.** Return a single JSON file compatible with Tokens Studio import. Structure the JSON with clearly separated collections: `brand`, `alias`, `mapped`, `responsive`.

---

## Critical Rules

1. **Do not alter my hex values.** Use them exactly as listed. You may generate additional scale stops around them.
2. **Clearly mark generated colors.** Any hex value not in my original palette must be flagged with a comment so I can review it.
3. **Do not infer meaning.** If the intended semantic role of a color is ambiguous, ask.
4. **Do not auto-correct contrast.** Flag accessibility issues; let me decide the fix.
5. **Do not skip tiers.** Brand → Alias → Mapped. Always.
6. **Do not create unnecessary scales.** If a hue family decision is unclear (e.g., blue vs. lavender split), pause and ask.
7. **Do not create alias modes.** This is a single-brand system.
8. **Pressed state is not needed.** Interaction states are: default, hover, focus, disabled.
9. **Always add strokes to components**, even if the stroke color matches the surface. This prevents needing to retrofit later.
10. **Paragraph sizes never change between desktop and mobile.** Only heading sizes scale down.
11. **Return only the final JSON output** unless you need to ask a clarifying question.

---

## Usage Documentation Request

After generating the JSON, provide a companion usage guide as a separate markdown file that explains:

- **When to use each surface token** (page vs. default vs. elevated vs. glass vs. gradient) with examples
- **When to use each text token** (heading vs. hero vs. body vs. caption) with examples
- **How the glass surface token should be implemented** in CSS (backdrop-filter, opacity, border)
- **How gradient tokens should be applied** (CSS gradient syntax, recommended use cases)
- **How the plasticine illustration elements integrate** with the token system (recommended surface pairings, contrast considerations)
- **Border radius philosophy** — when to use each size, and how the soft/rounded personality is expressed
- **Typography pairings** — when to use Display vs. Text vs. Newsreader, and why
- **Light vs. dark mode behavior** — what changes, what stays fixed, and why
- **Responsive behavior** — what scales and what doesn't
- **Primary (red-coral) vs. secondary (teal) vs. tertiary (blue-lavender)** — when to use each and why

---

## Export Targets

The final token system must be structured for export to:

1. **Figma** — via Tokens Studio plugin (primary import method; Figma's native import does not support cross-collection references)
2. **CSS Custom Properties** — for Framer code overrides and general web development
3. **Tailwind CSS config** — for utility-class-based development in Cursor
4. **JSON** — raw token file for any tooling integration

After Tokens Studio import into Figma:
- Combine any split light/dark collections into a single mapped collection with two modes
- Combine any split desktop/mobile collections into a single responsive collection with two modes
- Hide brand variables from component selection (scope appropriately)
- Scope border-width to stroke only, border-radius to radius only

---

*Prompt v1.1 — April 2026*
