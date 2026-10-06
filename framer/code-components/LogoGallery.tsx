import { useEffect, useRef, useState, startTransition, type CSSProperties, type ReactNode } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, useScroll, useSpring, useTransform } from "framer-motion"

interface LogoItem {
    name: string
    description: string
    color: string
    logoWhite?: { src: string; alt?: string }
    logoColor?: { src: string; alt?: string }
}

interface LogoGalleryProps {
    items: LogoItem[]
    columns: number
    gap: number
    radius: number
    style?: CSSProperties
}

// Placeholder set: swap in real logos (white + color) and descriptions in the properties panel.
const COLORS = ["#E54633", "#3D63B7", "#5799AE", "#1B1A18", "#8F99C2", "#C53A2B", "#336676", "#989152", "#273D73", "#70B3CA"]
const KNOWN = [
    ["DeSales Media", "One brand and digital system for 90+ organizations, in two languages."],
    ["Cawfee con Leche", "Naming, identity, Spanglish voice and product for my bicultural streetwear brand."],
    ["Universal Music Latin", "Design that had to move at the speed of culture."],
    ["Tigres", "A brand carried by decades of loyalty and millions of fans."],
    ["Subaru", "A brand carried by decades of loyalty and millions of fans."],
]
const DEFAULT_ITEMS: LogoItem[] = Array.from({ length: 30 }, (_, i) => ({
    name: KNOWN[i]?.[0] ?? `Brand ${String(i + 1).padStart(2, "0")}`,
    description: KNOWN[i]?.[1] ?? "One or two lines about what this logo is for and the problem it solved.",
    color: COLORS[i % COLORS.length],
}))

const HEIGHTS = [260, 340, 220, 300, 380, 240, 320, 280]
const EASE = [0.16, 1, 0.3, 1] as const

