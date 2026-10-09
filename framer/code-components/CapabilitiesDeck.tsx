import { useEffect, useRef, useState, startTransition, type CSSProperties, type ReactNode } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion"

interface Item {
    title?: string
    description?: string
    video?: string
    image?: { src: string; srcSet?: string; alt?: string }
}

interface CapabilitiesDeckProps {
    showHeading: boolean
    headingLead: string
    headingSerif: string
    eyebrow: string
    items: Item[]
    stepLength: number
    contentWidth: number
    bottomSpace: number
    background: string
    ink: string
    muted: string
    accent: string
    cardColor: string
    mediaColor: string
    style?: CSSProperties
}

const RUBIK = { src: "https://framerusercontent.com/images/4VSREJEP30BfIfkxKG59RIFnzJk.png", alt: "Clay Rubik's cube" }
const LEGO = { src: "https://framerusercontent.com/images/NnoiHqSkNoiaL9rJDgcENTCkzic.png", alt: "Clay lego bricks" }

const DEFAULT_ITEMS: Item[] = [
    {
        title: "AI Interface Design",
        description:
            "Designing the interaction model between humans and AI. I work on the flows, components, and small decisions that turn AI capability into something a real person can use, trust, and come back to.",
        image: RUBIK,
    },
    {
        title: "Brand and Digital Experience",
        description:
            "Brand systems for bilingual audiences and for national and international brands that can't afford to get it wrong. I make brands coherent across every surface they touch.",
        image: LEGO,
    },
    {
        title: "Design Leadership and Systems",
        description:
            "I ship fast, think in systems, and lead design decisions that move numbers. A decade leading brand and digital design for a 90+ organization ecosystem: cross-functional, bilingual, high-stakes.",
        image: RUBIK,
    },
]

const NARROW = 810 // below this container width: title above the card, description below
const HOLD = 0.12 // share of each step where nothing moves, so every card gets a moment to rest

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const easeInOut = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2 // gentle: no sudden jumps between wheel steps

// Scroll progress 0..1 → card position 0..n-1, with a pause on each card.
function toStep(p: number, n: number) {
    if (n <= 1) return 0
    const x = clamp(p, 0, 1) * (n - 1)
    const i = Math.min(Math.floor(x), n - 2)
    const f = clamp((x - i - HOLD) / (1 - 2 * HOLD), 0, 1)
    return i + easeInOut(f)
}

