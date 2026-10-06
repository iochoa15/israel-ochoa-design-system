import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion } from "framer-motion"

interface Quote {
    quote: string
    role: string
    name: string
    video?: string
}

interface KindWordsRowProps {
    items: Quote[]
    openRatio: number
    height: number
    gap: number
    radius: number
    style?: CSSProperties
}

const C = { ink: "#111110", muted: "#5E5D59", hair: "#E1E0DC", canvas: "#F3F3F1", surface: "#FFFFFF", stone: "#EFEDEA" }
const label: CSSProperties = {
    fontFamily: '"Wix Madefor Text", sans-serif',
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: C.muted,
}

const DEFAULT_ITEMS: Quote[] = [
    { quote: "“[Short quote from a teammate.]”", role: "DeSales Media · [Role]", name: "[Name]" },
    { quote: "“[Short quote about building together.]”", role: "Engineer or PM · [Role]", name: "[Name]" },
    { quote: "“[Short quote from a collaborator.]”", role: "Cawfee con Leche · [Role]", name: "[Name]" },
    { quote: "“[Another quote.]”", role: "[Company] · [Role]", name: "[Name]" },
]

const SPRING = { type: "spring", stiffness: 170, damping: 26, mass: 0.9 } as const

/**
 * Kind words in the Klarna style: equal cards; the hovered one grows (with its video) while the others shrink evenly.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight any
 */
export default function KindWordsRow(props: KindWordsRowProps) {
    const { items = DEFAULT_ITEMS, openRatio = 2.5, height = 520, gap = 12, radius = 20 } = props
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
    const shownBase = isStatic ? list.length - 1 : active
    // On narrow screens (no hover) the cards become a tap-to-open accordion; the first one starts open.
    const shown = narrow ? (active ?? 0) : shownBase

    return (
        <div
            ref={rootRef}
            onMouseLeave={() => !narrow && startTransition(() => setActive(null))}
            style={{ ...props.style, position: "relative", width: "100%", height: narrow ? "auto" : "100%", minHeight: narrow ? 0 : height, display: "flex", flexDirection: narrow ? "column" : "row", gap }}
        >
            {list.map((q, i) => {
                const open = shown === i
                return (
                    <motion.figure
                        key={i}
                        onMouseEnter={() => !narrow && startTransition(() => setActive(i))}
                        onFocus={() => startTransition(() => setActive(i))}
                        onClick={() => startTransition(() => setActive(i))}
                        tabIndex={0}
                        aria-expanded={open}
                        initial={false}
                        animate={{ flexGrow: narrow ? 0 : shown === null ? 1 : open ? openRatio : 1, height: narrow ? (open ? 440 : 140) : height, backgroundColor: open ? C.surface : C.canvas }}
                        transition={SPRING}
                        style={{
                            margin: 0,
                            flexBasis: narrow ? "auto" : 0,
                            flexShrink: narrow ? 0 : 1,
                            minWidth: 0,
                            overflow: "hidden",
                            borderRadius: radius,
                            border: `1px solid ${C.hair}`,
                            display: "flex",
                            flexDirection: "column",
                            padding: 22,
                            boxSizing: "border-box",
                            gap: 16,
                            cursor: "pointer",
                            outline: "none",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={label}>{String(i + 1).padStart(2, "0")}</span>
                            <motion.span animate={{ rotate: open ? 45 : 0 }} transition={SPRING} style={{ ...label, fontSize: 14, color: C.ink }}>+</motion.span>
                        </div>

                        <motion.div
                            initial={false}
                            animate={{ height: open ? 220 : 0, opacity: open ? 1 : 0 }}
                            transition={SPRING}
                            style={{ borderRadius: radius - 4, background: C.stone, overflow: "hidden", position: "relative", flexShrink: 0, order: narrow ? 3 : 0 }}
                        >
                            {q.video ? (
                                <video src={q.video} muted loop playsInline autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <span style={{ ...label, color: C.ink, position: "absolute", left: 14, bottom: 14, background: C.surface, borderRadius: 999, padding: "7px 12px" }}>▶ Play</span>
                            )}
                        </motion.div>

                        <div style={{ marginTop: narrow ? 0 : "auto", order: narrow ? 2 : 0, display: "flex", flexDirection: "column", gap: 10 }}>
                            <blockquote
                                style={{
                                    margin: 0,
                                    fontFamily: '"Wix Madefor Display", sans-serif',
                                    fontWeight: 600,
                                    fontSize: open ? (narrow ? 24 : 30) : narrow ? 17 : 20,
                                    lineHeight: 1.15,
                                    letterSpacing: "-0.01em",
                                    color: C.ink,
                                    transition: "font-size 0.45s cubic-bezier(0.22,1,0.36,1)",
                                }}
                            >
                                {q.quote}
                            </blockquote>
                            <figcaption style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <span style={{ ...label, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.role}</span>
                                <span style={{ fontFamily: '"Wix Madefor Text", sans-serif', fontWeight: 500, fontSize: 14, color: C.ink }}>{q.name}</span>
                            </figcaption>
                        </div>
                    </motion.figure>
                )
            })}
        </div>
    )
}

addPropertyControls(KindWordsRow, {
    items: {
        type: ControlType.Array,
        title: "Quotes",
        maxCount: 6,
        control: {
            type: ControlType.Object,
            controls: {
                quote: { type: ControlType.String, title: "Quote", displayTextArea: true, defaultValue: "“Quote”" },
                role: { type: ControlType.String, title: "Company · role", defaultValue: "[Company] · [Role]" },
                name: { type: ControlType.String, title: "Name", defaultValue: "[Name]" },
                video: { type: ControlType.File, title: "Video (optional)", allowedFileTypes: ["mp4", "webm", "mov"] },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    openRatio: { type: ControlType.Number, title: "Open size", defaultValue: 2.5, min: 1.5, max: 4, step: 0.1 },
    height: { type: ControlType.Number, title: "Height", defaultValue: 520, min: 360, max: 800, unit: "px" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 12, min: 0, max: 40, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 40, unit: "px" },
})
