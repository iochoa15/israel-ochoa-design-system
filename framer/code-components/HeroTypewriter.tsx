import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useState, useEffect, useRef } from "react"
import { useInView } from "framer-motion"

// Each word is an array of segments — segments can be italic independently
type Segment = { text: string; italic?: boolean }
type WordDef = Segment[]

const WORDS: WordDef[] = [
    [{ text: "Designs" }],
    [{ text: "Develops" }, { text: "(ish)", italic: true }],
    [{ text: "Deliver" }],
    [{ text: "Do" }],
]

const PREFIX = "Israel Ochoa/"

// Shared with HeroSequence.tsx — fired when the MainCard has risen into place.
const HERO_EVENT = "io-hero"

function wordLength(word: WordDef): number {
    return word.reduce((sum, s) => sum + s.text.length, 0)
}

function renderWord(word: WordDef, charIndex: number): React.ReactNode[] {
    const nodes: React.ReactNode[] = []
    let remaining = charIndex
    for (let i = 0; i < word.length; i++) {
        const seg = word[i]
        if (remaining <= 0) break
        const visible = seg.text.slice(0, remaining)
        remaining -= seg.text.length
        if (!visible) continue
        nodes.push(
            seg.italic ? (
                <em key={i} style={{ fontStyle: "italic" }}>{visible}</em>
            ) : (
                <span key={i}>{visible}</span>
            )
        )
    }
    return nodes
}

// Scroll progress (0–1) across the nearest ancestor taller than the viewport.
// That ancestor is the scroll stage the section is pinned inside.
function useScrollProgress(ref: React.RefObject<HTMLDivElement>, enabled: boolean) {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        if (!enabled) return
        let stage: HTMLElement | null = ref.current?.parentElement ?? null
        while (stage && stage.offsetHeight <= window.innerHeight * 1.2) {
            stage = stage.parentElement
        }

        const update = () => {
            const target = stage ?? document.documentElement
            const rect = target.getBoundingClientRect()
            const range = rect.height - window.innerHeight
            const next = range > 0 ? -rect.top / range : 0
            setProgress(Math.min(1, Math.max(0, next)))
        }

        update()
        window.addEventListener("scroll", update, { passive: true })
        window.addEventListener("resize", update)
        return () => {
            window.removeEventListener("scroll", update)
            window.removeEventListener("resize", update)
        }
    }, [enabled])

    return progress
}

// Map 0–1 progress onto type → hold → delete for every word in sequence.
function frameFor(progress: number, holdUnits: number) {
    const spans = WORDS.map((w) => wordLength(w) * 2 + holdUnits)
    const total = spans.reduce((sum, s) => sum + s, 0)
    let cursor = progress * total

    for (let i = 0; i < WORDS.length; i++) {
        if (cursor >= spans[i] && i < WORDS.length - 1) {
            cursor -= spans[i]
            continue
        }
        const len = wordLength(WORDS[i])
        if (cursor <= len) return { wordIndex: i, charIndex: Math.round(cursor) }
        if (cursor <= len + holdUnits) return { wordIndex: i, charIndex: len }
        return {
            wordIndex: i,
            charIndex: Math.max(0, len - Math.round(cursor - len - holdUnits)),
        }
    }
    return { wordIndex: 0, charIndex: 0 }
}

// True once HeroSequence reports the MainCard has landed.
function useHeroLanded(enabled: boolean) {
    const [landed, setLanded] = useState(false)
    useEffect(() => {
        if (!enabled || typeof window === "undefined") return
        setLanded(Boolean((window as any).__ioHeroLanded))
        const onHero = (e: Event) =>
            setLanded(Boolean((e as CustomEvent).detail?.landed))
        window.addEventListener(HERO_EVENT, onHero)
        return () => window.removeEventListener(HERO_EVENT, onHero)
    }, [enabled])
    return landed
}

// Time-based loop: type → hold → delete → next word. Resets when inactive.
function useAutoTyping(active: boolean, typeMs: number, deleteMs: number, holdMs: number) {
    const [frame, setFrame] = useState({ wordIndex: 0, charIndex: 0 })

    useEffect(() => {
        if (!active) {
            setFrame({ wordIndex: 0, charIndex: 0 })
            return
        }
        let word = 0
        let chars = 0
        let deleting = false
        let timer = 0

        const tick = () => {
            const len = wordLength(WORDS[word])
            if (!deleting) {
                if (chars < len) {
                    chars++
                    timer = window.setTimeout(tick, typeMs)
                } else {
                    deleting = true
                    timer = window.setTimeout(tick, holdMs)
                }
            } else if (chars > 0) {
                chars--
                timer = window.setTimeout(tick, deleteMs)
            } else {
                deleting = false
                word = (word + 1) % WORDS.length
                timer = window.setTimeout(tick, typeMs * 4)
            }
            setFrame({ wordIndex: word, charIndex: chars })
        }

        timer = window.setTimeout(tick, 350)
        return () => window.clearTimeout(timer)
    }, [active, typeMs, deleteMs, holdMs])

    return frame
}

