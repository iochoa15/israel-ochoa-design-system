import { useEffect, useLayoutEffect, useRef, useState, startTransition, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, AnimatePresence, useScroll, useSpring, useMotionValueEvent } from "framer-motion"

const IMG = (id: string) => `https://framerusercontent.com/images/${id}.png`
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

// Survives moves between pages inside the site (no full reload), so a second mount means "came back".
let mountedBefore = false

// True when the visitor reached this page from another page of the same site.
function cameFromInsideSite(): boolean {
    if (typeof window === "undefined") return false
    const here = window.location.pathname
    try {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
        if (nav && new URL(nav.name).pathname !== here) return true // landed elsewhere, then moved here in-site
    } catch (e) {}
    try {
        if (document.referrer) {
            const ref = new URL(document.referrer)
            if (ref.origin === window.location.origin && ref.pathname !== here) return true
        }
    } catch (e) {}
    return mountedBefore
}

// The IOD logo, split into its three letters (from the original SVG, viewBox 56.053 × 30.994).
const LOGO_W = 56.053
const LOGO_H = 30.994
const LETTERS = [
    { key: "I", x0: 0, x1: 7.61, d: "M7.61.387H0v30.227h7.61z" },
    {
        key: "O",
        x0: 9.0,
        x1: 40.75,
        d: "M24.913 30.994a17.6 17.6 0 0 1-2.778-.224c-6.67-1.079-11.902-6.136-13.016-12.586a15.24 15.24 0 0 1 3.556-12.695C15.731 2.001 20.192 0 24.913 0c.92 0 1.854.076 2.779.225 6.67 1.078 11.902 6.136 13.016 12.586a15.24 15.24 0 0 1-3.558 12.695c-3.055 3.489-7.515 5.488-12.237 5.488M24.908 6.93c-2.336.001-4.55.9-6.237 2.531-1.686 1.63-2.616 3.772-2.618 6.03-.001 2.29.92 4.443 2.593 6.063s3.9 2.512 6.267 2.512a8.95 8.95 0 0 0 6.244-2.532c1.686-1.63 2.615-3.771 2.618-6.03.001-2.29-.92-4.443-2.593-6.063s-3.9-2.511-6.267-2.511z",
    },
    { key: "D", x0: 40.163, x1: 56.053, d: "M40.163 24.064c4.823-.072 8.722-3.886 8.722-8.567 0-4.68-3.9-8.495-8.722-8.567V0c8.774.072 15.89 6.995 15.89 15.497s-7.114 15.425-15.89 15.497z" },
]

interface Img {
    src: string
    alt?: string
}
interface ClaySet {
    i?: Img
    o?: Img
    d?: Img
}

interface IODIntroProps {
    sets: ClaySet[]
    background: string
    logoColor: string
    textColor: string
    accent: string
    railColor: string
    label: string
    skipLabel: string
    stepLength: number
    landOnHero: boolean
    style?: CSSProperties
}

const DEFAULT_SETS: ClaySet[] = [
    { i: { src: IMG("DFjCTNNntA2RH7XCit2i6qNu0h4"), alt: "Clay bottle" }, o: { src: IMG("fMAYl6eSQce5mNu5WU4bnQrdhA"), alt: "Clay concha" }, d: { src: IMG("eLdwIZmJqyF0i8rQnKn0TGWDEHI"), alt: "Clay taco" } },
    { i: { src: IMG("Id0Y7CZYFQ3YOkCAeWn9fdqWrw"), alt: "Clay pencil" }, o: { src: IMG("Ch7Z1QxsbVVXCJricwWkSJXrn2o"), alt: "Clay A coin" }, d: { src: IMG("XEMXYicF2jUA9UzW1gCpbodUQ"), alt: "Clay pizza" } },
    { i: { src: IMG("MJDOVmTb4YxBuYJ9vbderDX2wo"), alt: "Clay Statue of Liberty" }, o: { src: IMG("UVbIi4OBaDDAJKhVGbPpAYzxaHM"), alt: "Clay kettlebell" }, d: { src: IMG("iQEPMwjJHU9dfH1MAWeln2Sa0"), alt: "Clay moon wand" } },
]
// Relative size of each slot's object (I is tall and thin, O is the hero, D is the half-round).
const SLOT_SIZE = [0.42, 1, 0.8]
const SPRING = { type: "spring", stiffness: 140, damping: 20, mass: 1 } as const

