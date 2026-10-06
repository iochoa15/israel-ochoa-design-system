import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion } from "framer-motion"

type Kind = "away" | "annotator" | "token" | "site" | "log"

interface LabItem {
    name: string
    tag: string
    title: string
    sub: string
    kind: Kind
    tint: string
    video?: string
}

interface LabHoverRowProps {
    items: LabItem[]
    openRatio: number
    height: number
    gap: number
    radius: number
    style?: CSSProperties
}

// Mini interfaces (same as LiveTile.tsx) — CSS animations run only in the open card.
const C = {
    ink: "#111110",
    muted: "#5E5D59",
    hair: "#E1E0DC",
    canvas: "#F3F3F1",
    surface: "#FFFFFF",
    dark: "#0B0B0A",
    electric: "#3D6BFF",
    esoft: "#E8EEFF",
    live: "#22C55E",
    signal: "#E54633",
    flagged: "#FDECEA",
    highlight: "#FFF1B8",
}

const label: CSSProperties = {
    fontFamily: '"Wix Madefor Text", sans-serif',
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: C.muted,
}
const body: CSSProperties = {
    fontFamily: '"Wix Madefor Text", sans-serif',
    fontWeight: 500,
    fontSize: 13,
    lineHeight: 1.45,
    color: C.ink,
}
const card: CSSProperties = {
    width: "100%",
    maxWidth: 380,
    background: C.surface,
    border: `1px solid ${C.hair}`,
    borderRadius: 14,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    boxSizing: "border-box",
}
function pill(bg: string, fg: string): CSSProperties {
    return { ...label, color: fg, background: bg, borderRadius: 999, padding: "5px 9px", whiteSpace: "nowrap" }
}

// All motion is CSS keyframes, paused unless the tile is hovered.
const CSS = `
@keyframes lt-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
@keyframes lt-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
@keyframes lt-type { 0%{width:0} 55%,100%{width:100%} }
@keyframes lt-caret { 0%,49%{opacity:1} 50%,100%{opacity:0} }
@keyframes lt-sweep { 0%{background-size:0% 100%} 40%,100%{background-size:100% 100%} }
@keyframes lt-toast { 0%,40%{opacity:0;transform:translateY(8px)} 55%,90%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-4px)} }
@keyframes lt-fill { 0%{transform:scaleX(0)} 85%,100%{transform:scaleX(1)} }
@keyframes lt-chip { 0%,100%{background:${C.canvas};color:${C.muted}} 8%,25%{background:${C.ink};color:#fff} 33%{background:${C.canvas};color:${C.muted}} }
@keyframes lt-row { 0%,30%{transform:translateY(0)} 36%,63%{transform:translateY(100%)} 69%,96%{transform:translateY(200%)} 100%{transform:translateY(0)} }
@keyframes lt-line { 0%{opacity:0;transform:translateY(4px)} 12%,88%{opacity:1;transform:translateY(0)} 100%{opacity:0} }
.lt-anim *{animation-play-state:paused !important}
.lt-anim.lt-on *{animation-play-state:running !important}
`

function Away() {
    return (
        <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={label}>Day 12 of 30</span>
                <span style={{ ...label, color: C.ink }}>Kyoto</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <span style={pill(C.canvas, C.muted)}>Persona 1 · ok</span>
                <span style={{ ...pill(C.flagged, C.signal), animation: "lt-blink 1.2s ease-in-out infinite" }}>Persona 2 · flagged</span>
                <span style={pill(C.canvas, C.muted)}>Persona 3 · ok</span>
                <span style={pill(C.canvas, C.muted)}>Persona 4 · ok</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${C.hair}`, borderRadius: 10, padding: "9px 12px", gap: 8 }}>
                <span style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                    <span style={{ ...body, display: "inline-block", overflow: "hidden", whiteSpace: "nowrap", width: "100%", animation: "lt-type 3.4s steps(28) infinite" }}>
                        Find a quiet ryokan near Gion
                    </span>
                    <span style={{ ...body, marginLeft: 1, animation: "lt-caret 0.9s infinite" }}>|</span>
                </span>
                <span style={{ ...pill(C.ink, "#fff"), animation: "lt-pulse 1.4s ease-in-out infinite" }}>Go</span>
            </div>
        </div>
    )
}

function Annotator() {
    return (
        <div style={card}>
            <span style={label}>claude.ai · conversation</span>
            <span style={{ ...body, color: C.muted }}>Good onboarding asks for less, not more.</span>
            <span
                style={{
                    ...body,
                    backgroundImage: `linear-gradient(${C.highlight}, ${C.highlight})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%",
                    borderRadius: 4,
                    padding: "2px 4px",
                    animation: "lt-sweep 4s ease-in-out infinite",
                }}
            >
                Trust grows when the product admits what it doesn’t know.
            </span>
            <span style={{ ...pill(C.ink, "#fff"), alignSelf: "flex-start", animation: "lt-toast 4s ease-in-out infinite" }}>● Saved to Notion</span>
        </div>
    )
}

