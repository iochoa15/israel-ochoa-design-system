import type { CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

// The "Scroll" hint from the old intro (IODIntro), on its own (Oct 19, homepage 11): the label blinks red and a
// small arrow moves down under it. It fades in once the hero's entrance has played. On homepage 11 it sits at the
// bottom of the hero's stage, in a row frame with withStepScrollHint (HeroDepth.tsx) so it sinks away as line 2
// of the header rises in. The override goes on the row, not on this component: a code component doesn't hand its
// element to an override, so the fade never ran on the live site (Oct 19). Pure CSS animations: nothing runs in JavaScript, and the server already sends it moving.

const CSS = `
@keyframes ioHintIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes ioHintBlink{0%,45%,100%{opacity:1}70%{opacity:.25}}
@keyframes ioHintArrow{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(6px);opacity:.35}}
@media (prefers-reduced-motion: reduce){.io-hint,.io-hint *{animation:none!important}}
`

interface ScrollHintProps {
    label: string
    color: string
    delay: number
    style?: CSSProperties
}

/**
 * @framerIntrinsicWidth 80
 * @framerIntrinsicHeight 40
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function ScrollHint(props: ScrollHintProps) {
    const { label = "Scroll", color = "#E54633", delay = 1.4 } = props
    // On the canvas it sits still, fully shown, so it is easy to see and edit.
    const still = useIsStaticRenderer()
    return (
        <div
            className="io-hint"
            style={{
                ...props.style,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                animation: still ? undefined : `ioHintIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
            }}
        >
            <style>{CSS}</style>
            {label ? (
                <span
                    style={{
                        fontFamily: '"Wix Madefor Text", sans-serif',
                        fontWeight: 600,
                        fontSize: 12,
                        lineHeight: 1,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color,
                        whiteSpace: "nowrap",
                        animation: still ? undefined : "ioHintBlink 1.1s ease-in-out infinite",
                    }}
                >
                    {label}
                </span>
            ) : null}
            <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true" style={{ display: "block", overflow: "visible", animation: still ? undefined : "ioHintArrow 1.1s ease-in-out infinite" }}>
                <path d="M6 1v11M1.5 7.5 6 12l4.5-4.5" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    )
}

addPropertyControls(ScrollHint, {
    label: { type: ControlType.String, title: "Label", defaultValue: "Scroll" },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#E54633" },
    delay: { type: ControlType.Number, title: "Delay", defaultValue: 1.4, min: 0, max: 5, step: 0.1, unit: "s" },
})