function Card(props: { item: LogoItem; index: number; col: number; row: number; height: number; radius: number; isStatic: boolean; fly: number }) {
    const { item, col, row, height, radius, isStatic, fly } = props
    const [hover, setHover] = useState(false)
    const intro = row < 3 // the first rows fly in on load, the rest rise in as you scroll
    const fromX = [-350, 0, 350][col % 3] * fly

    const motionProps = isStatic
        ? {}
        : intro
          ? {
                initial: { opacity: 0, x: fromX, y: (300 + row * 100) * fly, scale: 0.9, rotate: col === 0 ? -6 : col === 2 ? 6 : 0 },
                animate: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 },
                transition: { duration: 1.5 + ((row + col) % 3) * 0.3, delay: 0.25 + row * 0.2 + col * 0.06, ease: EASE },
            }
          : {
                initial: { opacity: 0, y: 140, scale: 0.94 },
                whileInView: { opacity: 1, y: 0, scale: 1 },
                viewport: { once: true, amount: 0.15 },
                transition: { duration: 1.1, ease: EASE },
            }

    return (
        <motion.button
            type="button"
            aria-label={item.name}
            onMouseEnter={() => startTransition(() => setHover(true))}
            onMouseLeave={() => startTransition(() => setHover(false))}
            onClick={() => startTransition(() => setHover((h) => !h))}
            onFocus={() => startTransition(() => setHover(true))}
            onBlur={() => startTransition(() => setHover(false))}
            {...motionProps}
            style={{
                position: "relative",
                width: "100%",
                height,
                border: "none",
                padding: 0,
                borderRadius: radius,
                overflow: "hidden",
                cursor: "pointer",
                background: item.color,
                display: "block",
            }}
        >
            {/* Front: white logo on brand color */}
            <motion.div
                animate={{ opacity: hover ? 0 : 1, scale: hover ? 0.96 : 1 }}
                transition={{ duration: 0.45, ease: EASE }}
                style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }}
            >
                {item.logoWhite?.src ? (
                    <img src={item.logoWhite.src} alt={item.logoWhite.alt || item.name} style={{ maxWidth: "62%", maxHeight: "46%", objectFit: "contain" }} />
                ) : (
                    <span style={{ fontFamily: '"Wix Madefor Display", sans-serif', fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", color: "#fff", textAlign: "center" }}>{item.name}</span>
                )}
            </motion.div>

            {/* Back: white card, color logo + description */}
            <motion.div
                initial={false}
                animate={{ clipPath: hover ? "inset(0% 0% 0% 0% round 0px)" : "inset(100% 0% 0% 0% round 0px)" }}
                transition={{ duration: 0.6, ease: EASE }}
                style={{ position: "absolute", inset: 0, background: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 22, textAlign: "left" }}
            >
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.logoColor?.src ? (
                        <img src={item.logoColor.src} alt={item.logoColor.alt || item.name} style={{ maxWidth: "62%", maxHeight: "60%", objectFit: "contain" }} />
                    ) : (
                        <span style={{ fontFamily: '"Wix Madefor Display", sans-serif', fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", color: item.color, textAlign: "center" }}>{item.name}</span>
                    )}
                </div>
                <motion.div
                    animate={{ opacity: hover ? 1 : 0, y: hover ? 0 : 10 }}
                    transition={{ duration: 0.4, delay: hover ? 0.15 : 0, ease: EASE }}
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                    <span style={{ fontFamily: '"Wix Madefor Text", sans-serif', fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5E5D59" }}>{item.name}</span>
                    <span style={{ fontFamily: '"Wix Madefor Text", sans-serif', fontWeight: 400, fontSize: 14, lineHeight: 1.45, color: "#111110" }}>{item.description}</span>
                </motion.div>
            </motion.div>
        </motion.button>
    )
}

function Column(props: { children: ReactNode; offset: number; progress: any; gap: number; isStatic: boolean }) {
    const y = useSpring(useTransform(props.progress, [0, 1], [0, -props.offset * 1400]), { stiffness: 80, damping: 24, mass: 0.6 })
    return (
        <motion.div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: props.gap, y: props.isStatic ? 0 : y }}>
            {props.children}
        </motion.div>
    )
}

/**
 * Logo gallery in the shopify.design style: cards fly into a 3-column grid on load, keep rising in as you scroll,
 * columns drift at different speeds, and each card turns white with the color logo and a description on hover.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 3000
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function LogoGallery(props: LogoGalleryProps) {
    const { items = DEFAULT_ITEMS, columns = 3, gap = 16, radius = 20 } = props
    const isStatic = useIsStaticRenderer()
    const ref = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
    const [width, setWidth] = useState(1200)
    useEffect(() => {
        const el = ref.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => startTransition(() => setWidth(entries[0]?.contentRect.width || 1200)))
        ro.observe(el)
        return () => ro.disconnect()
    }, [])
    const list = (items && items.length ? items : DEFAULT_ITEMS).map((it, i) => ({ ...DEFAULT_ITEMS[i % DEFAULT_ITEMS.length], ...it }))
    const cols = width < 1000 ? 2 : Math.max(1, Math.min(4, columns))
    const colW = (width - gap * (cols - 1)) / cols
    const hScale = Math.max(0.55, Math.min(1.2, colW / 389))
    const fly = Math.max(0.35, Math.min(1, width / 1200))
    const buckets: { item: LogoItem; index: number }[][] = Array.from({ length: cols }, () => [])
    list.forEach((item, index) => buckets[index % cols].push({ item, index }))

    return (
        <div ref={ref} style={{ ...props.style, position: "relative", width: "100%", display: "flex", gap, alignItems: "flex-start", paddingBottom: 200 }}>
            {buckets.map((bucket, c) => (
                <Column key={c} offset={c * 0.08} progress={scrollYProgress} gap={gap} isStatic={isStatic}>
                    {bucket.map(({ item, index }, r) => (
                        <Card key={index} item={item} index={index} col={c} row={r} height={Math.round(HEIGHTS[(index + c * 3) % HEIGHTS.length] * hScale)} radius={radius} isStatic={isStatic} fly={fly} />
                    ))}
                </Column>
            ))}
        </div>
    )
}

addPropertyControls(LogoGallery, {
    items: {
        type: ControlType.Array,
        title: "Logos",
        maxCount: 60,
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "Brand" },
                description: { type: ControlType.String, title: "Description", displayTextArea: true, defaultValue: "What this logo is for." },
                color: { type: ControlType.Color, title: "Brand color", defaultValue: "#E54633" },
                logoWhite: { type: ControlType.ResponsiveImage, title: "Logo (white)" },
                logoColor: { type: ControlType.ResponsiveImage, title: "Logo (color)" },
            },
        },
        defaultValue: DEFAULT_ITEMS,
    },
    columns: { type: ControlType.Number, title: "Columns", defaultValue: 3, min: 1, max: 4, step: 1, displayStepper: true },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 16, min: 0, max: 40, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 40, unit: "px" },
})