/**
 * Capabilities scroll deck: the section pins while you scroll; each card slides up and covers the last,
 * the one behind steps back (smaller, faded). The title sits left of the card and the description right
 * of it, centered on the card, and they fade out and in as the cards change. Phones stack them.
 * Set the instance height to Fit Content.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 2400
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function CapabilitiesDeck(props: CapabilitiesDeckProps) {
    const {
        showHeading = false,
        headingLead = "What I",
        headingSerif = "do",
        eyebrow = "Capabilities",
        items: rawItems = DEFAULT_ITEMS,
        stepLength = 110,
        contentWidth = 1200,
        bottomSpace = 120,
        background = "rgba(0,0,0,0)",
        ink = "#111110",
        muted = "#5E5D59",
        accent = "#E54633",
        cardColor = "#FDFDFD",
        mediaColor = "#ECEAE5",
    } = props
    // Framer can hand array images over empty; fall back to the defaults per slot.
    const list = rawItems && rawItems.length ? rawItems : DEFAULT_ITEMS
    const items = list.map((it, i) => ({
        title: it?.title ?? DEFAULT_ITEMS[i]?.title ?? "",
        description: it?.description ?? DEFAULT_ITEMS[i]?.description ?? "",
        video: it?.video,
        image: it?.image?.src ? it.image : DEFAULT_ITEMS[i % DEFAULT_ITEMS.length]?.image,
    }))
    const n = items.length

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLElement>(null)
    const [narrow, setNarrow] = useState(false)

    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(() => {
            const next = el.clientWidth < NARROW
            startTransition(() => setNarrow((prev) => (prev === next ? prev : next)))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start start", "end end"] })
    // A mouse wheel moves the page in big steps; the spring turns them into one smooth glide.
    const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.5, restDelta: 0.0005 })
    const step = useTransform(smooth, (p) => (isStatic ? 0 : toStep(p, n)))
    // The first card grows in while the section rises from the bottom of the screen to the top.
    const { scrollYProgress: introRaw } = useScroll({ target: rootRef, offset: ["start end", "start start"] })
    const introSmooth = useSpring(introRaw, { stiffness: 140, damping: 30, mass: 0.5, restDelta: 0.0005 })
    const intro = useTransform(introSmooth, (v) => (isStatic ? 1 : v))

    const side = narrow ? 20 : 48
    const cardSize: CSSProperties = narrow
        ? { width: "min(78vw, 340px)", aspectRatio: "440 / 520", maxHeight: "calc(100svh - 380px)" }
        : { height: `min(520px, calc(100svh - ${(showHeading ? 190 : 120) + bottomSpace}px))`, aspectRatio: "440 / 520" }

    const titleStyle: CSSProperties = {
        margin: 0,
        fontFamily: '"Newsreader", serif',
        fontStyle: "italic",
        fontWeight: 300,
        fontSize: narrow ? 30 : 44,
        lineHeight: 1.08,
        letterSpacing: "-0.01em",
        color: ink,
        textAlign: narrow ? "center" : "left",
    }
    const descStyle: CSSProperties = {
        margin: 0,
        fontFamily: '"Wix Madefor Text", sans-serif',
        fontSize: narrow ? 16 : 18,
        lineHeight: narrow ? "24px" : "28px",
        color: muted,
        textAlign: narrow ? "center" : "left",
        maxWidth: 360,
        marginInline: narrow ? "auto" : undefined,
    }

    const titles = items.map((it, i) => (
        <Copy key={i} index={i} step={step} vertical={narrow}>
            <h3 style={titleStyle}>{it.title}</h3>
        </Copy>
    ))
    const descs = items.map((it, i) => (
        <Copy key={i} index={i} step={step} vertical={narrow}>
            <p style={descStyle}>{it.description}</p>
        </Copy>
    ))
    const cards = (
        <div style={{ position: "relative", ...cardSize }}>
            {items.map((it, i) => (
                <Card key={i} index={i} step={step} intro={intro} rotate={i % 2 ? 2 : -2} cardColor={cardColor} mediaColor={mediaColor} video={it.video} image={it.image} />
            ))}
        </div>
    )

    return (
        <section
            ref={rootRef}
            aria-label={`${headingLead} ${headingSerif}`.trim()}
            style={{ ...props.style, position: "relative", width: "100%", height: `${(n - 1) * stepLength + 100}vh`, background }}
        >
            <div style={{ position: "sticky", top: 0, height: "100svh", width: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {showHeading ? (
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: `${narrow ? 72 : 96}px ${side}px 0` }}>
                    <h2
                        style={{
                            margin: 0,
                            fontFamily: '"Wix Madefor Display", sans-serif',
                            fontWeight: 600,
                            fontSize: narrow ? 40 : 56,
                            lineHeight: 1,
                            letterSpacing: "-0.03em",
                            color: ink,
                        }}
                    >
                        {headingLead}{" "}
                        <em style={{ fontFamily: '"Newsreader", serif', fontStyle: "italic", fontWeight: 300, fontSize: "1.07em", letterSpacing: "-0.02em" }}>{headingSerif}</em>
                    </h2>
                    {eyebrow ? (
                        <span
                            style={{
                                fontFamily: '"Wix Madefor Text", sans-serif',
                                fontWeight: 600,
                                fontSize: 12,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: accent,
                            }}
                        >
                            {eyebrow}
                        </span>
                    ) : null}
                </header>
                ) : null}

                {narrow ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: `${showHeading ? 0 : 56}px ${side}px ${bottomSpace}px` }}>
                        <div style={{ position: "relative", width: "100%", height: 72 }}>{titles}</div>
                        {cards}
                        <div style={{ position: "relative", width: "100%", height: 120 }}>{descs}</div>
                    </div>
                ) : (
                    <div
                        style={{
                            flex: 1,
                            display: "grid",
                            gridTemplateColumns: "1fr auto 1fr",
                            columnGap: 56,
                            alignItems: "center",
                            width: "100%",
                            maxWidth: contentWidth + side * 2,
                            margin: "0 auto",
                            boxSizing: "border-box",
                            padding: `${showHeading ? 0 : 72}px ${side}px ${bottomSpace}px`,
                        }}
                    >
                        <div style={{ position: "relative", height: "100%" }}>{titles}</div>
                        {cards}
                        <div style={{ position: "relative", height: "100%" }}>{descs}</div>
                    </div>
                )}
            </div>
        </section>
    )
}

// Title or description for one card: fades out (drifting up) as its card leaves, fades in (rising) as it arrives.
function Copy(props: { index: number; step: MotionValue<number>; vertical: boolean; children: ReactNode }) {
    const { index, step, vertical } = props
    const opacity = useTransform(step, (t) => clamp(1 - Math.abs(t - index) * 2.4, 0, 1))
    const y = useTransform(step, (t) => clamp(index - t, -1, 1) * 28)
    const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? "auto" : "none"))
    return (
        <div
            style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: vertical ? 0 : "50%",
                bottom: vertical ? 0 : undefined,
                transform: vertical ? undefined : "translateY(-50%)",
                display: "flex",
                alignItems: vertical ? "flex-end" : undefined,
                justifyContent: vertical ? "center" : undefined,
            }}
        >
            <motion.div style={{ opacity, y, pointerEvents, width: "100%" }}>{props.children}</motion.div>
        </div>
    )
}

// One card: comes up from the bottom of the screen at 10% of its size and already half visible, then grows into
// place over the one before, and steps back as the next arrives. Every card does the same (the first one while
// the section scrolls into view, the others while the deck is pinned). Cards further ahead stay hidden.
function Card(props: {
    index: number
    step: MotionValue<number>
    intro: MotionValue<number>
    rotate: number
    cardColor: string
    mediaColor: string
    video?: string
    image?: { src: string; srcSet?: string; alt?: string }
}) {
    const { index, step, intro, rotate, cardColor, mediaColor, video, image } = props
    // How far away the card still is: 0 = in place, 1 = waiting at the bottom, 2 = not up yet (hidden).
    const away = useTransform([step, intro] as MotionValue<number>[], ([t, s]: number[]) => (index === 0 ? 1 - s : clamp(index - t, 0, 2)))
    const y = useTransform([step, away] as MotionValue<number>[], ([t, a]: number[]) => {
        const w = Math.min(a, 1)
        const depth = clamp(t - index, 0, 2)
        // waiting: just below the bottom edge of the screen, so it visibly rises in from the bottom
        return `calc(${(w * 62).toFixed(3)}vh - ${(depth * 16).toFixed(2)}px)`
    })
    const scale = useTransform([step, away] as MotionValue<number>[], ([t, a]: number[]) => {
        const w = Math.min(a, 1)
        const grow = 0.1 + 0.9 * (1 - w) * (2 - (1 - w)) // 10% → 100%, easing out as it lands
        return grow * (1 - 0.06 * clamp(t - index, 0, 2))
    })
    const opacity = useTransform([step, away] as MotionValue<number>[], ([t, a]: number[]) => {
        const d = clamp(t - index, 0, 2)
        const back = d <= 1 ? 1 - 0.5 * d : 0.5 - 0.2 * (d - 1)
        const coming = a <= 1 ? 0.5 + 0.5 * (1 - a) : 0.5 * (2 - a) // half visible while waiting
        return back * coming
    })
    return (
        <motion.div
            style={{
                position: "absolute",
                inset: 0,
                zIndex: index,
                y,
                scale,
                opacity,
                rotate,
                background: cardColor,
                borderRadius: 24,
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 16px 32px rgba(0,0,0,0.07)",
                padding: 12,
                boxSizing: "border-box",
                willChange: "transform, opacity",
            }}
        >
            <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 16, overflow: "hidden", background: mediaColor }}>
                {video ? (
                    <video
                        src={video}
                        poster={image?.src}
                        autoPlay
                        muted
                        loop
                        playsInline
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : image?.src ? (
                    <img
                        src={image.src}
                        srcSet={image.srcSet}
                        alt={image.alt || ""}
                        draggable={false}
                        style={{ position: "absolute", left: "17%", top: "20%", width: "66%", height: "60%", objectFit: "contain", userSelect: "none" }}
                    />
                ) : null}
            </div>
        </motion.div>
    )
}

addPropertyControls(CapabilitiesDeck, {
    showHeading: { type: ControlType.Boolean, title: "Built-in heading", description: "Off: use the editable heading above the deck instead", defaultValue: false },
    headingLead: { type: ControlType.String, title: "Heading", defaultValue: "What I", hidden: (p: any) => !p.showHeading },
    headingSerif: { type: ControlType.String, title: "Heading serif", defaultValue: "do", hidden: (p: any) => !p.showHeading },
    eyebrow: { type: ControlType.String, title: "Eyebrow", defaultValue: "Capabilities", hidden: (p: any) => !p.showHeading },
    items: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title", defaultValue: "Capability" },
                description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: "What this capability means." },
                video: { type: ControlType.File, title: "Video", allowedFileTypes: ["mp4", "webm", "mov"] },
                image: { type: ControlType.ResponsiveImage, title: "Image (until video)" },
            },
        },
        defaultValue: DEFAULT_ITEMS.map(({ title, description }) => ({ title, description })),
    },
    stepLength: { type: ControlType.Number, title: "Scroll per card", defaultValue: 110, min: 60, max: 200, unit: "vh" },
    contentWidth: { type: ControlType.Number, title: "Content width", defaultValue: 1200, min: 800, max: 1600, unit: "px" },
    bottomSpace: { type: ControlType.Number, title: "Space for nav", defaultValue: 120, min: 0, max: 240, unit: "px" },
    background: { type: ControlType.Color, title: "Background", defaultValue: "rgba(0,0,0,0)" },
    ink: { type: ControlType.Color, title: "Ink", defaultValue: "#111110" },
    muted: { type: ControlType.Color, title: "Muted", defaultValue: "#5E5D59" },
    accent: { type: ControlType.Color, title: "Accent", defaultValue: "#E54633" },
    cardColor: { type: ControlType.Color, title: "Card", defaultValue: "#FDFDFD" },
    mediaColor: { type: ControlType.Color, title: "Media", defaultValue: "#ECEAE5" },
})
