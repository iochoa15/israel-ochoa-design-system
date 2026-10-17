# Decisions · Israel Ochoa design system

The log of real choices. The agent appends an entry whenever Israel (or the agent, with his OK) picks one option over another. This is the raw material for the case study's "Key decisions," so record the alternatives and the trade-off honestly.

Newest at the bottom. Entries before Oct 17 2026 were backfilled from session notes.

---

### 2026-10-15 · Homepage 7 (flipbook clay) is the base, not homepage 5 (live 3D)
- **Options:** homepage-5 with live 3D clay · homepage-7 with flipbook clay (photos of the 3D models)
- **Chose:** homepage-7, copied into /homepage-8 as the working version
- **Why:** measured on the live site: largest image shows in 1.4s vs 7.2s; on a phone, the page is blocked 0.14s vs 3.0s
- **Gave up:** real-time 3D lighting on the clay
- **Who decided:** Israel, from the agent's measurements
- **Revisit if:** live 3D can load without blocking the page

### 2026-10-15 · Scroll-steps intro, not the slot machine
- **Options:** scroll steps · slot machine
- **Chose:** scroll steps (also on the phone)
- **Why:** Israel's user testing: more space between objects
- **Gave up:** the slot machine's playful spin
- **Who decided:** Israel
- **Revisit if:** new testing says otherwise

### 2026-10-15 · Logo gallery 3 (Dock scroll entrance) is the keeper
- **Options:** logo-gallery · logo-gallery-2 (color flood hover) · logo-gallery-3 (Dock scroll entrance)
- **Chose:** logo-gallery-3
- **Why:** Israel: "The logo gallery 3 is great. We'll keep that one."
- **Gave up:** nothing removed, the others are archived
- **Who decided:** Israel

### 2026-10-17 · Old pages go into an /archive/ folder instead of being deleted
- **Options:** delete old pages · leave them · move them under /archive/
- **Chose:** /archive/ (everything except homepage-7, homepage-8, about, logo-gallery-3, and the root page)
- **Why:** Israel wants less clutter but keeps every version
- **Gave up:** their old web addresses (they now live at /archive/…; links inside Framer follow automatically)
- **Who decided:** Israel

### 2026-10-17 · Avatar in the nav on every page, linking to /homepage-8
- **Options:** keep the IOD logo in the nav · show the avatar everywhere
- **Chose:** the avatar everywhere; on the homepage it appears only when the flying avatar lands
- **Why:** Israel's direction: one consistent "me" mark that always leads home
- **Gave up:** the IOD wordmark in the nav
- **Who decided:** Israel

### 2026-10-17 · Avatar flight glued to the page, hero entrance plays once
- **Options:** smooth the whole scroll (old) · smooth only the flight's progress and keep the start point glued to the page (new)
- **Chose:** the new way, plus a longer flight (80% of a screen of scrolling, was 60%) and no replaying of the hero entrance on /homepage-8
- **Why:** Israel: jagged when scrolling back and forth. Test: the old avatar slid up to ~120px away from the name tag; the new one stays locked
- **Gave up:** the hero entrance no longer replays when you scroll back up (homepages 5–7 still replay)
- **Who decided:** suggested by agent, from Israel's feedback
- **Revisit if:** Israel still sees jagged motion in the hero after publishing
