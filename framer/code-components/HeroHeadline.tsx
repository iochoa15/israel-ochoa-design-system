import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, useInView, useMotionValue, useTransform, animate, type MotionValue, type AnimationPlaybackControls } from "framer-motion"

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
    style?: CSSProperties
}

// "build|-ish": types "build", second-guesses (deletes the d, a short pause, types it again), then adds "-ish".
const DEFAULT_WORDS = ["design", "prototype", "build|-ish"]

const HERO_KEY = "__ioHeroPlayhead"
const HERO_EVENT = "io-hero-playhead"
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

// Follows the hero timeline published by FloatingClay (see Reveal.tsx). Without one, it plays on its own
// (1.2s) once the headline is in view.
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
                        anim = animate(p, 1, { duration: 1.2, ease: "linear" })
                    },
                    { rootMargin: "0px 0px -30% 0px" }
                )
                io.observe(node)
            }, 600)
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

const fullText = (w: { base: string; tag: string }) => w.base + w.tag

// The keystrokes for one word: each step is the text shown and how long to wait after it.
// A word with an ending ("build|-ish") hesitates first: "build" → "buil" … pause … "build" → "build-ish".
function typingScript(w: { base: string; tag: string }, typeSpeed: number, holdTime: number) {
    const steps: { text: string; wait: number; idle?: boolean }[] = []
    for (let i = 1; i <= w.base.length; i++) steps.push({ text: w.base.slice(0, i), wait: typeSpeed })
    if (w.tag && w.base.length) {
        steps[steps.length - 1].wait = 320 // a beat on the finished word
        steps.push({ text: w.base.slice(0, -1), wait: 620, idle: true }) // deletes the last letter… second-guessing
        steps.push({ text: w.base, wait: 200 }) // …types it back
        for (let i = 1; i <= w.tag.length; i++) steps.push({ text: w.base + w.tag.slice(0, i), wait: typeSpeed * 1.15 })
    }
    if (steps.length) {
        steps[steps.length - 1].wait = holdTime
        steps[steps.length - 1].idle = true
    }
    return steps
}

/**
 * Hero headline with a typed verb: "I design/ for the moment AI meets a real person."
 * The verb deletes and retypes through the list while the rest of the line stays put. The red slash is the
 * cursor: it rides along with the letters as they are typed and deleted, and blinks while it waits.
 * A word written "build|-ish" second-guesses: types "build", deletes the d, pauses, types it back, then "-ish".
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
        enterAt = 0.16,
        color = "#111110",
        caretColor = "#E54633",
    } = props
    const list = (words && words.length ? words : DEFAULT_WORDS).map(parseWord)
    const key = list.map((w) => `${w.base}|${w.tag}`).join(",")
    const isStatic = useIsStaticRenderer()
    const ref = useRef<HTMLHeadingElement>(null)
    const inView = useInView(ref, { amount: 0.4 })
    const [frame, setFrame] = useState({ word: 0, text: fullText(list[0]), idle: true })
    const [reduced, setReduced] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    }, [])

    const active = !isStatic && !reduced && inView && list.length > 1

    // Entrance on the hero timeline: with the rest of the clay, after the avatar, name tag and concha.
    const playIn = !isStatic && !reduced
    const timeline = useHeroTimeline(playIn, ref)
    const enter = useTransform(timeline, (v) => clamp01((v - enterAt) / 0.3))
    const enterOpacity = useTransform(enter, (e) => (playIn ? clamp01(e / 0.6) : 1))
    const enterY = useTransform(enter, (e) => (playIn ? 32 * Math.pow(1 - e, 3) : 0))

    // Hold the full word → delete → type the next one (with its hesitation) → hold … Pauses while off screen.
    useEffect(() => {
        if (!active) return
        let cancelled = false
        let timer = 0
        let word = frame.word % list.length
        let text = frame.text
        const wait = (ms: number) => new Promise<void>((done) => (timer = window.setTimeout(done, ms)))
        const show = (t: string, idle = false) => !cancelled && setFrame({ word, text: t, idle })
        const run = async () => {
            while (!cancelled) {
                if (text === fullText(list[word])) {
                    show(text, true)
                    await wait(holdTime)
                }
                while (!cancelled && text.length) {
                    text = text.slice(0, -1)
                    show(text)
                    await wait(deleteSpeed)
                }
                if (cancelled) return
                word = (word + 1) % list.length
                await wait(typeSpeed * 3)
                for (const step of typingScript(list[word], typeSpeed, holdTime)) {
                    if (cancelled) return
                    text = step.text
                    show(text, Boolean(step.idle))
                    // the last step's wait is the hold, done at the top of the loop
                    if (step.text !== fullText(list[word])) await wait(step.wait)
                }
            }
        }
        run()
        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, typeSpeed, deleteSpeed, holdTime, key])

    const typed = isStatic ? fullText(list[0]) : frame.text
    const idle = !active || frame.idle // cursor blinks while it waits (and while it second-guesses), solid while typing
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
        description: 'Add an ending after "|" and the cursor second-guesses before typing it, e.g. build|-ish',
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
    enterAt: { type: ControlType.Number, title: "Hero entrance at", description: "Slot on the hero timeline, 0–1", defaultValue: 0.16, min: 0, max: 0.9, step: 0.01 },
    color: { type: ControlType.Color, title: "Color", defaultValue: "#111110" },
    caretColor: { type: ControlType.Color, title: "Caret", defaultValue: "#E54633" },
})
