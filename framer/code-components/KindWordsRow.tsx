import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion } from "framer-motion"

interface Quote {
    quote: string
    role: string
    name: string
    photo?: { src: string; srcSet?: string; alt?: string }
    linkedin?: string
}

interface KindWordsRowProps {
    items: Quote[]
    photoShape: "circle" | "rounded"
    openRatio: number
    height: number
    gap: number
    radius: number
    style?: CSSProperties
}

const C = { ink: "#111110", muted: "#5E5D59", hair: "#E1E0DC", canvas: "#F3F3F1", surface: "#FFFFFF", stone: "#E7E5E0" }
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

// Longer quotes get a smaller size so they always fit the open card.
function openSize(text: string, narrow: boolean) {
    const n = (text || "").length
    if (narrow) return n < 140 ? 22 : n < 280 ? 18 : 16
    return n < 120 ? 30 : n < 220 ? 25 : n < 360 ? 21 : 18
}

function initials(name: string) {
    const parts = (name || "").replace(/[\[\]]/g, "").trim().split(/\s+/).filter(Boolean)
    return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "·"
}

/**
 * Kind words in the Klarna style: equal cards; the hovered one grows while the others shrink evenly.
 * Each card: the quote, then the person (photo, name, role) and a LinkedIn link.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 520
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight any
 */
export default function KindWordsRow(props: KindWordsRowProps) {
    const { items = DEFAULT_ITEMS, photoShape = "circle", openRatio = 2.5, height = 520, gap = 12, radius = 20 } = props
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
    const photoRadius = photoShape === "rounded" ? 10 : 999

    return (
        <div
            ref={rootRef}
            onMouseLeave={() => !narrow && startTransition(() => setActive(null))}
            style={{ ...props.style, position: "relative", width: "100%", height: narrow ? "auto" : "100%", minHeight: narrow ? 0 : height, display: "flex", flexDirection: narrow ? "column" : "row", gap }}
        >
            {list.map((q, i) => {
                const open = shown === i
                const size = open ? openSize(q.quote, narrow) : narrow ? 16 : 18
                return (
                    <motion.figure
                        key={i}
                        onMouseEnter={() => !narrow && startTransition(() => setActive(i))}
                        onFocus={() => startTransition(() => setActive(i))}
                        onClick={() => startTransition(() => setActive(i))}
                        tabIndex={0}
                        aria-expanded={open}
                        initial={false}
                        animate={{ flexGrow: narrow ? 0 : shown === null ? 1 : open ? openRatio : 1, backgroundColor: open ? C.surface : C.canvas }}
                        transition={SPRING}
                        style={{
                            margin: 0,
                            height: narrow ? "auto" : height,
                            flexBasis: narrow ? "auto" : 0,
                            flexShrink: narrow ? 0 : 1,
                            minWidth: 0,
                            overflow: "hidden",
                            borderRadius: radius,
                            border: `1px solid ${C.hair}`,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            padding: narrow ? 20 : 26,
                            boxSizing: "border-box",
                            gap: 20,
                            cursor: "pointer",
                            outline: "none",
                        }}
                    >
                        {/* Quote: full when open; when closed it fades out at the bottom instead of cutting off. */}
                        <div
                            style={{
                                position: "relative",
                                flex: narrow ? "0 0 auto" : "1 1 auto",
                                minHeight: 0,
                                maxHeight: narrow && !open ? 96 : undefined,
                                overflow: "hidden",
                                WebkitMaskImage: open ? undefined : "linear-gradient(to bottom, #000 70%, transparent)",
                                maskImage: open ? undefined : "linear-gradient(to bottom, #000 70%, transparent)",
                            }}
                        >
                            <blockquote
                                style={{
                                    margin: 0,
                                    fontFamily: '"Wix Madefor Display", sans-serif',
                                    fontWeight: 600,
                                    fontSize: size,
                                    lineHeight: 1.22,
                                    letterSpacing: "-0.01em",
                                    color: C.ink,
                                    transition: "font-size 0.45s cubic-bezier(0.22,1,0.36,1)",
                                }}
                            >
                                {q.quote}
                            </blockquote>
                        </div>

                        <figcaption style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flexShrink: 0 }}>
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    flexShrink: 0,
                                    borderRadius: photoRadius,
                                    overflow: "hidden",
                                    background: C.stone,
                                    display: "grid",
                                    placeItems: "center",
                                }}
                            >
                                {q.photo?.src ? (
                                    <img src={q.photo.src} srcSet={q.photo.srcSet} alt={q.photo.alt || q.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                ) : (
                                    <span style={{ ...label, fontSize: 13, letterSpacing: "0.02em", color: C.ink }}>{initials(q.name)}</span>
                                )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
                                <span style={{ fontFamily: '"Wix Madefor Text", sans-serif', fontWeight: 600, fontSize: 15, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {q.name}
                                </span>
                                <span style={{ ...label, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{q.role}</span>
                            </div>
                            {q.linkedin ? (
                                <a
                                    href={q.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`${q.name} on LinkedIn`}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        flexShrink: 0,
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        border: `1px solid ${C.hair}`,
                                        display: "grid",
                                        placeItems: "center",
                                        color: C.ink,
                                        background: C.surface,
                                    }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.5h.06c.53-1 1.84-1.8 3.64-1.8 3.9 0 4.5 2.4 4.5 5.6v5.7h-4v-5c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7v5.1h-4v-11Z" />
                                    </svg>
                                </a>
                            ) : null}
                        </figcaption>
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
                photo: { type: ControlType.ResponsiveImage, title: "Photo" },
                linkedin: { type: ControlType.Link, title: "LinkedIn" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    photoShape: {
        type: ControlType.Enum,
        title: "Photo shape",
        options: ["circle", "rounded"],
        optionTitles: ["Circle", "Rounded square"],
        defaultValue: "circle",
        displaySegmentedControl: true,
    },
    openRatio: { type: ControlType.Number, title: "Open size", defaultValue: 2.5, min: 1.5, max: 4, step: 0.1 },
    height: { type: ControlType.Number, title: "Height", defaultValue: 520, min: 360, max: 800, unit: "px" },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 12, min: 0, max: 40, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 40, unit: "px" },
})
