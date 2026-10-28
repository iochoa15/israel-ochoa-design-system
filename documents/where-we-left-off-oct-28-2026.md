# Where we left off (Oct 28 2026)

Read this first when restarting work on the Framer site. The site basics (live pages, nav, hero sequence, code map) are still in `where-we-left-off-oct-19-2026.md`.

## 1. The site today

- **Live homepage:** `/` (built as homepage 11). Unchanged since Oct 19.
- **Two new versions under review** (not published, Israel decides):
  - `/homepage-12` (Oct 27): Clash Display.
  - `/homepage-13` (Oct 28): Degular + Figtree. The latest direction.
- Other live pages: `/about`, `/logo-gallery-3`. Everything else is under `/archive/`.

## 2. What each new version changes

Both start from the homepage and keep its animation, clay and layout.

| | Homepage 12 | Homepage 13 |
|---|---|---|
| Page background | #DADDED | #DADDED |
| "Live prototype" labels | Hidden | Hidden |
| Eyebrows | Under the text they belong to, on a light block | Same, and lowercase |
| Main font (headers, titles) | Clash Display Regular | Degular (Adobe Fonts), weight 200, optical size 6 |
| Name and role | Wix Madefor Text | Degular |
| Secondary font (long copy, labels, buttons) | Wix Madefor Text | Figtree |
| Italic accent words | None | None |
| Big headlines (desktop / tablet / phone) | 76 / 60 / 40px | 56 / 44 / 32px |
| Case-card titles | 34px | 28px |
| Case-card text | 17px (was 14px) | 17px |
| Text styles | `Text Styles/V5/*` | `Text Styles/V6/*` |
| Contact block | Copy: "Closing · contact room (V5, Clash Display)" | Copy: "Closing · contact room (V6, Degular)" |

Eyebrows are the small labels: the case-card categories ("ai product · custom training · 2026"), "the problem / what I did / the outcome", and the Lab tags ("away · ios · 2026"). The light block is see-through white (10%) on the dark cards and #F3F3F1 in the Lab cards.

## 3. How Degular works (homepage 13)

Degular isn't in Framer's font library or Google Fonts. It comes from Israel's Adobe Fonts kit `gwt5tgs` (family `degular-variable`). Framer can't host Adobe fonts, so:

- `FontKit.tsx` (a code component) sits invisibly at the top of homepage 13, in the layer "Font kit (Degular + Figtree)". It loads the Adobe kit and Figtree and switches the fonts by CSS:
  - Degular: every h1, h2 and h3, anything inside a frame with the `withDegular` override (the name and role), and code components set to `degular-variable`.
  - Figtree: everything else.
- Its controls: Degular weight (200 now), optical size, secondary font. One change there updates the whole page.
- After publishing, check Degular shows on the live address. If it doesn't, add the site's address to the Adobe Fonts web project.

## 4. Code changes (all opt-in: pages that don't turn them on look the same)

| File | New controls |
|---|---|
| `HeroHeadline.tsx` | Font, Weight, Italic end |
| `LabHoverRow.tsx` | Title font, Title weight, Tag under title, Lowercase tag |
| `FontKit.tsx` (new) | Adobe kit, Degular weight, Optical size, Secondary font; plus the `withDegular` override |

## 5. Lessons worth keeping

- **Framer already has Fontshare fonts** (Clash Display, General Sans, Satoshi…). No upload needed: search the font library first.
- **Shared parts and versions:** a component used on the live homepage (the contact block) gets a copy for the new version, so the kept version never changes. Code components get new controls whose defaults keep the old look.
- **Check every size:** tablet and phone can carry their own settings. Homepage 12's tablet cards had a fixed 600px height and cut off the bigger text; they're 760px now.
- **Styled pieces inside a heading** (like "a real person.") render as separate inner elements, so font rules must reach inside the heading too.
- **Screenshots of `/` show the live homepage,** which stays as it is on purpose. Review new versions at `/homepage-12` and `/homepage-13`.

## 6. Still open

- Israel reviews homepage 12 and 13 on laptop and phone, then picks a direction (and maybe sets one as Home).
- Degular weight: 200 per Israel's snippet; easy to raise in the Font kit layer.
- Not on GitHub yet: commits 3e496d5 (homepage 12) and c768135 (homepage 13), plus this note. Push when Israel says so.
- From before: v1 finish line, coral hex (#FE4300 vs #E54633), israelochoa.design still points to the old site.
