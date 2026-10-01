/**
 * GlobalCSS — the ONE place glass lives. Injects a single <style> tag.
 *
 * ============================================================
 *  HOW TO GLASS ANYTHING (the only thing to remember):
 *  Put the word "Glass" anywhere in the layer's name.
 *  (For a COMPONENT, put it in the VARIANT's name.)
 *  e.g. "HeroGlass", "FooterGlass", "PricingCardGlass".
 *  It then picks up the shared material below automatically.
 * ============================================================
 *
 * Material = MainNav (the master): rgba(252,252,252,0.28) · 12px blur · no border.
 */

const CSS = `
/* ---- Shared glass material — anything named *Glass* gets this ---- */
[data-framer-name*="Glass"] {
  background-color: rgba(252, 252, 252, 0.28) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  backdrop-filter: blur(12px) !important;
  transform: translateZ(0) !important; /* lets the blur render on component instances */
}

/* ---- Capability cards only: hover/press feedback on top of the glass ---- */
[data-framer-name="CapabilitiesCards"] [data-framer-name*="Glass"] {
  box-shadow: 0 0 0 rgba(27, 26, 24, 0) !important;
  transition:
    transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1),
    background-color 0.16s ease-out,
    box-shadow 0.16s ease-out !important;
}
[data-framer-name="CapabilitiesCards"] [data-framer-name*="Glass"]:hover,
[data-framer-name="CapabilitiesCards"] [data-framer-name*="Glass"]:active {
  background-color: rgb(239, 242, 251) !important; /* Blue Lavender 100 */
  transform: translateZ(0) scale(1.03) !important;
  box-shadow: 0 14px 34px rgba(27, 26, 24, 0.12) !important;
}
`

export default function GlobalCSS() {
    return (
        <div style={{ display: "none" }}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
        </div>
    )
}
