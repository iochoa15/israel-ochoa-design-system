# Design Tokens Usage Guide

---

## Tokens Studio Setup (Required Before Importing)

1. Open Tokens Studio in Figma.
2. Go to **Settings** → set **Token Format** to **W3C DTCG**.
3. Load the file via **Sync → Load from file**, selecting `design-tokens.json`.
4. You should see exactly **one token set** named `design-system` in the left panel.
5. Enable the set. All references resolve within the single set.

If you see multiple sets (e.g., brand, alias, mapped), the file is missing the single-set wrapper. This will cause broken link icons on all alias, surface, text, and responsive tokens. Regenerate the file or wrap the entire JSON under `{ "design-system": { ... } }`.

---

## Collection Structure

All tokens live inside the `design-system` set, organized into five top-level groups:

| Group | Contents |
|---|---|
| `color` | All colors — primitive palette, semantic roles, component-layer surfaces/text/icon/stroke |
| `typography` | Font primitives, semantic aliases, Figma Number variables, composite text styles |
| `spacing` | Dimension tokens mapped to the 4pt number scale |
| `border` | Border width and radius measurement tokens |
| `number` | Raw 4pt scale primitives (1px–80px) |

### color sub-groups

| Sub-group | Purpose |
|---|---|
| `color.primitive` | Raw palette — hue families (red-coral, teal, blue-lavender, etc.) with 100–1200 scales |
| `color.semantic` | Semantic roles — primary, secondary, tertiary, success, warning, error, neutral, foundations |
| `color.surface` | Component surfaces — light and dark mode, plus fixed gradient and glass tokens |
| `color.text` | Text colors — light and dark mode |
| `color.icon` | Icon colors — mirrors text semantics |
| `color.stroke` | Border/stroke colors — light and dark mode |

---

## Surface Tokens

All surface tokens live under `color.surface.light.*` (light mode) and `color.surface.dark.*` (dark mode). Mode-invariant tokens use the `-fixed` suffix and live directly under `color.surface.*`.

| Token | When to use |
|---|---|
| `color.surface.light.page` | App canvas and long-form page backgrounds |
| `color.surface.light.default` | Cards and main content containers |
| `color.surface.light.elevated` | Overlays, popovers, modals |
| `color.surface.light.action` | Primary CTA buttons and high-emphasis surfaces |
| `color.surface.light.action-hover` | Hover state of primary action surfaces |
| `color.surface.light.action-hover-light` | Soft tinted hover chips and interactive backgrounds |
| `color.surface.light.secondary` | Secondary action surfaces |
| `color.surface.light.disabled` | Disabled states |
| `color.surface.light.success/warning/information/error` | Status message backgrounds |
| `color.surface.glass-fixed` | Frosted glass overlay — use when UI floats over imagery or illustration |
| `color.surface.gradient-primary-fixed` | Hero strips, key conversion moments |
| `color.surface.gradient-accent-fixed` | Secondary highlights and decorative backplates |

---

## Text Tokens

All text tokens live under `color.text.light.*` and `color.text.dark.*`.

| Token | When to use |
|---|---|
| `color.text.light.hero` | Large marketing statements and landing-page intros |
| `color.text.light.heading` | Section titles and component headings |
| `color.text.light.body` | Standard paragraph copy and descriptions |
| `color.text.light.caption` | Metadata, timestamps, helper text |
| `color.text.light.placeholder` | Input placeholders and low-emphasis copy |
| `color.text.light.action` | Links and text-based interactive actions |
| `color.text.light.action-hover` | Hover state of text actions |
| `color.text.light.on-action` | Text placed directly on a primary action surface |
| `color.text.light.on-secondary` | Text placed on secondary action surfaces |
| `color.text.light.on-action-aa` | AA-safe alternate for text on vivid action surfaces |
| `color.text.light.success/warning/information/error` | Inline status text |
| `color.text.light.on-surface-success/warning/information/error` | Text inside status message surfaces |

---

## Typography: Text Styles vs Number Variables

The `typography` collection provides two parallel ways to consume type:

### Text Styles (composite tokens)

Located at `typography.styles.<breakpoint>.<scale>.<variant>`.

These are `$type: "typography"` composite tokens. In Tokens Studio, they create **Figma text styles** when applied to a text layer.

To apply: select a text layer in Figma → click the token in the Tokens Studio panel.

Six breakpoints are available:

| Breakpoint | Units | Use for |
|---|---|---|
| `desktop` | px | Figma design at 1x |
| `desktop-rem` | rem | CSS/web output at desktop |
| `tablet` | px | Figma at tablet breakpoint |
| `tablet-rem` | rem | CSS/web output at tablet |
| `mobile` | px | Figma at mobile breakpoint |
| `mobile-rem` | rem | CSS/web output at mobile |

Variants per scale: `regular`, `semi-bold`, `bold`, `italic` (Newsreader), `link` (medium weight, underline).

### Number Variables (font-size and line-height)

Located at `typography.vars.font-size.<breakpoint>.<scale>` and `typography.vars.line-height.<breakpoint>.<scale>`.

These are `$type: "number"` tokens (unitless integers). Tokens Studio maps them as **Figma Number variables**, which can be bound to text layer properties directly in the Figma Variables panel — useful for component tokens, auto-layout gap math, and responsive overrides.

Use text styles for design work. Use Number variables when building components that need programmatic size binding.

### Type Scale

