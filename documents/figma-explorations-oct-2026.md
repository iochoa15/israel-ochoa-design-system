# Figma explorations · October 2026 (where we left off)

Last updated: 2026-10-05 (late). Read this first when you pick the work back up.

**Figma file:** IO-Website-2026 (`71RYIBnkaFohQHGeU3MXdN`), in Israel's personal account (iochoa15@gmail.com).
**Page:** "Home & About · Design Set" (`496:154`).
The Figma MCP must be signed in with the personal Gmail account. The work account only has view access.

---

## Latest: Curated v5 · Human and v6 · Elegant (Oct 5)

Built from Israel's edited V4. He had:
- put his original Main Nav pill back
- removed the career section, the tab index and some labels
- edited the Lab copy

**His feedback:**
- No DM Mono anywhere.
- Keep the original Main Nav shape and use only the glass surface.
- Wix Madefor stays the main font.
- Bring back the blue-lavender tones.
- Goal: a balance of tech, personality, fun, human, elegance, AI product and wow (mostly new animations).

| Section | Node | What it is |
|---|---|---|
| **v5 · Human** | `572:532` | About 50% less tech. New `v5-human` styles (Wix labels, warm canvas #F4F2EE, night blue #1C2B52 instead of black, lavender sections, softer corners, light closing section) |
| v5 nav | `572:533` | COMPONENT "Main Nav · Glass": the original Main Nav pill with the Flim glass surface |
| v5 pages | `572:558` Home · `572:781` About · `573:550` DS doc | |
| **v6 · Elegant** | `575:550` | v5 + claudetype.com elegance (listed below) |
| v6 pages | `575:552` Home · `576:574` About · `577:596` elegance-layer doc | |

**v6 · Elegant adds:**
- Hero: the clay objects sit in an arch triptych.
- A soft lavender and rose gradient pause.
- 40px rounded sheets.
- A segmented pill: Read the case study · Play · Live prototype.
- The Lab becomes a gallery of shapes holding the live UIs.
- A giant Newsreader "Israel Ochoa" wordmark footer.
- About: arch-shaped Kind words and Beyond work cards.

**Open:**
- Which of v5 or v6 goes to Framer (as a new page)?
- Approve the `v5-human` styles for the tokens file.
- Copy and projects will still change.

---

## Previous: Curated v4 · Middle ground

Section `554:486` · [open in Figma](https://www.figma.com/design/71RYIBnkaFohQHGeU3MXdN/IO-Website-2026?node-id=554-486)

**Israel's brief (Oct 4):**
1. Work off **Curated v2 · Modern** (`523:268`). Keep its exact copy and its clay objects with their animations.
2. Make a design system **halfway** between Curated v2 (too loud) and **Set 02 · Subtle** from Curated v3 (too quiet).
3. Bring in only the *concept, style or function* (not the placeholder content) of the components he collected in his section **"Componets that I like the concept, style, idea or fuctionality"** (`549:2264`):
   - **Flim-style nav bar.** He said: "I like the effect that the bar has."
   - **Set 01 Lab live bento** (V7-style live mini interfaces instead of videos)
   - **Set 01 Lab hover-to-open row** (Klarna-style: hovered card grows to 2.5×, the others shrink)
   - **Set 06 About letter** with inline chips and a hover photo card
   - **Set 06 dark room** with case studies stacking like a deck (Littlebird room + Fourmula stack)

**What was built:**

| Node | What it is |
|---|---|
| `554:508` | Design System v4 · middle ground doc (comparison, type scale, colors, rules) |
| `554:487` | COMPONENT "Nav · Middle (Flim surface, v2 content)" |
| `555:461` → `555:494` | Home v4 (copy of v2, restyled) |
| `557:754` | Home · Selected work = room + dark deck (v2 case studies) |
| `557:953` | Home · Lab = live bento (v2's 5 Lab projects) |
| `555:752` → `555:757` | About v4 (copy of v2, restyled) |
| `559:501` | About · letter with chips + hover photo (v2's exact 6 lines) |
| `559:541` | About · Kind words = hover-to-open cards (v2 testimonials) |
| `557:501` | Sheet showing all 4 dark deck cards flat, for review |

**New Figma styles (not applied to the tokens JSON or Framer yet):**
- `typography/v4-middle/*`: Wix Madefor Display Bold 144 / 104, SemiBold 76 / 52 / 34 / 24 · Wix Madefor Text 22 / 17 / 14 · DM Mono label 12 caps · Newsreader Light Italic accent 76.
- `color/v4-middle/*`: v2 palette (canvas #F3F3F1, surface #FFFFFF, ink #111110, ink-muted #5E5D59, hairline #E1E0DC, dark #0B0B0A, dark-raised #1C1C1B, signal #E54633, electric #3D6BFF, electric-soft #E8EEFF, live #22C55E) plus soft tints: tint-sage #EAF2EC, tint-cream #F6EEE6, tint-stone #EFEDEA.

**Rules for this system:**
- Headlines are big and sans-led, one Newsreader italic accent each.
- Black is only for the work.
- Electric blue only marks AI and live moments. Red is only for actions.
- Motion:
  - Elements rise 24px and fade in over 0.9s (ease 0.22, 1, 0.36, 1).
  - Hover-open takes 0.5s.
  - Blur only on the nav bar (the homepage-4 performance lesson).

**Calls made (Israel may want to change them):**
- **Copy:** fixed "Open toAI … oportunities" to "Open to AI … opportunities", and the nav's "Lets talk" to "Let's talk". Everything else is word for word from v2.
- **Lab:** v2's carousel controls (Play, "Drag or swipe", Prev, Next) were dropped because the bento doesn't need them.
- **Nav position:** the nav is a top bar (Flim style) instead of v2's sticky-bottom pill. It still appears only after the hero.
- **Hover-to-open:** used for Kind words on About, not the Lab, because the Lab uses the live bento.
- ⚠️ **Client name:** the case-study tab "02 CTN Sparks" is kept exactly as in v2. It's a client name, so it must become the personal spinoff name before anything goes public.

---

## Earlier explorations on the same page (all kept)

| Section | Node | Notes |
|---|---|---|
| Websites I like · dissection report | `498:223` | 9 portfolio sites, pros and cons |
| Six variations · Home + About | `500:223` | V1–V6 (Oct 1) |
| Explorations v1 + v2 merged | `496:155` | copies of the Page 2 work |
| Israel's "Curated selection" | `514:1720` | what he kept from the six variations |
| Curated v2 · Modern (sans-led, +20% tech) | `523:268` | DS v2 proposal `523:269`, Home `524:246`, About `526:269` |
| Curated v3 · Subtle · 6 sets | `533:292` | reference board `533:307` (5 interactions + screenshots), Flim nav `533:293`, sets S1–S6 |
| Israel's liked components | `549:2264` | the source for v4 |

Screenshots of the 5 interactions he picked (Littlebird, Flim, Fourmula, Klarna, V7) are saved in `documents/references/interactions-oct-2026/`.

---

## Open questions for Israel

1. Is v4 the direction? Should the Lab use hover-to-open instead of (or as well as) the live bento?
2. Confirm the font direction: sans as the main font, with the serif as an accent.
3. Approve the v4-middle system, so it can be written into `design-tokens-fixed.json`, Figma variables and Framer styles as a new version.
4. Should the nav sit at the top (Flim) or at the bottom (v2)?

## Next steps

- Once v4 is approved, build it in Framer as a **new page** (for example `/homepage-5`). Never overwrite older pages.
- Still pending from September:
  - publish `/homepage-4` for comparison
  - fix the live-site copy ("Lets talk", "Product Name here")
  - fix testimonial cards overflowing with long quotes

## How to resume

Open Claude Code in this folder. Claude reads `CLAUDE.md` and its project memory automatically. Say "continue the Curated v4 work" and it will pick up from this page.
