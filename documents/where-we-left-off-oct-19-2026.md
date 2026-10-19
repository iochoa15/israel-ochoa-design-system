# Where we left off (Oct 19 2026)

Read this first when restarting work on the Framer site. The 3D clay notes from Oct 9 are still in `where-we-left-off-oct-9-2026-evening.md`.

## 1. The site today

**Homepage 11 is the official homepage**, at `/` (Israel set it as Home in Framer on Oct 19). It was built as `/homepage-11`, a copy of homepage 9.

Pages visitors can reach:

| Page | What |
|---|---|
| `/` | The homepage (built as homepage 11) |
| `/about` | About |
| `/logo-gallery-3` | Logo gallery |

Everything else is under `/archive/` in Framer, kept, not deleted: the original home (`/archive/home-original`), homepages 2 to 10 (`/archive/homepage-N`; 5, 6, 7, 8 and 9 are kept versions), older logo galleries, the design system page and the GSAP test.

No redirects: the Framer plan doesn't include them, so the old `/homepage-11` address no longer works. Testers should use the main address.

## 2. How the homepage plays (top to bottom)

The hero holds the screen (a 500vh section with a sticky 100vh stage) while you scroll through it:

1. **Landing:** only the avatar, name, title, "I design/" (typing) and a red blinking "Scroll" hint with an arrow at the bottom. No clay images, no nav.
2. **First scroll:** the clay images fade in and travel toward you in depth.
3. **10%:** "for the moment AI meets a real person." forms under "I design/". The scroll hint sinks away.
4. **38%:** the header leaves. **42%:** the 10+ years paragraph comes in. **85%:** it leaves.
5. **92%:** the avatar lifts off and flies down into the nav, and the nav rises in to catch it, as the work section arrives.

The avatar, name and title stay put the whole time. Scrolling back up undoes each step.

## 3. Nav (MainNav component)

| Item | Goes to |
|---|---|
| Avatar | `/` |
| Recent Work (phone: Work) | `/#work` |
| Logo Gallery (phone: Logos) | `/logo-gallery-3` |
| About | `/about` |
| Get in touch | `/#contact` |
| The Oldies | hidden on every size (no page yet) |

## 4. Code (all in `framer/code-components/`, identical to Framer)

| File | Job on the homepage |
|---|---|
| `HeroDepth.tsx` | The clay in depth ("Start hidden" on), the copy steps (`withStepHeader`, `withStepLine2`, `withStepParagraph`) and the scroll hint's exit (`withStepScrollHint`, on the row frame around the hint) |
| `ScrollHint.tsx` | The "Scroll" label and arrow (CSS only) |
| `Reveal.tsx` | The avatar pop-in and late flight (`withClayPopDockLate`), the nav that waits for it (`withNavAfterDock`), the nav avatar slot (`withNavLogoSlot`) |

## 5. Lessons worth keeping

- **Sticky in Framer:** a sticky frame needs its "stick at" value (`positionStickyTop`), not `top`. Without it the published hero scrolled away and left a long empty area.
- **Overrides on code components:** an override that moves its element does nothing on a code component (the component doesn't hand over its element). Put the override on a frame around it.
- **Hover effects animate opacity:** a fade written into opacity gets reset by the layer's hover effect when the mouse leaves. The avatar's fade lives in its filter instead.
- **Home page:** the agent can't change which page is Home; Israel does it in the Pages panel (right-click, Set as Home Page).

## 6. Still open

- Israel publishes and reviews the homepage on laptop and phone (check that a refresh doesn't flash the nav).
- v1 finish line: still open while user testing continues.
- Coral hex: kit #FE4300 vs token #E54633, Israel to decide.
- The live domain israelochoa.design still points to the old site (Porkbun), not Framer.
