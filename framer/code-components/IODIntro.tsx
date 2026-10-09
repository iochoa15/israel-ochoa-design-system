import { useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, AnimatePresence, animate, useInView, useMotionValue, useScroll, useSpring, useMotionValueEvent } from "framer-motion"

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
    mode: "scroll" | "slots"
    style?: CSSProperties
}

const DEFAULT_SETS: ClaySet[] = [
    // Stack 0
    { i: { src: "https://framerusercontent.com/images/pN611Rw0wpmbAsCxT8BYSJf74TQ.webp", alt: "Clay I" }, o: { src: "https://framerusercontent.com/images/4dWUVZxlb00dvuEmHjSClmqsBms.webp", alt: "Clay O" }, d: { src: "https://framerusercontent.com/images/AUsV1hV6zpa8wWYUPyZpRCDCaZE.webp", alt: "Clay D" } },
    // Stack 1
    { i: { src: "https://framerusercontent.com/images/CIaDHs03xx80z7e3aJyfJhnPVE.webp", alt: "Clay beer bottle" }, o: { src: "https://framerusercontent.com/images/GZ7ltRMxOLG1Dl2fB7LdYIujjg.webp", alt: "Clay concha" }, d: { src: "https://framerusercontent.com/images/IJ4v1DFwdMVVWv6GBbPgtLA3fs.webp", alt: "Clay taco" } },
    // Stack 2
    { i: { src: "https://framerusercontent.com/images/G7kUeulTgMVDgL0KdpIJzyhrL8.webp", alt: "Clay Statue of Liberty" }, o: { src: "https://framerusercontent.com/images/uv1gEP7i6lDXaHnBjwoAqSPbJk.webp", alt: "Clay A train coin" }, d: { src: "https://framerusercontent.com/images/oJWOzjsoIpt7JLejqzl4I1WbAp4.webp", alt: "Clay pizza" } },
    // Stack 3
    { i: { src: "https://framerusercontent.com/images/SeSrl7KlX1bsHnal18ztjJKT2I.webp", alt: "Clay Evangelion" }, o: { src: "https://framerusercontent.com/images/3qXZMDiMk9rlAQv1OMEB0WXDjJc.webp", alt: "Clay Dragon Ball" }, d: { src: "https://framerusercontent.com/images/HtuqR8xeYER3wxXjwFxPw4tBFU.webp", alt: "Clay moon wand" } },
    // Stack 4
    { i: { src: "https://framerusercontent.com/images/gYfvYKJ3gfPKK27NtQSYThTxU.webp", alt: "Clay dumbbell" }, o: { src: "https://framerusercontent.com/images/qeREjdnZusv1jJ0oSFtoLMPbo.webp", alt: "Clay kettlebell" }, d: { src: "https://framerusercontent.com/images/x4GWujFlQHQEfLyxTiGDEtRLZwk.webp", alt: "Clay boxing glove" } },
    // Stack 5
    { i: { src: "https://framerusercontent.com/images/qtSEzW2E7DYzsmtfe0FBZvFKWs.webp", alt: "Clay Virgin of Guadalupe" }, o: { src: "https://framerusercontent.com/images/sxQHvbBGfY9UcjdXmi1CX2jHQ.webp", alt: "Clay candy skull" }, d: { src: "https://framerusercontent.com/images/0g742sol6L6HsgEQmligfq2U9M.webp", alt: "Clay rainbow" } },
]
// The box each slot's object fits into (share of the base size): I is tall and thin, O is the hero, D is the
// half-round. Objects keep their own shape inside the box.
// Sized against the logo's height, so the objects stay about as big as the letters they replace and sit where
// the letters were: the IOD still reads (Oct 9, round 17: they were too big and too far apart).
const SLOT_BOX = [
    { w: 0.42, h: 1 },
    { w: 1, h: 1 },
    { w: 0.72, h: 0.95 },
]
const OBJ_SCALE = 0.99 // object box vs the logo's height (+15% on Oct 9, round 19)
const OBJ_SPREAD = 1.12 // object centers vs the letter centers (a touch apart so they don't touch)
const SPRING = { type: "spring", stiffness: 140, damping: 20, mass: 1 } as const

