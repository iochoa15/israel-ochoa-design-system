# Framer code components & overrides

Backup copies of the code files that live inside the Framer project (exported Oct 1, 2026).
Framer is the source of truth — edit there, then re-export here.

| File | What it does | Used on |
|------|--------------|---------|
| `GlobalCSS.tsx` | Injects the shared glass material: anything named `*Glass*` gets fill + 12px backdrop blur | /, /homepage, -2, -3 |
| `GlobalCSSLite.tsx` | Faster version: fill only, real 8px blur just on `NavGlass` and `MainCardGlass*` | /homepage-4 |
| `HeroTypewriter.tsx` | "Israel Ochoa/ Designs · Develops(ish) · Deliver · Do". Play on scroll or auto, one or two lines | MainCard, older homepages |
| `HeroSequence.tsx` | Overrides: MainCard rises to center, then TopStats drops in and MainNav slides up together | /homepage-3, -4 |
| `StageSnap.tsx` | Gentle snap to `Stage_*` frames + keeps your place in a stage when the window is resized | /homepage-3, -4 |
| `CarouselControls.tsx` | Recent Work carousel: directional blur-fade (GSAP) | /homepage-2, -3 |
| `CarouselControlsLite.tsx` | Same, but blur only while a slide is moving | /homepage-4 |
| `TestimonialCarousel.tsx` | 3-up testimonial carousel (GSAP) | /homepage-2, -3 |
| `TestimonialCarouselLite.tsx` | Same, blur only while moving | /homepage-4 |
| `GsapDemo.tsx` | GSAP test component | /gsap-test |
| `EqualHeightCards.tsx`, `Examples.tsx` | Older helpers / examples | — |

Animations run in Framer Preview and on the published site, not on the canvas.
