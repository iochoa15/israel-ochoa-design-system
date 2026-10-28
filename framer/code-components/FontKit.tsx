import { forwardRef, type ComponentType, type CSSProperties, type Ref } from "react"
import { addPropertyControls, ControlType } from "framer"

// Fonts Framer can't host itself (Oct 28, homepage 13). Degular comes from Israel's Adobe Fonts kit, which
// only works as a web link, so this component loads the kit and swaps the fonts by CSS on the page it sits on:
//   - Degular (main): every h1, h2 and h3, text inside a frame with withDegular, and code components that ask
//     for "degular-variable" (HeroHeadline, LabHoverRow).
//   - Figtree (secondary): all other text, including components and code set in Wix Madefor Text.
// Put one instance anywhere on the page (it takes no space). Pages without it keep their own fonts.

interface FontKitProps {
    kit: string
    weight: number
    opsz: number
    secondary: string
    style?: CSSProperties
}

const DEGULAR = `"degular-variable", sans-serif`

function fontCss(weight: number, opsz: number, secondary: string) {
    const variation = `"ital" 0, "wght" ${weight}, "opsz" ${opsz}`
    const second = `"${secondary}", sans-serif`
    return `
.framer-text, [style*="Wix Madefor"] { --framer-font-family: ${second} !important; font-family: ${second} !important; }
h1.framer-text, h2.framer-text, h3.framer-text, h1.framer-text *, h2.framer-text *, h3.framer-text *, .io-degular .framer-text {
    --framer-font-family: ${DEGULAR} !important; font-family: ${DEGULAR} !important;
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
    const { kit = "gwt5tgs", weight = 200, opsz = 6, secondary = "Figtree" } = props
    const family = encodeURIComponent(secondary).replace(/%20/g, "+")
    return (
        <div aria-hidden="true" style={{ ...props.style, width: 1, height: 1, overflow: "hidden", pointerEvents: "none" }}>
            <link rel="stylesheet" href={`https://use.typekit.net/${kit}.css`} />
            <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${family}:wght@300..900&display=swap`} />
            <style>{fontCss(weight, opsz, secondary)}</style>
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
})
