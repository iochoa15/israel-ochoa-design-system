import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

type Kind = "away" | "annotator" | "token" | "site" | "log"

interface LiveTileProps {
    kind: Kind
    hoverKey: string
    video?: string
    alwaysPlay: boolean
    style?: CSSProperties
}

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

/**
 * Live tile for the Lab: a small working interface (or a video) that plays only while hovered.
 * Pair it with the matching "withLabHover…" override on its cell so hovering anywhere on the cell plays it.
 *
 * @framerIntrinsicWidth 380
 * @framerIntrinsicHeight 240
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function LiveTile(props: LiveTileProps) {
    const { kind = "away", hoverKey = "away", video, alwaysPlay = false } = props
    const isStatic = useIsStaticRenderer()
    const [on, setOn] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const playing = !isStatic && (alwaysPlay || on)

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        function onHover(e: Event) {
            const d = (e as CustomEvent).detail || {}
            if (d.key === hoverKey) startTransition(() => setOn(!!d.on))
        }
        window.addEventListener("io-lab-hover", onHover)
        return () => window.removeEventListener("io-lab-hover", onHover)
    }, [hoverKey, isStatic])

    useEffect(() => {
        const v = videoRef.current
        if (!v) return
        if (playing) v.play().catch(() => {})
        else v.pause()
    }, [playing])

    const Ui = { away: Away, annotator: Annotator, token: Token, site: Site, log: Log }[kind] || Away

    return (
        <div
            onMouseEnter={() => startTransition(() => setOn(true))}
            onMouseLeave={() => startTransition(() => setOn(false))}
            style={{ ...props.style, position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
            <style>{CSS}</style>
            {video ? (
                <video
                    ref={videoRef}
                    src={video}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }}
                />
            ) : (
                <div className={playing ? "lt-anim lt-on" : "lt-anim"} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <Ui />
                </div>
            )}
        </div>
    )
}

addPropertyControls(LiveTile, {
    kind: {
        type: ControlType.Enum,
        title: "Interface",
        options: ["away", "annotator", "token", "site", "log"],
        optionTitles: ["Away", "Annotator", "Token plugin", "This site", "Build log"],
        defaultValue: "away",
    },
    hoverKey: { type: ControlType.String, title: "Hover key", defaultValue: "away" },
    video: { type: ControlType.File, title: "Video (optional)", allowedFileTypes: ["mp4", "webm", "mov"] },
    alwaysPlay: { type: ControlType.Boolean, title: "Always play", defaultValue: false },
})
