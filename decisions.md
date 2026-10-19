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

### 2026-10-17 · Two no-intro hero options: objects toward you (hp9) vs away to the center (hp10)
- **Options:** keep the intro sequence · hero with depth objects coming toward you (microsoft.ai) · hero with objects shrinking toward the center (contralabs.com)
- **Chose:** build both as /homepage-9 and /homepage-10 to compare; /homepage-8 stays as it is
- **Why:** testers said the intro is too much; hiring managers should see who Israel is right away, and the clay keeps his personality
- **Gave up:** the I·O·D intro on these two versions (hidden, not deleted) and the live 3D/flipbook clay in the hero (flat stills are lighter)
- **Who decided:** Israel picked the references and the three copy stages; the agent picked the timing, lanes and the "soften behind the copy" rule
- **Revisit if:** one of them wins his next round of user testing

### 2026-10-17 · Homepage 11: timed copy steps under a fixed name tag
- **Options:** copy tied 1:1 to the scroll (hp9) · scroll picks the step, each change plays on its own timing (hp11)
- **Chose:** timed steps. Order: "I design/" → the header forms → the header goes → the paragraph → the avatar flies to the nav
- **Why:** Israel: on hp9 the copy went by too quickly and looked off mid-change. Timed steps never stop half faded, and the header and paragraph never overlap (each waits for the other to clear)
- **Gave up:** copy that tracks the scroll exactly; /homepage-10's "away to the center" look (archived)
- **Who decided:** Israel set the order and what stays on screen; the agent picked the timing (cues at 10%, 38%, 42%, 85%, flight at 92% of the hero's scroll, after a first try at 7/30/34/60/70% read too fast)
- **Revisit if:** the steps feel too slow or too fast once he scrolls it on his phone

### 2026-10-19 · Homepage 11 becomes the homepage
- **Options:** /homepage-8 (intro + avatar flight) · /homepage-9 (depth hero, copy tied to the scroll) · /homepage-11 (depth hero, timed copy steps)
- **Chose:** /homepage-11, now at "/". The original home, /homepage-8 and /homepage-9 go to /archive/; the nav points only at /, /about and /logo-gallery-3
- **Why:** Israel: "homepage 11 is the official main homepage." It opens on the name tag and one line, and the rest plays as you scroll, which suits hiring managers who give it seconds
- **Gave up:** the I·O·D intro on the homepage; a redirect from the old /homepage-11 address (the Framer plan has no redirects)
- **Who decided:** Israel
- **Revisit if:** user testing shows people miss the intro, or the plan gains redirects
