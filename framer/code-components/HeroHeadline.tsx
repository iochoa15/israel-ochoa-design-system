import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate, type MotionValue, type AnimationPlaybackControls } from "framer-motion"

interface HeroHeadlineProps {
    words: string[]
    lead: string
    mark: string
    middle: string
    serif: string
    lineBreak: boolean
    fontSize: number
    typeSpeed: number
    deleteSpeed: number
    holdTime: number
    enterAt: number
    color: string
    caretColor: string
    tagColor: string
    style?: CSSProperties
}

// "build|-ish": the part after "|" is a hand-written note that pops on once the word is typed.
const DEFAULT_WORDS = ["design", "prototype", "build|-ish"]

const HERO_KEY = "__ioHeroPlayhead"
const HERO_EVENT = "io-hero-playhead"
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

// Follows the hero timeline published by FloatingClay (see Reveal.tsx). Without one, it plays on its own
// (2.4s) once the headline is in view.
function useHeroTimeline(play: boolean, el: RefObject<HTMLElement | null>): MotionValue<number> {
    const p = useMotionValue(play ? 0 : 1)
    useEffect(() => {
        if (!play || typeof window === "undefined") return
        let unsub = () => {}
        let fallback = 0
        let anim: AnimationPlaybackControls | null = null
        let io: IntersectionObserver | null = null
        const attach = () => {
            const src = (window as any)[HERO_KEY] as MotionValue<number> | undefined
            if (!src) return false
            window.clearTimeout(fallback)
            io?.disconnect()
            anim?.stop()
            unsub()
            p.set(src.get())
            unsub = src.on("change", (v) => p.set(v))
            return true
        }
        window.addEventListener(HERO_EVENT, attach)
        if (!attach()) {
            fallback = window.setTimeout(() => {
                const node = el.current
                if (!node || typeof IntersectionObserver === "undefined") return void p.set(1)
                io = new IntersectionObserver(
                    (entries) => {
                        if (!entries[0]?.isIntersecting) return
                        io?.disconnect()
                        anim = animate(p, 1, { duration: 2.4, ease: "linear" })
                    },
                    { rootMargin: "0px 0px -30% 0px" }
                )
                io.observe(node)
            }, 1200)
        }
        return () => {
            unsub()
            window.removeEventListener(HERO_EVENT, attach)
            window.clearTimeout(fallback)
            io?.disconnect()
            anim?.stop()
        }
    }, [play])
    return p
}

function parseWord(raw: string) {
    const [base = "", tag = ""] = (raw || "").split("|")
    return { base, tag }
}

