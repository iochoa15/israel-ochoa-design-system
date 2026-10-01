import { forwardRef, useEffect, type ComponentType } from "react"

// Learn more: https://www.framer.com/developers/overrides/

// Apply this override to the CapabilitiesCards grid (the frame holding the
// three Card instances). It stretches every card to the height of the
// tallest one, so the row stays even regardless of how much text each
// card has. Works at any viewport width — the grid row height is always
// driven by the tallest card and the others follow.

const STYLE_ID = "equal-height-cards-style"

const CSS = `
[data-framer-name="CapabilitiesCards"] {
    align-items: stretch !important;
}
[data-framer-name="CapabilitiesCards"] > div {
    height: auto !important;
}
[data-framer-name="CapabilitiesCards"] > div > * {
    height: 100% !important;
}
[data-framer-name="CapabilitiesCards"] [data-framer-name="Default"] {
    height: 100% !important;
}
[data-framer-name="CapabilitiesCards"] [data-framer-name="Default"] > * {
    flex-grow: 1 !important;
}
`

export function withEqualHeightCards(Component: any): ComponentType {
    return forwardRef((props: any, ref) => {
        useEffect(() => {
            if (document.getElementById(STYLE_ID)) return
            const tag = document.createElement("style")
            tag.id = STYLE_ID
            tag.textContent = CSS
            document.head.appendChild(tag)
        }, [])

        return <Component ref={ref} {...props} />
    })
}
