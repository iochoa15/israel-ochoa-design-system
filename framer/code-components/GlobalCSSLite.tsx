/**
 * GlobalCSSLite — performance version of GlobalCSS (used on /homepage-4).
 *
 * Same naming rule: put "Glass" anywhere in a layer's name (for a COMPONENT,
 * in the VARIANT's name) and it gets the glass fill.
 *
 * Difference from GlobalCSS: the real backdrop blur is expensive to draw on every
 * scroll frame (×4 on Retina), and on the flat cream background it's invisible —
 * a translucent fill looks the same. So:
 *   - every *Glass* layer gets the translucent fill only (no blur, no forced GPU layer)
 *   - only the nav bar and the MainCard keep a real, slightly softer (8px) blur
 */

const CSS = `
/* ---- Shared glass fill — anything named *Glass* gets this ---- */
[data-framer-name*="Glass"] {
  background-color: rgba(252, 252, 252, 0.28) !important;
}

/* ---- Real frosted blur: only where content actually passes behind ---- */
[data-framer-name="NavGlass"],
[data-framer-name^="MainCardGlass"] {
  -webkit-backdrop-filter: blur(8px) !important;
  backdrop-filter: blur(8px) !important;
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
  transform: scale(1.03) !important;
  box-shadow: 0 14px 34px rgba(27, 26, 24, 0.12) !important;
}
`

export default function GlobalCSSLite() {
    return (
        <div style={{ display: "none" }}>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
        </div>
    )
}