interface HeroTypewriterProps {
    mode?: "scroll" | "auto"
    layout?: "inline" | "stacked"
    holdUnits?: number
    waitForHero?: boolean
    typeSpeed?: number
    deleteSpeed?: number
    holdTime?: number
    fontSize?: number
    lineHeight?: number
    align?: "left" | "center"
    color?: string
    style?: React.CSSProperties
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any
 */
export default function HeroTypewriter({
    mode = "scroll",
    layout = "inline",
    holdUnits = 5,
    waitForHero = true,
    typeSpeed = 70,
    deleteSpeed = 35,
    holdTime = 1600,
    fontSize = 110,
    lineHeight = 90,
    align = "left",
    color = "rgb(27, 26, 24)",
    style = {},
}: HeroTypewriterProps) {
    const ref = useRef<HTMLDivElement>(null)
    const isStatic = useIsStaticRenderer()
    const isAuto = mode === "auto"
    const [cursorVisible, setCursorVisible] = useState(true)

    const progress = useScrollProgress(ref, !isStatic && !isAuto)
    const heroLanded = useHeroLanded(!isStatic && isAuto && waitForHero)
    const inView = useInView(ref, { amount: 0.5 })
    const autoActive = isAuto && !isStatic && (waitForHero ? heroLanded : inView)
    const autoFrame = useAutoTyping(autoActive, typeSpeed, deleteSpeed, holdTime)

    useEffect(() => {
        if (isStatic) return
        const blink = setInterval(() => setCursorVisible((v) => !v), 530)
        return () => clearInterval(blink)
    }, [isStatic])

    // Canvas shows the first word fully typed so the layout is easy to judge.
    const { wordIndex, charIndex } = isStatic
        ? { wordIndex: 0, charIndex: wordLength(WORDS[0]) }
        : isAuto
          ? autoFrame
          : frameFor(progress, holdUnits)

    const cursor = (
        <span style={{ color: "rgb(229, 70, 51)", opacity: cursorVisible ? 1 : 0, fontWeight: 400, transition: "opacity 0.05s" }}>|</span>
    )

    if (layout === "stacked") {
        // Name on line one, typed word on line two — height reserved so nothing jumps.
        return (
            <div ref={ref} style={{ position: "relative", width: "100%", ...style }}>
                <p
                    aria-label={`${PREFIX}${WORDS.map((w) => w.map((s) => s.text).join("")).join(", ")}`}
                    style={{
                        fontFamily: "'Newsreader', serif",
                        fontWeight: 300,
                        fontSize,
                        lineHeight: `${lineHeight}px`,
                        letterSpacing: "-0.02em",
                        textAlign: align,
                        color,
                        margin: 0,
                        padding: 0,
                        minHeight: lineHeight * 2,
                    }}
                >
                    <span style={{ whiteSpace: "nowrap" }}>{PREFIX}</span>
                    <br />
                    <span style={{ whiteSpace: "nowrap" }}>
                        {renderWord(WORDS[wordIndex], charIndex)}
                        {cursor}
                    </span>
                </p>
            </div>
        )
    }

    return (
        <div ref={ref} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", ...style }}>
            <p style={{
                fontFamily: "'Newsreader', serif",
                fontWeight: 300,
                fontSize: "clamp(42px, 8.6vw, 110px)",
                lineHeight: 1.236,
                textAlign: "center",
                color,
                margin: 0,
                padding: 0,
                whiteSpace: "nowrap",
            }}>
                <span>{PREFIX}</span>
                {renderWord(WORDS[wordIndex], charIndex)}
                {cursor}
            </p>
        </div>
    )
}

addPropertyControls(HeroTypewriter, {
    mode: {
        type: ControlType.Enum,
        title: "Play",
        options: ["scroll", "auto"],
        optionTitles: ["On Scroll", "Auto"],
        defaultValue: "scroll",
        displaySegmentedControl: true,
    },
    holdUnits: {
        type: ControlType.Number,
        defaultValue: 5,
        min: 0,
        max: 40,
        title: "Hold",
        hidden: (p) => p.mode === "auto",
    },
    waitForHero: {
        type: ControlType.Boolean,
        title: "Wait for Card",
        description: "Start typing once the MainCard has risen into place.",
        defaultValue: true,
        hidden: (p) => p.mode !== "auto",
    },
    typeSpeed: {
        type: ControlType.Number,
        title: "Type (ms)",
        defaultValue: 70,
        min: 20,
        max: 300,
        hidden: (p) => p.mode !== "auto",
    },
    deleteSpeed: {
        type: ControlType.Number,
        title: "Delete (ms)",
        defaultValue: 35,
        min: 10,
        max: 300,
        hidden: (p) => p.mode !== "auto",
    },
    holdTime: {
        type: ControlType.Number,
        title: "Pause (ms)",
        defaultValue: 1600,
        min: 200,
        max: 5000,
        step: 100,
        hidden: (p) => p.mode !== "auto",
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["inline", "stacked"],
        optionTitles: ["One Line", "Two Lines"],
        defaultValue: "inline",
        displaySegmentedControl: true,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Size",
        defaultValue: 110,
        min: 24,
        max: 200,
        unit: "px",
        hidden: (p) => p.layout !== "stacked",
    },
    lineHeight: {
        type: ControlType.Number,
        title: "Line Height",
        defaultValue: 90,
        min: 20,
        max: 240,
        unit: "px",
        hidden: (p) => p.layout !== "stacked",
    },
    align: {
        type: ControlType.Enum,
        title: "Align",
        options: ["left", "center"],
        optionTitles: ["Left", "Center"],
        defaultValue: "left",
        displaySegmentedControl: true,
        hidden: (p) => p.layout !== "stacked",
    },
    color: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "rgb(27, 26, 24)",
    },
})