| Scale | Desktop | Tablet | Mobile |
|---|---|---|---|
| hero | 72/84 | 64/84 | 56/84 |
| h1 | 60/72 | 54/72 | 48/72 |
| h2 | 48/56 | 44/56 | 40/56 |
| h3 | 40/48 | 36/48 | 32/48 |
| h4 | 32/40 | 30/40 | 28/40 |
| h5 | 24/28 | 24/28 | 24/28 |
| h6 | 20/24 | 20/24 | 20/24 |
| body-large | 20/28 | 20/28 | 20/28 |
| body-medium | 16/24 | 16/24 | 16/24 |
| body-small | 14/20 | 14/20 | 14/20 |
| body-x-small | 12/16 | 12/16 | 12/16 |
| caption | 12/16 | 12/16 | 12/16 |

Body and caption sizes are identical across all breakpoints.

### Typography Pairings

- `Wixmadefor Display Variable` (`typography.alias.display`): hero and headings — confident, structured hierarchy.
- `Wixmadefor Text Variable` (`typography.alias.body`): body, UI labels, metadata — readability and consistency.
- `Newsreader Variable` (`typography.alias.accent`): editorial accents — pull quotes, featured statements, italic variants.

Use Display + Text as the baseline pair. Introduce Newsreader sparingly for contrast and storytelling moments.

---

## Glass Token

`color.surface.glass-fixed` is a `$type: "composition"` token with four properties: background color, opacity, border color, and blur. It is mode-invariant (same in light and dark).

CSS implementation:

```css
.glass-surface {
  background: rgba(253, 253, 253, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
```

Use glass only when content overlays imagery or illustration layers. Pair with a subtle border for legibility. Avoid placing dense body copy on glass surfaces.

---

## Gradient Tokens

`color.surface.gradient-primary-fixed` and `color.surface.gradient-accent-fixed` are `$type: "gradient"` tokens. Both are mode-invariant (the `-fixed` suffix signals they do not change between light and dark).

CSS implementation:

```css
/* gradient-primary */
.hero-gradient {
  background: linear-gradient(135deg, #E54633 0%, #8CC8DB 100%);
}

/* gradient-accent */
.accent-gradient {
  background: linear-gradient(135deg, #5D8DF7 0%, #8CC8DB 100%);
}
```

Recommended uses:
- Hero section strips
- Key call-to-action backplates
- Promo cards and feature highlights

Avoid placing long body text over gradients unless a solid scrim or neutral overlay is added.

---

## Plasticine Illustration Integration

- Pair plasticine elements with `color.surface.light.default` or `color.surface.light.elevated` to keep the tactile art readable.
- Use `color.surface.glass-fixed` when UI controls float above illustration layers.
- Keep body copy on neutral or lightly tinted surfaces — avoid placing dense text on saturated gradients.
- Prefer `color.text.light.heading` and `color.text.light.body` over status colors for informational content.

---

## Border Radius Philosophy

| Token | Use for |
|---|---|
| `border.radius.small` | Compact controls — inputs, badges, pills |
| `border.radius.medium` | Standard cards and form elements |
| `border.radius.large` | Hero cards and major content modules |
| `border.radius.xl` | Overlays, sheets, and featured containers |
| `border.radius.round` | Avatars, circular icons, fully-rounded chips |

The scale supports a warm, approachable personality while preserving modern digital structure.

---

## Light vs Dark Mode Behavior

| What changes | What stays fixed |
|---|---|
| `color.surface.light/dark.*` | `color.surface.*-fixed` (glass, gradients) |
| `color.text.light/dark.*` | `color.primitive.*` (raw palette) |
| `color.stroke.light/dark.*` | `color.semantic.*` (semantic roles) |
| `color.icon.light/dark.*` | `border.width`, `border.radius`, `spacing`, `number` |

On-color tokens (`color.text.light.on-action`, status on-surface tokens) are tuned per mode for contrast compliance.

---

## Responsive Behavior

- Hero and heading font sizes scale down from desktop → tablet → mobile.
- Body and caption sizes are identical across all breakpoints.
- Spacing tokens are semantically stable — they map to the same underlying number scale at all breakpoints.
- Use `*-rem` breakpoint variants (`typography.styles.desktop-rem`, etc.) when generating CSS custom properties or Tailwind config.

---

## Primary / Secondary / Tertiary Usage

- **Primary** (`red-coral`): CTAs, high-priority actions, link emphasis. One dominant primary action per screen.
- **Secondary** (`teal`): Complementary actions, tags, quieter interactions.
- **Tertiary** (`blue-lavender`): Informational accents, highlights, decorative system moments.

Introduce secondary and tertiary only when hierarchy benefits from additional separation. Avoid using all three at equal weight on the same surface.

---

## Known Issues / Gotchas

| Issue | Cause | Fix |
|---|---|---|
| Broken link icons on alias/surface/text tokens | Tokens Studio was not in W3C DTCG mode before importing, or multiple sets exist | Set Token Format to W3C DTCG in Settings, then re-import the file |
| Multiple sets visible (brand, alias, mapped…) | File is missing the `design-system` single-set wrapper | Wrap entire JSON under `{ "design-system": { ... } }` |
| Spacing tokens show raw strings instead of values | Reference was written as `{number.200}px` (invalid) | Value must be just `{number.200}` with `$type: "dimension"` |
| Typography styles not appearing as Figma text styles | Composite tokens must be applied to a text layer — they don't auto-create styles | Select a text layer, then click the token in Tokens Studio |
| Generated color flag causing parse warnings | `"generated": true` was placed at the token root level | Move it inside `"$extensions": { "generated": true }` |
| "Error setting font family/weight combination for .../500" | Font weight tokens use numeric CSS values (300, 500, 700) instead of weight name strings | Change values to match the exact weight name Figma uses: `"Light"`, `"Regular"`, `"Medium"`, `"SemiBold"`, `"Bold"` |