/**
 * Hero headline with a typed verb: "I design/ for the moment AI meets a real person."
 * The verb deletes and retypes through the list while the rest of the line stays put. The red slash is the
 * cursor: it rides along with the letters as they are typed and deleted, and blinks while it waits.
 * A word written "build|-ish" gets a hand-written "-ish" note after it.
 * It opens on the first word fully typed, so the first read is the full sentence.
 *
 * @framerIntrinsicWidth 1000
 * @framerIntrinsicHeight 160
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function HeroHeadline(props: HeroHeadlineProps) {
    const {
        words = DEFAULT_WORDS,
        lead = "I ",
        mark = "/",
        middle = " for the moment AI meets ",
        serif = "a real person.",
        lineBreak = true,
        fontSize = 76,
        typeSpeed = 80,
        deleteSpeed = 40,
        holdTime = 2200,
        enterAt = 0.48,
        color = "#111110",
        caretColor = "#E54633",
        tagColor = "#E54633",
    } = props
    const list = (words && words.length ? words : DEFAULT_WORDS).map(parseWord)
    const key = list.map((w) => `${w.base}|${w.tag}`).join(",")
    const hasTag = list.some((w) => w.tag)
    const isStatic = useIsStaticRenderer()
    const ref = useRef<HTMLHeadingElement>(null)
    const inView = useInView(ref, { amount: 0.4 })
    const [frame, setFrame] = useState({ word: 0, chars: list[0].base.length, deleting: false })
    const [reduced, setReduced] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    }, [])

    // The hand-written note uses Caveat; load it once if any word has a note.
    useEffect(() => {
        if (!hasTag || typeof document === "undefined" || document.getElementById("io-font-caveat")) return
        const link = document.createElement("link")
        link.id = "io-font-caveat"
        link.rel = "stylesheet"
        link.href = "https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap"
        document.head.appendChild(link)
    }, [hasTag])

    const active = !isStatic && !reduced && inView && list.length > 1

    // Entrance on the hero timeline: with the rest of the clay, after the avatar, name tag and concha.
    const playIn = !isStatic && !reduced
    const timeline = useHeroTimeline(playIn, ref)
    const enter = useTransform(timeline, (v) => clamp01((v - enterAt) / 0.36))
    const enterOpacity = useTransform(enter, (e) => (playIn ? clamp01(e / 0.6) : 1))
    const enterY = useTransform(enter, (e) => (playIn ? 32 * Math.pow(1 - e, 3) : 0))

    // Hold the full word → delete → type the next one → hold … Pauses while off screen.
    useEffect(() => {
        if (!active) return
        let word = frame.word
        let chars = frame.chars
        let deleting = frame.deleting
        let timer = 0
        const tick = () => {
            const len = list[word].base.length
            if (!deleting) {
                if (chars < len) {
                    chars++
                    timer = window.setTimeout(tick, chars < len ? typeSpeed : holdTime)
                } else {
                    deleting = true
                    timer = window.setTimeout(tick, list[word].tag ? 380 : deleteSpeed) // let the note pop off first
                }
            } else if (chars > 0) {
                chars--
                timer = window.setTimeout(tick, deleteSpeed)
            } else {
                deleting = false
                word = (word + 1) % list.length
                timer = window.setTimeout(tick, typeSpeed * 3)
            }
            setFrame({ word, chars, deleting })
        }
        const settled = !frame.deleting && frame.chars >= list[frame.word].base.length
        timer = window.setTimeout(tick, settled ? holdTime : typeSpeed)
        return () => window.clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, typeSpeed, deleteSpeed, holdTime, key])

    const current = list[frame.word % list.length] || { base: "", tag: "" }
    const typed = isStatic ? list[0].base : current.base.slice(0, frame.chars)
    const full = isStatic || (!frame.deleting && frame.chars >= current.base.length)
    const showTag = Boolean((isStatic ? list[0].tag : current.tag) && full)
    const idle = !active || full // cursor blinks while it waits, stays solid while typing/deleting
    const sentence = `${lead}${list[0].base}${list[0].tag}${middle}${serif}`.replace(/\s+/g, " ").trim()
    const [beforeBreak, afterBreak] = splitForBreak(middle)

    return (
        <motion.h1
            ref={ref}
            aria-label={sentence}
            style={{
                ...props.style,
                opacity: enterOpacity,
                y: enterY,
                position: "relative",
                width: "100%",
                margin: 0,
                fontFamily: '"Wix Madefor Display", sans-serif',
                fontWeight: 600,
                fontSize,
                lineHeight: 0.96,
                letterSpacing: "-0.03em",
                fontFeatureSettings: '"cv03", "cv04", "cv09", "cv11"',
                textAlign: "center",
                color,
            }}
        >
            <span aria-hidden="true">
                {lead}
                {typed}
                <AnimatePresence initial={false}>
                    {showTag ? <Note key={`${frame.word}-${current.tag}`} text={isStatic ? list[0].tag : current.tag} color={tagColor} still={isStatic || reduced} /> : null}
                </AnimatePresence>
                {/* The slash is the cursor: it follows the letters and blinks while waiting. */}
                <motion.span
                    style={{ display: "inline-block", color: caretColor }}
                    animate={idle && active ? { opacity: [1, 1, 0.15, 0.15, 1] } : { opacity: 1 }}
                    transition={idle && active ? { duration: 0.7, times: [0, 0.45, 0.5, 0.95, 1], repeat: Infinity, ease: "linear" } : { duration: 0.1 }}
                >
                    {mark}
                </motion.span>
                {lineBreak ? (
                    <>
                        {beforeBreak}
                        <br />
                        {afterBreak}
                    </>
                ) : (
                    middle
                )}
                <em style={{ fontFamily: '"Newsreader", serif', fontStyle: "italic", fontWeight: 300, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{serif}</em>
            </span>
        </motion.h1>
    )
}

