# Stack and brand · Israel Ochoa design system

## Tech stack
| Layer | Choice | Notes |
|---|---|---|
| Site | Framer | Pages, CMS, React code components and overrides (backups in `framer/code-components/`) |
| Motion | framer-motion inside code components | Plus Framer's native appear and scroll effects |
| Tokens | `design-tokens-fixed.json` (W3C format) | Imported into Figma variables with Token Studio |
| Figma docs | Custom plugin, `figma auto frame tool /` | Generates the documentation frames |
| 3D | Blender 5.2.2 (run by script), Tripo models | Flipbook sprite sheets on the web, `3d/models-v2/` |
| Version control | GitHub (public repo) | `web content/` stays private |
| Design tools | Figma · Framer · Claude Design | |

Not used: Lovable, Base44 (Israel's call).

## Brand
- **Brand source:** Israel's portfolio brand
- **Colors by role:**
  - Action / accent: coral `#FE4300` (kit) · token red-coral 700 is `#E54633` [NEEDS: confirm which is current]
  - Secondary accent: teal `#69CDEC`
  - Background: cream `#FDFDE5`
  - Supporting: purple `#A4AEDA`
  - Framer site styles: the `V4/*` color tokens (Canvas, Surface, Ink, Signal, Electric, and others)
- **Type:** Newsreader (display, accent serif) + Wix Madefor Text / Display (body, UI, labels). Golden-ratio scale. No monospace anywhere.
- **Spacing and shape:** no sizing tokens (Israel's call). Main Nav keeps his original pill shape with Flim-style glass.
- **Motion:** smooth and elegant, one signature moment per page. Snap only on Stage 1 and Stage 3. Springs over linear.
- **Figma file:** 71RYIBnkaFohQHGeU3MXdN

## Product voice (for UI copy inside this product)
This is Israel's own site, so its copy is Israel's personal voice (kit `04_my-voice/my-voice.md`): decisive, warm, specific, no em-dashes, "10+ years."