function Token() {
    const chips = ["Colors", "Type", "Spacing", "Radius", "Shadows", "Buttons"]
    return (
        <div style={card}>
            <span style={label}>Token Frame Generator</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {chips.map((c, i) => (
                    <span key={c} style={{ ...pill(C.canvas, C.muted), borderRadius: 6, animation: `lt-chip 6s linear ${i}s infinite` }}>{c}</span>
                ))}
            </div>
            <div style={{ height: 6, borderRadius: 3, background: C.hair, overflow: "hidden" }}>
                <div style={{ height: "100%", background: C.electric, transformOrigin: "left", animation: "lt-fill 3s ease-in-out infinite" }} />
            </div>
            <span style={{ ...label, color: C.electric }}>Generating frames · 209 variables</span>
        </div>
    )
}

function Site() {
    const rows: [string, string][] = [["HeroSequence.tsx", "Code"], ["Projects", "CMS"], ["Appear · 0.9s", "Motion"]]
    return (
        <div style={card}>
            <span style={label}>Layers</span>
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: "calc((100% - 12px) / 3)", background: C.esoft, borderRadius: 8, animation: "lt-row 4.5s ease-in-out infinite" }} />
                {rows.map(([k, v]) => (
                    <div key={k} style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8 }}>
                        <span style={body}>{k}</span>
                        <span style={pill(C.surface, C.muted)}>{v}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function Log() {
    const lines: [string, string][] = [["09:12", "Added confidence badge"], ["09:40", "Hand-off copy, v3"], ["10:05", "Claude Code: tests pass"]]
    return (
        <div style={{ ...card, background: C.dark, border: "none" }}>
            {lines.map(([t, l], i) => (
                <div key={t} style={{ display: "flex", gap: 12, animation: `lt-line 4.5s ease-in-out ${i * 0.6}s infinite` }}>
                    <span style={{ ...label, color: C.live }}>{t}</span>
                    <span style={{ ...label, color: "#fff" }}>{l}</span>
                </div>
            ))}
            <span style={{ ...label, color: "#fff", animation: "lt-caret 0.9s infinite" }}>_</span>
        </div>
    )
}


const UIS: Record<Kind, () => JSX.Element> = { away: Away, annotator: Annotator, token: Token, site: Site, log: Log }

const DEFAULT_ITEMS: LabItem[] = [
    { name: "Away", tag: "Away · iOS · 2026", title: "A 30-day trip in one app", sub: "Tested in real life", kind: "away", tint: "#E8EEFF" },
    { name: "Annotator for Claude", tag: "Annotator for Claude · 2026", title: "Highlights from Claude, saved to Notion", sub: "Chrome extension", kind: "annotator", tint: "#F6EEE6" },
    { name: "Token Frame Generator", tag: "Token Frame Generator · Figma", title: "A plugin that documents my design system", sub: "209 variables", kind: "token", tint: "#EFEDEA" },
    { name: "This site", tag: "This site · Framer", title: "Code components, CMS, motion", sub: "Built with Claude", kind: "site", tint: "#EAF2EC" },
    { name: "Custom Training", tag: "Custom Training · Next.js", title: "An AI partner that shows its reasoning", sub: "Build log", kind: "log", tint: "#E1E0DC" },
]

const SPRING = { type: "spring", stiffness: 170, damping: 26, mass: 0.9 } as const

/**
 * Lab row in the Klarna style: cards start equal; the hovered card grows while the others shrink evenly.
 * The open card plays its live interface (or video).
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 560
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight any
 */
export default function LabHoverRow(props: LabHoverRowProps) {
    const { items = DEFAULT_ITEMS, openRatio = 2.6, height = 560, gap = 12, radius = 20 } = props
    const isStatic = useIsStaticRenderer()
    const [active, setActive] = useState<number | null>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const [narrow, setNarrow] = useState(false)
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width || 0
            startTransition(() => setNarrow(w > 0 && w < 900))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const list = (items && items.length ? items : DEFAULT_ITEMS).map((it, i) => ({ ...DEFAULT_ITEMS[i % DEFAULT_ITEMS.length], ...it }))
    const shownBase = isStatic ? 0 : active
    // On narrow screens (no hover) the cards become a tap-to-open accordion; the first one starts open.
    const shown = narrow ? (active ?? 0) : shownBase

    return (
        <div
            ref={rootRef}
            onMouseLeave={() => !narrow && startTransition(() => setActive(null))}
            style={{ ...props.style, position: "relative", width: "100%", height: narrow ? "auto" : "100%", minHeight: narrow ? 0 : height, display: "flex", flexDirection: narrow ? "column" : "row", gap }}
        >
            <style>{CSS}</style>
            {list.map((item, i) => {
                const open = shown === i
                const Ui = UIS[item.kind] || Away
                return (
                    <motion.article
                        key={i}
                        onMouseEnter={() => !narrow && startTransition(() => setActive(i))}
                        onFocus={() => startTransition(() => setActive(i))}
                        onClick={() => startTransition(() => setActive(i))}
                        tabIndex={0}
                        aria-expanded={open}
                        initial={false}
                        animate={{ flexGrow: narrow ? 0 : shown === null ? 1 : open ? openRatio : 1, height: narrow ? (open ? 460 : 112) : height }}
                        transition={SPRING}
                        style={{
                            flexBasis: narrow ? "auto" : 0,
                            flexShrink: narrow ? 0 : 1,
                            minWidth: 0,
                            position: "relative",
                            overflow: "hidden",
                            borderRadius: radius,
                            background: "#FFFFFF",
                            border: "1px solid #E1E0DC",
                            display: "flex",
                            flexDirection: "column",
                            padding: 16,
                            boxSizing: "border-box",
                            gap: 14,
                            cursor: "pointer",
                            outline: "none",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={label}>{String(i + 1).padStart(2, "0")}</span>
                            <motion.span animate={{ rotate: open ? 45 : 0 }} transition={SPRING} style={{ ...label, fontSize: 14, color: C.ink }}>+</motion.span>
                        </div>

                        {/* Media: the live interface lives here, scaled down until the card opens */}
                        <div style={{ position: "relative", flex: 1, minHeight: 0, order: narrow ? 3 : 0, borderRadius: radius - 6, background: item.tint, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {item.video ? (
                                <video src={item.video} muted loop playsInline autoPlay={open} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <motion.div
                                    className={open && !isStatic ? "lt-anim lt-on" : "lt-anim"}
                                    initial={false}
                                    animate={{ scale: open ? 1 : shown === null ? 0.56 : 0.38, opacity: open ? 1 : shown === null ? 0.95 : 0.6 }}
                                    transition={SPRING}
                                    style={{ width: 340, flexShrink: 0, display: "flex", justifyContent: "center" }}
                                >
                                    <Ui />
                                </motion.div>
                            )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: narrow ? 0 : 92, order: narrow ? 2 : 0 }}>
                            <span style={{ ...label, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.tag}</span>
                            <span style={{ fontFamily: '"Wix Madefor Display", sans-serif', fontWeight: 600, fontSize: open ? 24 : 18, lineHeight: 1.15, letterSpacing: "-0.01em", color: C.ink, transition: "font-size 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
                                {open ? item.title : item.name}
                            </span>
                            <motion.span
                                initial={false}
                                animate={{ opacity: open ? 1 : 0, y: open ? 0 : 8 }}
                                transition={{ duration: 0.35, delay: open ? 0.12 : 0, ease: [0.22, 1, 0.36, 1] }}
                                style={{ ...body, color: C.muted, fontWeight: 400 }}
                            >
                                {item.sub}
                            </motion.span>
                        </div>
                    </motion.article>
                )
            })}
        </div>
    )
}

addPropertyControls(LabHoverRow, {
    items: {
        type: ControlType.Array,
        title: "Projects",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Project" },
                tag: { type: ControlType.String, title: "Tag", defaultValue: "Project · 2026" },
                title: { type: ControlType.String, title: "Title", defaultValue: "What it is" },
                sub: { type: ControlType.String, title: "Detail", defaultValue: "Detail" },
                kind: { type: ControlType.Enum, title: "Interface", options: ["away", "annotator", "token", "site", "log"], optionTitles: ["Away", "Annotator", "Token plugin", "This site", "Build log"], defaultValue: "away" },
                tint: { type: ControlType.Color, title: "Tint", defaultValue: "#E8EEFF" },
                video: { type: ControlType.File, title: "Video (optional)", allowedFileTypes: ["mp4", "webm", "mov"] },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    openRatio: { type: ControlType.Number, title: "Open size", defaultValue: 2.6, min: 1.5, max: 4, step: 0.1 },
    height: { type: ControlType.Number, title: "Height", defaultValue: 560, min: 360, max: 800, unit: "px" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 12, min: 0, max: 40, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 40, unit: "px" },
})
