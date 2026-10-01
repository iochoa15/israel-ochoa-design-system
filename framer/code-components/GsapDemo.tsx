import { useEffect, useRef, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
// @ts-ignore — URL import: Framer's bundler resolves this at build time, TS has no types for it
import { gsap } from "https://esm.sh/gsap@3.12.5"

interface GsapDemoProps {
    headline: string
    accent: string
    background: string
    textColor: string
    style?: CSSProperties
}

/**
 * GSAP Demo
 *
 * A small proof-of-concept showing GSAP running inside a Framer code
 * component: the headline reveals, then three dots animate in with a
 * staggered bounce and keep gently floating.
 *
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 200
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function GsapDemo(props: GsapDemoProps) {
    const {
        headline = "Powered by GSAP",
        accent = "#E54633",
        background = "#FDFDFD",
        textColor = "#1B1A18",
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const headlineRef = useRef<HTMLHeadingElement>(null)

    useEffect(() => {
        // On the Framer canvas we show a static, resting state — the
        // animation only runs in Preview and on the published site.
        if (isStatic || !rootRef.current) return

        const ctx = gsap.context(() => {
            const tl = gsap.timeline()

            tl.from(headlineRef.current, {
                y: 20,
                opacity: 0,
                duration: 0.7,
                ease: "power3.out",
            })

            tl.from(
                ".gsap-dot",
                {
                    scale: 0,
                    opacity: 0,
                    duration: 0.5,
                    ease: "back.out(2)",
                    stagger: 0.12,
                },
                "-=0.3"
            )

            // Keep the dots gently floating forever.
            gsap.to(".gsap-dot", {
                y: -10,
                duration: 0.9,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
                stagger: 0.15,
            })
        }, rootRef)

        return () => ctx.revert()
    }, [isStatic])

    const dotStyle: CSSProperties = {
        width: 22,
        height: 22,
        borderRadius: "50%",
        backgroundColor: accent,
    }

    return (
        <div
            ref={rootRef}
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: "max-content",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                padding: 32,
                boxSizing: "border-box",
                borderRadius: 18,
                background,
                boxShadow: "0 10px 30px rgba(27,26,24,0.08)",
            }}
        >
            <h3
                ref={headlineRef}
                style={{
                    margin: 0,
                    fontFamily: "Newsreader, serif",
                    fontSize: 28,
                    fontWeight: 300,
                    color: textColor,
                    textAlign: "center",
                }}
            >
                {headline}
            </h3>
            <div style={{ display: "flex", gap: 16 }}>
                <div className="gsap-dot" style={dotStyle} />
                <div className="gsap-dot" style={dotStyle} />
                <div className="gsap-dot" style={dotStyle} />
            </div>
        </div>
    )
}

addPropertyControls(GsapDemo, {
    headline: {
        type: ControlType.String,
        title: "Headline",
        defaultValue: "Powered by GSAP",
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: "#E54633",
    },
    background: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FDFDFD",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#1B1A18",
    },
})
