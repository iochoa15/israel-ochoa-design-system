# Where we left off (Oct 9 2026, evening)

Read this first when restarting. It picks up from `where-we-left-off-oct-9-2026.md` (morning: 3D clean-up, connector).

## 1. Homepages: three versions to compare (none published by Claude; Israel publishes)

| Page | Intro | Hero clay |
|---|---|---|
| `/homepage-5` (main) | Scroll steps: black IOD logo → Stack 0 (clay I, O, D) → Stacks 1–5, numbered dots | 12 live 3D objects, random each visit |
| `/homepage-6` | "Slot machine": plays by itself once, each stack slides in (I and D from the top, O from the bottom), back to the logo | same as homepage-5 |
| `/homepage-7` | same as homepage-5 | 12 **flipbook** objects: photos from 72 angles, plain images, no 3D engine (light, phone-friendly) |

Hero (all): avatar pops first (just before it's on screen), then name, role, clay, headline, subtitle on one shared timeline (~1.3s). Clay objects wander around the edges, turn toward the cursor, spin when dragged (no magnet push).

## 2. What was built today on the site

- **Page fade-in** (first load and every page change): small script in Framer site settings → custom code (head end). Copy in `framer/site-custom-code/`. Framer's own page transition did nothing, so it's off.
- **"Dock" entrance** (`Dock.tsx`, inspired by realfood.gov): frames arrive at 110% of the screen width and settle into place. On: homepage Selected work room (`withDock`), its 4 case cards (`withDockCard`), and the shared contact rooms.
- **Shared "Closing · contact room" component** on homepage, About and Logo gallery (desktop, tablet, phone variants). Edit once, every page updates. Old copies hidden, not deleted.
- **Hero headline**: types "build", deletes the d, pauses, retypes, then "-ish" (same font, red slash cursor).
- **About · Capabilities deck**: each card comes up from below the screen at 10% size, half visible, and grows into place.
- **Intro objects** are the stills (trimmed WebP), sized to the logo so the IOD still reads.

## 3. 3D files

- `3d/models-v2/07_tripo_clean/blend/` (local only): 22 editables for hand work. Israel's "-revised" tests went to the Trash.
- `3d/models-v2/08_web/`: light web copies, 54 MB → 16 MB, no visible loss (`scripts/clean/web_export.py`). Uploaded to Framer; URLs in `08_web/framer_asset_urls.json`.
- `3d/models-v2/09_sprites/`: flipbook sheets for homepage-7 (`scripts/web_preview/sprite.html` + `make_sheets.mjs`). URLs in `09_sprites/framer_asset_urls.json`.
- After a hand edit in Blender: re-run `web_export.py` for that model, re-make its sheet, re-upload, swap the URL in `FloatingClay.tsx` (POOL_3D).

## 4. Next steps

1. Israel publishes, then Claude runs the headless checks on the live site:
   - first-load + page-change fade (already verified on a copy of the live HTML),
   - avatar first, Dock widths, Capabilities cards,
   - 3D still loads on homepage-5/6 after the lazy-load change (if not: revert to a static `import Clay3D`),
   - load time + smoothness of homepage-5 vs 6 vs 7, desktop and phone.
2. Israel picks: scroll intro or slot intro; live 3D or flipbook.
3. Roll Dock out to the case studies and other pages (Israel asked, after the homepage was approved).

## 5. Still waiting on Israel (website content)

Capabilities videos, avatar photo, Kind words quotes/photos/links, 30 logos, LinkedIn/résumé/email links, hover ideas.

## 6. Rules to keep

- Never trash old versions; hide or keep copies. New ideas = new page (`/homepage-N`).
- Don't publish the site; Israel publishes.
- Check the page before setting anything (a node lookup once returned another page's node).
- Big local files stay off GitHub: `.blend`, Tripo sources, `work/`, `hero_renders/`.
- The repo is public: no client-identifying material, no `_docs/ai-design-references`.