// Hand-written note ("-ish"): squeezes open, pops on with a wobble, and a red squiggle draws under it.
// Sized in em, so it scales with the headline on every breakpoint.
function Note(props: { text: string; color: string; still: boolean }) {
    const { text, color, still } = props
    return (
        <motion.span
            initial={still ? false : { width: 0 }}
            animate={{ width: "auto" }}
            exit={{ width: 0, transition: { duration: 0.25, ease: "easeIn" } }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            style={{ display: "inline-block", whiteSpace: "nowrap", verticalAlign: "baseline" }}
        >
            <motion.span
                initial={still ? false : { scale: 0, rotate: -28, opacity: 0 }}
                animate={{ scale: 1, rotate: -8, opacity: 1 }}
                exit={{ scale: 0.4, rotate: 6, opacity: 0, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 420, damping: 13, delay: still ? 0 : 0.08 }}
                style={{
                    position: "relative",
                    display: "inline-block",
                    top: "-0.32em",
                    padding: "0 0.08em 0 0.02em",
                    fontFamily: '"Caveat", "Bradley Hand", "Segoe Print", cursive',
                    fontWeight: 600,
                    fontStyle: "normal",
                    fontSize: "0.58em",
                    lineHeight: 1,
                    letterSpacing: "0",
                    color,
                    transformOrigin: "0% 100%",
                }}
            >
                {text}
                <svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", left: "4%", bottom: "-0.28em", width: "92%", height: "0.3em", overflow: "visible" }}>
                    <motion.path
                        d="M2 7 C 14 1, 22 11, 34 6 S 56 1, 68 6 S 88 11, 98 4"
                        fill="none"
                        stroke={color}
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        initial={still ? false : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.45, ease: "easeOut", delay: still ? 0 : 0.28 }}
                    />
                </svg>
            </motion.span>
        </motion.span>
    )
}

// "for the moment AI meets " → line one ends after "moment", line two starts with "AI meets".
function splitForBreak(middle: string): [string, string] {
    const idx = middle.indexOf(" AI ")
    if (idx < 0) return [middle, ""]
    return [middle.slice(0, idx), middle.slice(idx + 1)]
}

addPropertyControls(HeroHeadline, {
    words: {
        type: ControlType.Array,
        title: "Typed words",
        description: 'Add a hand-written note after a word with "|", e.g. build|-ish',
        control: { type: ControlType.String },
        defaultValue: DEFAULT_WORDS,
    },
    lead: { type: ControlType.String, title: "Before", defaultValue: "I " },
    mark: { type: ControlType.String, title: "Mark", defaultValue: "/" },
    middle: { type: ControlType.String, title: "Middle", defaultValue: " for the moment AI meets " },
    serif: { type: ControlType.String, title: "Serif end", defaultValue: "a real person." },
    lineBreak: { type: ControlType.Boolean, title: "Break before AI", defaultValue: true },
    fontSize: { type: ControlType.Number, title: "Size", defaultValue: 76, min: 24, max: 140, unit: "px" },
    typeSpeed: { type: ControlType.Number, title: "Type (ms)", defaultValue: 80, min: 20, max: 300 },
    deleteSpeed: { type: ControlType.Number, title: "Delete (ms)", defaultValue: 40, min: 10, max: 300 },
    holdTime: { type: ControlType.Number, title: "Pause (ms)", defaultValue: 2200, min: 400, max: 6000, step: 100 },
    enterAt: { type: ControlType.Number, title: "Hero entrance at", description: "Slot on the hero timeline, 0–1", defaultValue: 0.48, min: 0, max: 0.9, step: 0.01 },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#111110" },
    caretColor: { type: ControlType.Color, title: "Caret", defaultValue: "#E54633" },
    tagColor: { type: ControlType.Color, title: "Note color", defaultValue: "#E54633" },
})
