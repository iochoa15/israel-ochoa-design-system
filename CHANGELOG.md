# Changelog · Israel Ochoa design system

What changed and when. The agent appends one entry after each meaningful change. Plain English. Newest at the bottom. For everything before Oct 17 2026, see the git history.

---

### 2026-10-17
- **Changed:** Added the kit files (AGENTS.md, workflow.md, stack-and-brand.md, decisions.md, CHANGELOG.md) and a pointer at the top of CLAUDE.md.
- **Why:** Israel said yes to adding them.
- **Files:** AGENTS.md, workflow.md, stack-and-brand.md, decisions.md, CHANGELOG.md, CLAUDE.md
- **Made by:** agent

### 2026-10-17
- **Changed:** In Framer, the nav's Logo Gallery link now goes to /logo-gallery-3, and the nav logo and Recent Work go to /homepage-8 (they pointed at homepage 5).
- **Why:** Logo gallery 3 is the chosen one; homepage 8 is the working homepage.
- **Files:** Framer MainNav component
- **Made by:** agent

### 2026-10-17
- **Changed:** In Framer, moved every page except /, /homepage-7, /homepage-8, /about and /logo-gallery-3 under /archive/.
- **Why:** Less clutter while iterating; nothing deleted.
- **Files:** Framer pages
- **Made by:** agent

### 2026-10-17
- **Changed:** The nav logo is now the avatar (42px desktop, 32px phone, same roundness as the hero avatar). The avatar flight was rewritten: glued to the page until lift-off, smoothed flight, 80% of a screen of travel, hands over to the nav avatar on landing. The hero entrance on /homepage-8 plays once per visit.
- **Why:** Israel: the flight felt fast and jagged when scrolling back and forth, and the avatar should be in the nav on every page.
- **Files:** framer/code-components/Reveal.tsx (uploaded to Framer), Framer MainNav Logo Icon
- **Made by:** agent

### 2026-10-17
- **Changed:** Filled in the domain facts in AGENTS.md: the live site is israelochoa.design (Porkbun, not Framer yet), Israel also owns israelochoa.com, io-c.design has lapsed. Marked the v1 finish line as still open while user testing continues.
- **Why:** Israel's answers.
- **Files:** AGENTS.md
- **Made by:** agent

### 2026-10-17
- **Changed:** Two new homepage options with no intro: /homepage-9 (clay objects come toward you from the distance, after microsoft.ai) and /homepage-10 (they come in from outside the screen and shrink toward the center, after contralabs.com). The hero pins while you scroll through three copy stages: (1) name tag + "I design/", (2) "for the moment AI meets a real person.", (3) the 10+ years line. The objects are his clay stills (transparent images), not 3D.
- **Why:** Israel's user testing: the intro is too much for hiring managers with 10 seconds; he wants the clay personality right in the hero.
- **Files:** framer/code-components/HeroDepth.tsx (new, uploaded to Framer), Framer pages /homepage-9 and /homepage-10 (copies of /homepage-8)
- **Made by:** agent

### 2026-10-17
- **Changed:** New /homepage-11 (a copy of /homepage-9). The name tag (avatar, name, title) stays while the copy under it changes: "I design/" first, then "for the moment AI meets a real person." forms under it, the header fades out, the 10+ years paragraph comes in and fades out, and then the avatar flies into the nav. Scroll picks the step, and each change plays out in about half a second, so it never stops half faded. The hero scrolls 500vh (was 400vh). The clay goes by about twice as fast (30 objects on desktop, 20 on phone, so all 15 stills show). Fixed the refresh flash on /homepage-9 and /homepage-11: the server used to send stage 2 and the paragraph visible. Moved /homepage-10 and /homepage-7 under /archive/.
- **Why:** Israel: keep 9, archive 10 and 7; the copy went by too quickly, the header should form first, the clay should move faster, and a refresh flashed every line at once.
- **Files:** framer/code-components/HeroDepth.tsx (new step overrides, Spacing control, refresh fix), framer/code-components/Reveal.tsx (withClayPopDockLate), Framer pages
- **Made by:** agent

