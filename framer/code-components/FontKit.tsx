import { forwardRef, type ComponentType, type CSSProperties, type Ref } from "react"
import { addPropertyControls, ControlType } from "framer"

// Fonts Framer can't host itself (Oct 28, homepage 13). Degular comes from Israel's Adobe Fonts kit, which
// only works as a web link, so this component loads the kit and swaps the fonts by CSS on the page it sits on:
//   - Degular (main): every h1, h2 and h3, text inside a frame with withDegular, and code components that ask
//     for "degular-variable" (HeroHeadline, LabHoverRow).
//   - Figtree (secondary): all other text, including components and code set in Wix Madefor Text.
// Put one instance anywhere on the page (it takes no space). Pages without it keep their own fonts.
// Homepage 14 (Oct 28) adds three opt-in controls: "Text weights" lets each text keep its own weight (bold
// headers) instead of one Degular weight for all; "Degular layers" puts more layers in Degular by their layer
// name (the published page labels each layer with data-framer-name); "Extra CSS" for small tweaks like nav size.
// Homepage 15 (Oct 28) adds "Main fonts" and "Secondary fonts" (full font stacks, e.g. Halyard Display from the
// same Adobe kit) and "Keep font": text set in that font in Framer (Nohemi, for details) is left alone.

interface FontKitProps {
    kit: string
    weight: number
    opsz: number
    secondary: string
    textWeights: boolean
    degularLayers: string
    extraCss: string
    mainStack: string
    secondaryStack: string
    keepFont: string
    style?: CSSProperties
}

const DEGULAR = `"degular-variable", sans-serif`

// Adds :not([style*="Nohemi"]) to each selector so text set in the kept font keeps it.
function keep(selectors: string, keepFont: string) {
    const font = keepFont.trim().replace(/"/g, "")
    if (!font) return selectors
    return selectors
        .split(",")
        .map((s) => `${s.trim()}:not([style*="${font}"])`)
        .join(", ")
}

// "Name, Button ·" → [data-framer-name^="Name"] .framer-text, … (each name matches as a prefix)
function layerSelectors(names: string) {
    return names
        .split(",")
        .map((n) => n.trim().replace(/"/g, ""))
        .filter(Boolean)
        .map((n) => `, [data-framer-name^="${n}"] .framer-text, [data-framer-name^="${n}"].framer-text, [data-framer-name^="${n}"] .framer-text *`)
        .join("")
}

function fontCss(weight: number, opsz: number, secondary: string, textWeights: boolean, degularLayers: string, mainStack: string, secondaryStack: string, keepFont: string) {
    // With text weights on, the weight axis is left to each text's own font-weight.
    const variation = textWeights ? `"ital" 0, "opsz" ${opsz}` : `"ital" 0, "wght" ${weight}, "opsz" ${opsz}`
    const second = secondaryStack.trim() || `"${secondary}", sans-serif`
    const main = mainStack.trim() || DEGULAR
    const mainSelectors = `h1.framer-text, h2.framer-text, h3.framer-text, h1.framer-text *, h2.framer-text *, h3.framer-text *, .io-degular .framer-text${layerSelectors(degularLayers)}`
    return `
${keep(`.framer-text, [style*="Wix Madefor"]`, keepFont)} { --framer-font-family: ${second} !important; font-family: ${second} !important; }
${keep(mainSelectors, keepFont)} {
    --framer-font-family: ${main} !important; font-family: ${main} !important;
    --framer-font-style: normal !important; font-style: normal !important;
    font-variation-settings: ${variation} !important;
}
[style*="degular-variable"] { font-variation-settings: ${variation} !important; }
`
}

/**
 * @framerIntrinsicWidth 1
 * @framerIntrinsicHeight 1
 */
export default function FontKit(props: FontKitProps) {
    const { kit = "gwt5tgs", weight = 200, opsz = 6, secondary = "Figtree", textWeights = false, degularLayers = "", extraCss = "", mainStack = "", secondaryStack = "", keepFont = "" } = props
    const family = encodeURIComponent(secondary).replace(/%20/g, "+")
    return (
        <div aria-hidden="true" style={{ ...props.style, width: 1, height: 1, overflow: "hidden", pointerEvents: "none" }}>
            <link rel="stylesheet" href={`https://use.typekit.net/${kit}.css`} />
            {secondaryStack.trim() ? null : <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${family}:wght@300..900&display=swap`} />}
            <style>{fontCss(weight, opsz, secondary, textWeights, degularLayers, mainStack, secondaryStack, keepFont) + extraCss}</style>
        </div>
    )
}

// For text that isn't a heading but should be in Degular (the name and role): put it on the frame around it.
export function withDegular(Component: ComponentType<any>): ComponentType {
    return forwardRef(function Degular(props: any, ref: Ref<any>) {
        return <Component ref={ref} {...props} className={`${props.className ?? ""} io-degular`.trim()} />
    })
}

addPropertyControls(FontKit, {
    kit: { type: ControlType.String, title: "Adobe kit", defaultValue: "gwt5tgs" },
    weight: { type: ControlType.Number, title: "Degular weight", defaultValue: 200, min: 200, max: 800, step: 10 },
    opsz: { type: ControlType.Number, title: "Optical size", defaultValue: 6, min: 0, max: 100 },
    secondary: { type: ControlType.String, title: "Secondary font", defaultValue: "Figtree" },
    textWeights: { type: ControlType.Boolean, title: "Text weights", description: "On: each text keeps its own weight (Degular weight is ignored)", defaultValue: false },
    degularLayers: { type: ControlType.String, title: "Degular layers", description: "Layer names (or how they start), comma-separated", defaultValue: "" },
    extraCss: { type: ControlType.String, title: "Extra CSS", displayTextArea: true, defaultValue: "" },
    mainStack: { type: ControlType.String, title: "Main fonts", description: 'Empty = Degular. E.g. "halyard-display", sans-serif', defaultValue: "" },
    secondaryStack: { type: ControlType.String, title: "Secondary fonts", description: "Empty = the Secondary font above, from Google Fonts", defaultValue: "" },
    keepFont: { type: ControlType.String, title: "Keep font", description: "Text set in this font in Framer keeps it, e.g. Nohemi", defaultValue: "" },
})
