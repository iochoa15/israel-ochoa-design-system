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