/**
 * I·O·D intro: opens on the IOD logo; as you scroll, each letter morphs into a clay object, set after set.
 * Always there on a fresh visit; coming back from another page of the site lands just below it, on the hero.
 * Set the instance height to Fit Content.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function IODIntro(props: IODIntroProps) {
    const {
        sets = DEFAULT_SETS,
        background = "#F3F3F1",
        logoColor = "#111110",
        textColor = "#5E5D59",
        accent = "#E54633",
        railColor = "#E1E0DC",
        label = "Scroll",
        skipLabel = "Skip intro",
        stepLength = 90,
        landOnHero = true,
    } = props
    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const [step, setStep] = useState(0)
    const [vw, setVw] = useState(1200)

    const list = (sets && sets.length ? sets : DEFAULT_SETS).map((s, i) => ({ ...DEFAULT_SETS[i % DEFAULT_SETS.length], ...s }))
    const steps = 1 + list.length // logo + every set

    // Everyone gets the intro on a fresh visit. Coming back from another page of the site lands on the hero
    // (just below the intro); scrolling up still plays it.
    useIsoLayoutEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const jump = landOnHero && !window.location.hash && cameFromInsideSite()
        mountedBefore = true
        if (!jump) return
        const toHero = () => {
            const el = rootRef.current
            if (!el) return
            const top = window.scrollY + el.getBoundingClientRect().bottom
            window.scrollTo({ top, behavior: "instant" as ScrollBehavior })
        }
        toHero()
        // The router may reset the scroll right after the page mounts; re-apply only if we're still at the top.
        const raf = window.requestAnimationFrame(toHero)
        const t = window.setTimeout(() => {
            if (window.scrollY < 40) toHero()
        }, 250)
        return () => {
            window.cancelAnimationFrame(raf)
            window.clearTimeout(t)
        }
    }, [isStatic, landOnHero])

    useEffect(() => {
        // Size from the component's own width (matches the breakpoint on canvas and the screen on the live site).
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width
            if (w) startTransition(() => setVw(w))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start start", "end end"] })
    const rail = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })

    useMotionValueEvent(scrollYProgress, "change", (p) => {
        const next = Math.min(steps - 1, Math.floor(p * steps * 1.0001))
        if (next !== step) startTransition(() => setStep(next))
    })

    function skip() {
        if (typeof window === "undefined" || !rootRef.current) return
        const r = rootRef.current.getBoundingClientRect()
        window.scrollTo({ top: window.scrollY + r.bottom, behavior: "smooth" })
    }

    const shownStep = isStatic ? 0 : step
    const isPhone = vw < 640
    const logoW = Math.min(560, vw * (isPhone ? 0.78 : 0.5))
    const s = logoW / LOGO_W
    const spread = Math.min(360, vw * (isPhone ? 0.3 : 0.27))
    const objBase = Math.min(320, vw * (isPhone ? 0.34 : 0.24))

    const labelStyle: CSSProperties = {
        fontFamily: '"Wix Madefor Text", sans-serif',
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: textColor,
    }

    return (
        <div ref={rootRef} style={{ ...props.style, position: "relative", width: "100%", height: `${100 + (steps - 1) * stepLength}vh`, background }}>
            <div style={{ position: "sticky", top: 0, height: "100vh", width: "100%", overflow: "hidden" }}>
                {/* "Scroll" sits just left of the progress rail, centered on it */}
                {label ? (
                    <span style={{ ...labelStyle, position: "absolute", right: isPhone ? 20 : 88, top: "50%", transform: "translateY(-50%)" }}>{label}</span>
                ) : null}

                {/* Progress rail with one dot per step */}
                {!isPhone && (
                    <div style={{ position: "absolute", right: 56, top: "50%", transform: "translateY(-50%)", height: 240, width: 16 }}>
                        <div style={{ position: "absolute", left: 7, top: 0, width: 2, height: "100%", background: railColor, borderRadius: 2, overflow: "hidden" }}>
                            <motion.div style={{ width: "100%", height: "100%", background: accent, transformOrigin: "top", scaleY: isStatic ? 0 : rail }} />
                        </div>
                        {Array.from({ length: steps }).map((_, i) => (
                            <motion.span
                                key={i}
                                animate={{ scale: i <= shownStep ? 1 : 0.6, backgroundColor: i <= shownStep ? accent : railColor }}
                                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                                style={{ position: "absolute", left: 0, top: `calc(${(i / (steps - 1)) * 100}% - 8px)`, width: 16, height: 16, borderRadius: 16, border: `3px solid ${background}`, boxSizing: "border-box" }}
                            />
                        ))}
                    </div>
                )}

                {/* The three slots: each starts as a letter of the logo and morphs into a clay object */}
                <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0 }}>
                    {LETTERS.map((L, slot) => {
                        const letterCx = ((L.x0 + L.x1) / 2 - LOGO_W / 2) * s
                        const atLogo = shownStep === 0
                        const cx = atLogo ? letterCx : (slot - 1) * spread
                        const set = atLogo ? null : list[shownStep - 1]
                        const img = set ? [set.i, set.o, set.d][slot] : null
                        const w = objBase * SLOT_SIZE[slot]
                        return (
                            <motion.div key={L.key} initial={false} animate={{ x: cx }} transition={SPRING} style={{ position: "absolute", left: 0, top: 0 }}>
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {atLogo ? (
                                        <motion.svg
                                            key="letter"
                                            viewBox={`${L.x0} 0 ${L.x1 - L.x0} ${LOGO_H}`}
                                            width={(L.x1 - L.x0) * s}
                                            height={LOGO_H * s}
                                            initial={{ opacity: 0, scale: 0.7, filter: "blur(6px)" }}
                                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, scale: 0.55, filter: "blur(8px)", transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
                                            transition={{ ...SPRING, delay: slot * 0.05 }}
                                            style={{ position: "absolute", left: (-(L.x1 - L.x0) * s) / 2, top: (-LOGO_H * s) / 2, overflow: "visible", display: "block" }}
                                            aria-label={slot === 1 ? "IOD logo" : undefined}
                                        >
                                            <path d={L.d} fill={logoColor} />
                                        </motion.svg>
                                    ) : (
                                            <motion.div
                                                key={`set-${shownStep}`}
                                                style={{ position: "absolute", left: -w / 2, top: 0, width: w, y: "-50%" }}
                                                initial={{ opacity: 0, scale: 0.4, rotate: slot === 1 ? 0 : slot === 0 ? -14 : 14, filter: "blur(10px)" }}
                                                animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
                                                exit={{ opacity: 0, scale: 0.6, filter: "blur(8px)", transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }}
                                                transition={{ ...SPRING, delay: slot * 0.07 }}
                                            >
                                                <motion.img
                                                    src={img?.src}
                                                    alt={img?.alt || ""}
                                                    draggable={false}
                                                    animate={isStatic ? undefined : { y: [0, -12, 0], rotate: [0, slot % 2 ? 3 : -3, 0] }}
                                                    transition={{ duration: 3.6 + slot * 0.6, repeat: Infinity, ease: "easeInOut" }}
                                                    style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }}
                                                />
                                            </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>

                <button
                    onClick={skip}
                    style={{ ...labelStyle, position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", background: "transparent", border: "none", cursor: "pointer", padding: "8px 12px" }}
                >
                    {skipLabel}
                </button>
            </div>
        </div>
    )
}

addPropertyControls(IODIntro, {
    sets: {
        type: ControlType.Array,
        title: "Clay sets",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                i: { type: ControlType.ResponsiveImage, title: "I (tall)" },
                o: { type: ControlType.ResponsiveImage, title: "O (round)" },
                d: { type: ControlType.ResponsiveImage, title: "D (half-round)" },
            },
        },
        defaultValue: DEFAULT_SETS,
    },
    stepLength: { type: ControlType.Number, title: "Scroll per step", defaultValue: 90, min: 40, max: 200, unit: "vh" },
    landOnHero: {
        type: ControlType.Boolean,
        title: "Return to hero",
        description: "Visitors coming back from another page land on the hero; scrolling up still shows the intro.",
        defaultValue: true,
    },
    background: { type: ControlType.Color, title: "Background", defaultValue: "#F3F3F1" },
    logoColor: { type: ControlType.Color, title: "Logo", defaultValue: "#111110" },
    textColor: { type: ControlType.Color, title: "Text", defaultValue: "#5E5D59" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#E54633" },
    railColor: { type: ControlType.Color, title: "Rail", defaultValue: "#E1E0DC" },
    label: { type: ControlType.String, title: "Label", defaultValue: "Scroll" },
    skipLabel: { type: ControlType.String, title: "Skip label", defaultValue: "Skip intro" },
})