### 2026-10-17
- **Changed:** Fixed the pinned hero on /homepage-9 and /homepage-11: the sticky stage had no "stick at top" value (Framer keeps it in a separate setting, positionStickyTop), so the hero scrolled away like a normal section and left a long empty stretch. /homepage-11 retimed: line 2 at 10%, header out at 38%, paragraph in at 42% and out at 85%, avatar lifts off at 92% and lands as the next section comes in. The name tag no longer slides (it stays put). The clay fades out over the last 10% of the hero, so nothing gets cut at the section's edge. The avatar flight no longer resets when the nav avatar can't be measured for a moment.
- **Why:** Israel: the hero has to hold the screen until every stage has played; there was a big empty white area; the clay got cut off at the section edge; the avatar disappeared on its own.
- **Files:** framer/code-components/HeroDepth.tsx, framer/code-components/Reveal.tsx (uploaded), Framer /homepage-9 and /homepage-11 stage
- **Made by:** agent

### 2026-10-19
- **Changed:** Fixed the hero avatar vanishing after the first hover. The pop-in fade now lives in the avatar's filter instead of its opacity, so the hover effect can't reset it.
- **Why:** Israel: the avatar disappeared after he hovered it once and only came back on the next hover or when the flight to the nav started. Cause: the hover effect also animates opacity, and on mouse leave it went back to the opacity the avatar had at load (0).
- **Files:** framer/code-components/Reveal.tsx (withClayPop, uploaded to Framer). Affects every page with the popping avatar (/homepage-5 to /homepage-11), bug fix only.
- **Made by:** agent

### 2026-10-19
- **Changed:** /homepage-11 opens on the hero alone: the clay objects are hidden on landing and fade in on the first scroll (new "Start hidden" switch on HeroDepth). The intro's "Scroll" hint is back (red blinking label + arrow, bottom center), and it sinks away as "for the moment AI meets a real person." comes in. The main nav stays hidden until the avatar lifts off for it after the paragraph, then rises in to catch it; scrolling back up hides it again.
- **Why:** Israel: on landing people should only see the avatar, name, title, the first headline and the scroll hint; the nav should arrive with the avatar.
- **Files:** framer/code-components/HeroDepth.tsx (startHidden, withStepScrollHint), framer/code-components/Reveal.tsx (withNavAfterDock), framer/code-components/ScrollHint.tsx (new), Framer /homepage-11 (HeroDepth "Start hidden" on, scroll hint row in the stage, override on "Main nav · fixed bottom")
- **Made by:** agent

### 2026-10-19
- **Changed:** Fixed the scroll hint on /homepage-11 never fading out on the published site (it was still there when the nav came in). The fade now sits on the row frame around the hint instead of on the hint component.
- **Why:** Israel: the hint has to be gone before the nav appears. Cause: a code component doesn't hand its element to an override, so the fade code had nothing to move.
- **Files:** Framer /homepage-11 (override moved to "Scroll hint row"), comments in framer/code-components/HeroDepth.tsx and ScrollHint.tsx (uploaded)
- **Made by:** agent

### 2026-10-19
- **Changed:** Moved /homepage-8 and /homepage-9 under /archive/ in Framer. The main nav now points only at pages we have: the avatar goes to /homepage-11, Recent Work to /homepage-11#work, Logo Gallery to /logo-gallery-3, About to /about, Get in touch to /homepage-11#contact (was archived homepage 5). "The Oldies" (no page yet) is hidden on desktop too, as it already was on phone. The phone nav's Work and Logos links are now set explicitly.
- **Why:** Israel: archive 8 and 9, nav links should only reflect the pages we have.
- **Files:** Framer pages, Framer MainNav component, AGENTS.md
- **Made by:** agent

### 2026-10-19
- **Changed:** Homepage 11 is now the official homepage at "/" (Israel set it as Home in Framer). The original home moved to /archive/home-original. Nav: the avatar goes to /, Recent Work to /#work, Get in touch to /#contact. No redirect from the old /homepage-11 address: the Framer plan doesn't include redirects.
- **Why:** Israel: "homepage 11 is the official main homepage."
- **Files:** Framer pages, Framer MainNav component, AGENTS.md
- **Made by:** agent

### 2026-10-22
- **Changed:** Split the work into three lanes (Orca worktrees): Framer (`main`), design system + Figma (`design-system`), and copy in Israel's voice (`Copywriting`). AGENTS.md now lists each lane's job and the handoff spot for finished copy, `documents/copy/`.
- **Why:** Israel wants the most structure possible: each kind of work in its own lane, with clear handoffs.
- **Files:** AGENTS.md, CHANGELOG.md
- **Made by:** agent