/**
 * I·O·D intro: opens on the black IOD logo; as you scroll, each letter morphs into a clay object, stack after
 * stack (Stack 0: the clay I, O, D, then Stacks 1–5), then it lands on the hero. The progress dots are numbered.
 * Mode "Slot machine": no scrolling through steps. Once it's on screen it plays by itself, quickly: every stack
 * shows once (0 → 5), each object sliding in from the opposite side of its neighbor (I and D from the top, O
 * from the bottom), then it settles back on the black logo. Plays again if you scroll away and come back.
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
        stepLength = 63,
        landOnHero = true,
        mode = "scroll",
    } = props
    const slots = mode === "slots"
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
    const objBase = LOGO_H * s * OBJ_SCALE

    // Slot machine: which stack the reels show (-1 = the logo) and how many spins so far.
    const inView = useInView(rootRef, { amount: 0.4 })
    const [spin, setSpin] = useState({ round: 0, from: -1, to: -1 })
    const slotRail = useMotionValue(0)
    // One pass: logo → Stack 0 … Stack 5 → logo. Each step ~0.95s. Resets when the intro leaves the screen.
    const [played, setPlayed] = useState(false)
    useEffect(() => {
        if (!slots || isStatic) return
        if (!inView) {
            if (played && spin.to === -1) startTransition(() => setPlayed(false))
            return
        }
        if (played) return
        const last = spin.to === list.length - 1
        const wait = spin.round === 0 || spin.to === -1 ? 650 : 950
        const t = window.setTimeout(() => {
            startTransition(() => {
                setSpin((p) => ({ round: p.round + 1, from: p.to, to: last ? -1 : p.to + 1 }))
                if (last) setPlayed(true)
            })
        }, wait)
        return () => window.clearTimeout(t)
    }, [slots, isStatic, inView, spin.round, spin.to, played, list.length])
    useEffect(() => {
        if (!slots) return
        const c = animate(slotRail, spin.to < 0 ? 0 : (spin.to + 1) / (steps - 1), { duration: 1.2, ease: [0.22, 1, 0.36, 1] })
        return () => c.stop()
    }, [slots, spin.to])
    const railFill = slots ? slotRail : rail
    const currentStep = slots ? spin.to + 1 : shownStep

    const labelStyle: CSSProperties = {
        fontFamily: '"Wix Madefor Text", sans-serif',
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: textColor,
    }

    return (
        <div ref={rootRef} style={{ ...props.style, position: "relative", width: "100%", height: slots ? "100vh" : `${100 + (steps - 1) * stepLength}vh`, background }}>
            <div style={{ position: "sticky", top: 0, height: "100vh", width: "100%", overflow: "hidden" }}>
                {/* "Scroll" sits just left of the progress rail, centered on it: blinks red, with a small arrow moving down */}
                {label ? (
                    <div
                        style={{
                            position: "absolute",
                            right: isPhone ? 20 : 86,
                            top: "50%",
                            transform: "translateY(-50%)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        <motion.span
                            style={{ ...labelStyle, color: accent }}
                            animate={isStatic ? undefined : { opacity: [1, 1, 0.25, 1] }}
                            transition={{ duration: 1.1, times: [0, 0.45, 0.7, 1], repeat: Infinity, ease: "easeInOut" }}
                        >
                            {label}
                        </motion.span>
                        <motion.svg
                            width="12"
                            height="14"
                            viewBox="0 0 12 14"
                            aria-hidden="true"
                            animate={isStatic ? undefined : { y: [0, 6, 0], opacity: [1, 0.35, 1] }}
                            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                            style={{ display: "block", overflow: "visible" }}
                        >
                            <path d="M6 1v11M1.5 7.5 6 12l4.5-4.5" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.svg>
                    </div>
                ) : null}

                {/* Progress rail: a small dot for the logo, then one numbered dot per stack (0, 1, 2…). Reached = red. */}
                {!isPhone && (
                    <div style={{ position: "absolute", right: 54, top: "50%", transform: "translateY(-50%)", height: 280, width: 18 }}>
                        <div style={{ position: "absolute", left: 8, top: 0, width: 2, height: "100%", background: railColor, borderRadius: 2, overflow: "hidden" }}>
                            <motion.div style={{ width: "100%", height: "100%", background: accent, transformOrigin: "top", scaleY: isStatic ? 0 : railFill }} />
                        </div>
                        {Array.from({ length: steps }).map((_, i) => {
                            const reached = i <= currentStep
                            const isLogo = i === 0
                            const size = isLogo ? 9 : 17
                            return (
                                <motion.span
                                    key={i}
                                    animate={{ scale: i === currentStep ? 1.12 : reached ? 1 : 0.86, backgroundColor: reached ? accent : railColor, color: reached ? "#FFFFFF" : textColor }}
                                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                                    style={{
                                        position: "absolute",
                                        left: (18 - size) / 2,
                                        top: `calc(${(i / (steps - 1)) * 100}% - ${size / 2}px)`,
                                        width: size,
                                        height: size,
                                        borderRadius: size,
                                        border: `2px solid ${background}`,
                                        boxSizing: "border-box",
                                        display: "grid",
                                        placeItems: "center",
                                        fontFamily: '"Wix Madefor Text", sans-serif',
                                        fontWeight: 700,
                                        fontSize: 8,
                                        lineHeight: 1,
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {isLogo ? null : i - 1}
                                </motion.span>
                            )
                        })}
                    </div>
                )}

                {/* Slot machine: three reels where the letters were */}
                {slots ? (
                    <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0 }}>
                        {LETTERS.map((L, slot) => (
                            <Reel
                                key={L.key}
                                slot={slot}
                                letter={L}
                                s={s}
                                cx={((L.x0 + L.x1) / 2 - LOGO_W / 2) * s}
                                w={objBase * SLOT_BOX[slot].w}
                                h={objBase * SLOT_BOX[slot].h}
                                list={list}
                                spin={spin}
                                logoColor={logoColor}
                            />
                        ))}
                    </div>
                ) : null}

                {/* The three slots: each starts as a letter of the logo and morphs into a clay object */}
                <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, display: slots ? "none" : "block" }}>
                    {LETTERS.map((L, slot) => {
                        const letterCx = ((L.x0 + L.x1) / 2 - LOGO_W / 2) * s
                        const atLogo = shownStep === 0
                        const cx = atLogo ? letterCx : letterCx * OBJ_SPREAD
                        const set = atLogo ? null : list[shownStep - 1]
                        const img = set ? [set.i, set.o, set.d][slot] : null
                        const w = objBase * SLOT_BOX[slot].w
                        const h = objBase * SLOT_BOX[slot].h
                        return (
                            <motion.div key={L.key} initial={false} animate={{ x: cx }} transition={SPRING} style={{ position: "absolute", left: 0, top: 0 }}>
                                <AnimatePresence mode="popLayout" initial={false}>
                                    {atLogo ? (
                                        <motion.div
                                            key="letter"
                                            initial={{ opacity: 0, scale: 0.7, filter: "blur(6px)" }}
                                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, scale: 0.55, filter: "blur(8px)", transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
                                            transition={{ ...SPRING, delay: slot * 0.05 }}
                                            style={{ position: "absolute", left: (-(L.x1 - L.x0) * s) / 2, top: (-LOGO_H * s) / 2 }}
                                        >
                                            {/* Levitates like the clay objects: each letter on its own slow bob and tilt */}
                                            <motion.svg
                                                viewBox={`${L.x0} 0 ${L.x1 - L.x0} ${LOGO_H}`}
                                                width={(L.x1 - L.x0) * s}
                                                height={LOGO_H * s}
                                                animate={isStatic ? undefined : { y: [0, -10, 0, 6, 0], rotate: [0, slot % 2 ? 2 : -2, 0, slot % 2 ? -1.5 : 1.5, 0] }}
                                                transition={{ duration: 4.2 + slot * 0.7, repeat: Infinity, ease: "easeInOut", delay: slot * 0.35 }}
                                                style={{ overflow: "visible", display: "block" }}
                                                aria-label={slot === 1 ? "IOD logo" : undefined}
                                            >
                                                <path d={L.d} fill={logoColor} />
                                            </motion.svg>
                                        </motion.div>
                                    ) : (
                                            <motion.div
                                                key={`set-${shownStep}`}
                                                style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h }}
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
                                                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", userSelect: "none" }}
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

// One reel window where the letter was. Each step slides the next object in and the current one out, in one
// quick move (no spinning blur). Neighbors move in opposite directions: I and D come down from the top, O comes
// up from the bottom.
const CELL = 1.5 // each cell is taller than the object, so objects have room above and below
function Reel(props: {
    slot: number
    letter: (typeof LETTERS)[number]
    s: number
    cx: number
    w: number
    h: number
    list: ClaySet[]
    spin: { round: number; from: number; to: number }
    logoColor: string
}) {
    const { slot, letter, s, cx, w, h, list, spin, logoColor } = props
    // Tall enough that the soft top/bottom edge of the window never touches the letter or the object.
    const cell = Math.max(h, LOGO_H * s) * CELL
    const fromTop = slot !== 1
    const y = useMotionValue(0)
    const item = (stack: number): { kind: "logo" } | { kind: "img"; img?: Img } => {
        if (stack < 0) return { kind: "logo" }
        const set = list[stack % list.length]
        return { kind: "img", img: [set.i, set.o, set.d][slot] }
    }
    // Two cells: the one leaving and the one arriving, ordered so the new one enters from its side.
    const strip = useMemo(() => {
        if (spin.round === 0) return [item(spin.to)]
        return fromTop ? [item(spin.to), item(spin.from)] : [item(spin.from), item(spin.to)]
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spin.round])

    // Before paint, so the new strip never flashes at the old position.
    useIsoLayoutEffect(() => {
        if (spin.round === 0) return y.set(0)
        y.set(fromTop ? -cell : 0)
        const a = animate(y, fromTop ? 0 : -cell, { type: "spring", stiffness: 260, damping: 26, mass: 0.8, delay: slot * 0.06 })
        return () => a.stop()
    }, [spin.round])

    const lw = (letter.x1 - letter.x0) * s
    const lh = LOGO_H * s
    const winW = Math.max(w, lw)
    return (
        <div
            style={{
                position: "absolute",
                left: cx - winW / 2,
                top: -cell / 2,
                width: winW,
                height: cell,
                overflow: "hidden",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
                maskImage: "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
            }}
        >
            <motion.div style={{ y, position: "absolute", left: 0, top: 0, width: "100%" }}>
                {strip.map((it, i) => (
                    <div key={i} style={{ height: cell, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {it.kind === "logo" ? (
                            <svg viewBox={`${letter.x0} 0 ${letter.x1 - letter.x0} ${LOGO_H}`} width={lw} height={lh} style={{ display: "block", overflow: "visible" }}>
                                <path d={letter.d} fill={logoColor} />
                            </svg>
                        ) : (
                            <img
                                src={it.img?.src}
                                alt={it.img?.alt || ""}
                                draggable={false}
                                style={{ width: w, height: h, objectFit: "contain", display: "block", userSelect: "none" }}
                            />
                        )}
                    </div>
                ))}
            </motion.div>
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
    stepLength: { type: ControlType.Number, title: "Scroll per step", defaultValue: 63, min: 30, max: 200, unit: "vh", hidden: (p: any) => p.mode === "slots" },
    mode: {
        type: ControlType.Enum,
        title: "Mode",
        options: ["scroll", "slots"],
        optionTitles: ["Scroll steps", "Slot machine"],
        defaultValue: "scroll",
        displaySegmentedControl: true,
    },
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
