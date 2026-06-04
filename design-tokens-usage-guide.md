# Design Tokens Usage Guide

## Surface Tokens
- Use `mapped.surface.[mode].page` for app/page backgrounds.
- Use `mapped.surface.[mode].default` for standard cards, forms, and section wrappers.
- Use `mapped.surface.[mode].elevated` for overlays, modals, and floating panels.
- Use `mapped.surface.[mode].action` and `action-hover` for primary CTA backgrounds.
- Use `mapped.surface.[mode].secondary` and `secondary-hover` for secondary actions.
- Use status surfaces (`success`, `warning`, `information`, `error`) only for contextual messaging areas.

## Text Tokens
- Use `mapped.text.[mode].hero` for hero headlines and landing top statements.
- Use `mapped.text.[mode].heading` for H1-H6 and section titles.
- Use `mapped.text.[mode].body` for standard paragraph text and descriptions.
- Use `mapped.text.[mode].caption` for helper text, metadata, timestamps, and secondary labels.
- Use `mapped.text.[mode].placeholder` only in empty input/select/textarea states.
- Use `on-*` tokens when text sits on colored surfaces (buttons, badges, status containers).

## Glass Implementation (CSS)
Use `mapped.surface.glass-fixed` for frosted cards and floating overlays.

```css
.glass {
  background: color-mix(in srgb, var(--surface-elevated) 62%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-default);
}
```

Use glass sparingly for hero accents, floating nav, or highlighted content cards.

## Gradient Usage (CSS)
- `mapped.surface.gradient-primary-fixed`: default brand emphasis gradient.
- `mapped.surface.gradient-accent-fixed`: softer editorial/accent gradient.

```css
.bg-gradient-primary {
  background: var(--surface-gradient-primary);
}

.bg-gradient-accent {
  background: var(--surface-gradient-accent);
}
```

Recommended scenarios:
- hero banners
- CTA stripes
- visual dividers behind plasticine illustrations

Avoid gradients behind dense paragraph text.

## Plasticine Integration Guidance
- Keep plasticine illustrations on `page`, `default`, or `elevated` surfaces for clarity.
- Prefer solid text tokens (`heading`, `body`, `caption`) over gradient text near illustrations.
- Maintain generous spacing (`responsive.spacing.lg` and above) around tactile objects.
- For busy compositions, use `surface.action-hover-light` or `surface.secondary-hover` as soft pads.

## Border Radius Philosophy
- `none`: tables, strict data layouts, edge-to-edge segments.
- `small`: compact inputs, chips, and subtle controls.
- `medium`: default cards and form controls.
- `large`: featured cards, image wrappers, callouts.
- `xl`: hero containers and prominent marketing modules.
- `round`: avatars, icon circles, pills, floating action indicators.

## Typography Pairings
- **Display (`Wixmadefor Display Variable`)**: hero and heading hierarchy.
- **Body (`Wixmadefor Text Variable`)**: paragraph, form, UI copy.
- **Accent (`Newsreader Variable`)**: editorial highlights, italic hero variants, quotes.

Suggested pairing patterns:
- Hero: Display bold + Body medium subheading
- Portfolio cards: Display semi-bold title + Body regular metadata
- Editorial sections: Accent italic intro + Body regular content

## Light vs Dark Mode Behavior
- Changes by mode: major surfaces, body text, borders, status surface intensity.
- Remains fixed: gradients, glass composite recipe, border widths, border radii, spacing scale.
- `*-fixed` tokens are shared intentionally across both modes.

## Responsive Behavior
- Headings scale between desktop and mobile via `responsive.typography.desktop` and `.mobile`.
- Body and caption sizes remain identical across both modes by design.
- Style variants (`regular`, `semi-bold`, `bold`, `italic`, `link`) are available for each size.
- Spacing tokens are mode-independent and should be reused across breakpoints.

## Primary vs Secondary vs Tertiary
- **Primary**: key conversion actions and core brand emphasis.
- **Secondary**: supportive interactive elements and alternative CTA hierarchy.
- **Tertiary**: informational accents, links, and non-primary highlights.

Use one dominant intent per section:
- max one primary CTA cluster
- secondary for alternatives
- tertiary for contextual enrichments


## Accessibility Fallbacks (AA-Safe)
- Keep default expressive tokens for decorative/large-display contexts when approved by design review.
- Use `mapped.text.[mode].on-action-aa` for normal-size text on action surfaces.
- Use `mapped.text.[mode].on-surface-warning-aa` for normal-size text on warning surfaces.
- Treat these `*-aa` tokens as the default for body-size UI copy in buttons, alerts, and badges.