### 2026-10-27
- **Changed:** New page /homepage-12 in Framer, a copy of the homepage (homepage 11, at /). On it: page background #DADDED; the "Live prototype" labels are hidden; every eyebrow (the case-card categories, "The problem / What I did / The outcome", the Lab tags) sits under the text it belongs to, on a light block; headlines in Clash Display Regular with no italic accent words (new text styles Text Styles/V5/Display L, H2, H3); the case-card text went from 14px to 17px (V4/Body). Tablet case cards went from 600px to 760px tall so the bigger text and button fit. The contact block is a new copy of the component, "Closing · contact room (V5, Clash Display)"; the original is hidden on this page.
- **Code (bug-safe, the live homepage looks the same):** HeroHeadline.tsx gained Font, Weight and Italic end controls; LabHoverRow.tsx gained Title font, Title weight and Tag under title. Their defaults keep the old look.
- **Why:** Israel asked for a new version with this background, Clash Display, no italic accents, eyebrow chips under the text and bigger card text.
- **Files:** Framer page /homepage-12, Framer text styles V5, Framer component copy, framer/code-components/HeroHeadline.tsx, framer/code-components/LabHoverRow.tsx
- **Made by:** agent

### 2026-10-28
- **Changed:** New page /homepage-13 in Framer, a copy of /homepage-12. Headers and titles in Degular (weight 200, optical size 6, from Israel's Adobe Fonts kit gwt5tgs), the name and role too; all other text in Figtree. Headers are smaller (76px → 56px desktop, 60 → 44 tablet, 40 → 32 phone; card titles 34 → 28). Eyebrows are lowercase (new style Text Styles/V6/Label (lowercase)). New text styles Text Styles/V6/*. The contact block is another component copy, "Closing · contact room (V6, Degular)".
- **How:** Framer can't host Adobe fonts, so the new code component FontKit.tsx (on homepage 13 only) loads the kit and Figtree and swaps the fonts by CSS. LabHoverRow.tsx gained a "Lowercase tag" control (off by default, so other pages look the same).
- **Why:** Israel asked for Degular as the main font, Figtree as the secondary, smaller headers and lowercase eyebrows, and pointed out the name and role were still in the old font.
- **Files:** Framer page /homepage-13, Framer text styles V6, Framer component copy, framer/code-components/FontKit.tsx, framer/code-components/LabHoverRow.tsx, framer/code-components/README.md
- **Made by:** agent

### 2026-10-28
- **Changed:** New page /homepage-14 in Framer, a copy of /homepage-13. Headers and titles are bold Degular (700): hero, line 2, Selected work, card titles (new style Text Styles/V7/H2 (Degular bold)), What I build, Lab titles, contact heading (another component copy, V7). Line 2 breaks after "meets". Name bigger and bold in Degular; role in Figtree semibold at the paragraph size. Buttons and nav text in Degular, nav links bigger (11 → 14px, 12px on phone).
- **Code:** FontKit.tsx gained Text weights, Degular layers and Extra CSS controls (off by default, so homepage 13 looks the same).
- **Why:** Israel: "it's looking better with this font. Just make the headers bold", plus the line break, name/role, buttons and nav.
- **Files:** Framer page /homepage-14, Framer text style V7/H2, Framer component copy, framer/code-components/FontKit.tsx, documents/where-we-left-off-oct-28-2026.md, AGENTS.md
- **Made by:** agent

### 2026-10-28
- **Changed (in progress):** New page /homepage-15 in Framer, a copy of /homepage-14 after Israel's copy edits. The dark Selected work room and the contact block are now bright (#F8F9FC), the case cards a lavender grey (#ECEEF6), all their text dark; every button uses the red Primary style of the nav's "Get in touch". Contact block: another component copy, "Closing · contact room (V8, light)". Fonts are wired for Halyard Display everywhere (from the Adobe kit, once Israel adds it; Degular shows until then) with Nohemi kept wherever a text is set in it (details: role, eyebrows), waiting for Israel to upload Nohemi to Framer.
- **Code:** FontKit.tsx gained Main fonts, Secondary fonts and Keep font controls (empty by default, so homepages 13 and 14 look the same).
- **Why:** Israel asked for Halyard Display as the one font, Nohemi for details, brighter boxes and red buttons.
- **Files:** Framer page /homepage-15, Framer component copy, framer/code-components/FontKit.tsx
- **Made by:** agent

### 2026-10-28
- **Changed (homepage 15, round 2):** Selected work room and contact block #ECEEF6 (close to the card color), case cards a bit darker (#E2E5EF). Drop shadows cut to 10% of what they were. Each case card now has one paragraph (problem + what Israel did, real outcomes kept, placeholders dropped) instead of three with "the problem / what I did / the outcome" eyebrows; those eyebrows are hidden and the card content sits under the title. Role under the name is red (the button red token). Footer credits stay in Figtree, as before. Halyard Display still not in the Adobe kit and Nohemi not uploaded yet, so Degular shows where Halyard goes.
- **Code:** FontKit.tsx "Keep font" takes a list.
- **Why:** Israel's round of notes on homepage 15.
- **Files:** Framer page /homepage-15, Framer component copy V8, framer/code-components/FontKit.tsx
- **Made by:** agent

### 2026-10-28
- **Changed (homepage 15, round 3):** Every piece of text on /homepage-15 is now Halyard Display: headings, paragraphs, name, role, eyebrows, buttons, nav, Lab cards and the footer credits (wording unchanged). Halyard Display (Light, Regular, Book, Medium, SemiBold, Bold) was added to the Adobe Fonts web project "IOD" (kit gwt5tgs), which now serves it. The Font kit layer on homepage 15 applies it to all text on that page with one rule.
- **Why:** Israel: "change all of the fonts, all of the fonts, everywhere. Everything that is a live text, change it to Halyard Display." Nohemi for details comes later, one step at a time.
- **Files:** Framer page /homepage-15 (Font kit settings only), Adobe Fonts web project IOD
- **Made by:** agent

### 2026-10-28
- **Changed (homepage 15, round 4):** Headers 2px smaller and SemiBold (600) instead of Bold (700), on desktop / tablet / phone: "I design/" 54/42/25, line 2 54/42/25, Selected work and What I build 54/42/30, contact heading 54/40/26 (V8 component copy), case-card titles 26/24/20 (new style Text Styles/V8/H3 card title (Halyard semibold), so homepage 14 keeps V7), Lab titles 22px open (closed 3/4 of that).
- **Code:** LabHoverRow.tsx gained a "Title size" control (default 24, so other pages look the same).
- **Why:** Israel: "make the headers one or two points smaller and less bold."
- **Files:** Framer page /homepage-15, Framer component copy V8, framer/code-components/LabHoverRow.tsx
- **Made by:** agent

### 2026-10-28
- **Changed (homepage 15, round 5):** Every weight one step lighter: headers SemiBold → Medium (line 2, Selected work, What I build, "I design/", case-card titles, contact heading, Lab titles); name Bold → SemiBold; nav links Medium. Nohemi Medium for the details: the role under the name, every eyebrow (case-card tags, the hero "Open to…" line, Lab tags) and every button (case study, contact, nav "Get in touch").
- **How:** Nohemi Medium (Desktop font file) uploaded to the Framer workspace (Workspace settings → Fonts); Framer names it "Nohemi Medium". The agent tool can't list custom fonts, but `fontName="Nohemi"` with weight 500 resolves to it. Eyebrows got the font set on each layer (a text style's font can't get past the page's Halyard rule); buttons get it from the Font kit CSS by layer name ("Button ·"). New style Text Styles/V8/Label (Nohemi Medium) exists but ended up unused.
- **Code:** LabHoverRow.tsx gained "Tag font" and "Tag weight" controls (empty by default, so other pages look the same).
- **Why:** Israel: "everything that you made bold … semi-bold, make it medium. Just decrease one weight down. And the eyebrow, bylines, and the buttons make it Nohemi Medium."
- **Files:** Framer page /homepage-15, Framer component copy V8, Framer workspace fonts, framer/code-components/LabHoverRow.tsx
- **Made by:** agent

### 2026-10-28
- **Changed (homepage 15, round 6):** Color hierarchy: page background #CDD2EB (darkest, the blue Israel picked), Selected work room and contact box #E5E8F4 (lighter), case cards white (lightest). Case-card shadows halved to rgba(0,0,0,0.125) (they were still at 0.25: the round-2 cut hadn't reached them). Lab titles now match the case-card titles (Halyard Medium 26/24/20px, tracking -0.005em, line height 1.12, closed cards the same size). Contact box no longer looks cut: it uses a dock that always finishes at the end of the page (withDockLast) and has 64px under it on desktop and tablet so the floating nav doesn't cover its bottom edge.
- **Code:** Dock.tsx gained withDockLast. LabHoverRow.tsx gained Closed title, Title tracking and Title line height controls (defaults keep the old look).
- **Why:** Israel's notes: the contact box looked cut, Lab titles should match the case cards, shadows 50% subtler, and a clear background → room → card hierarchy.
- **Files:** Framer page /homepage-15, Framer component copy V8, framer/code-components/Dock.tsx, framer/code-components/LabHoverRow.tsx
- **Made by:** agent
