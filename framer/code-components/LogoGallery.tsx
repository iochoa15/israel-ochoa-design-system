import { useEffect, useRef, useState, startTransition, type CSSProperties, type ReactNode } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { animate, motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion"

interface LogoItem {
    name: string
    description: string
    color: string
    logoWhite?: { src: string; alt?: string }
    logoColor?: { src: string; alt?: string }
}

type HoverStyle = "slide" | "blur" | "flood"
type Source = "custom" | "portfolio"
type LogoTone = "auto" | "white" | "ink"
type Entrance = "fly" | "dock"

interface LogoGalleryProps {
    items: LogoItem[]
    source: Source
    hover: HoverStyle
    cardColor: string
    logoTone: LogoTone
    logoSize: number
    entrance: Entrance
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

// Israel's real logos (Oct 10 2026). Made by framer/logo-gallery/process_logos.py from "web content/Logos":
// every logo is trimmed and balanced on the same 800x500 transparent canvas, in two versions:
// white = one-color knockout for the card, full = original colors for the hover.
// color = the card color, picked from the logo itself (deep enough for a white logo to read).
const PORTFOLIO: { name: string; description: string; color: string; white: string; full: string }[] = [
    { name: "DeSales Media", description: "Media company", color: "#3894D7", white: "https://framerusercontent.com/assets/J9c5VPYYsyK5IIbF4A9DblTgdfY.png", full: "https://framerusercontent.com/assets/oI6xfVusbDtp7PocS9aNfKKi1w8.png" },
    { name: "Lileva", description: "Apparel and fashion", color: "#9F8F46", white: "https://framerusercontent.com/assets/7Wdmzl7iTCvBsUelooEZOIOC0.png", full: "https://framerusercontent.com/assets/FWz8KqMIi6Ib1oFe6d2hTg6udIo.png" },
    { name: "Tagalong", description: "Education", color: "#ED1C24", white: "https://framerusercontent.com/assets/WnOWWU01N5HqsM8PMTRGYHAeMY.png", full: "https://framerusercontent.com/assets/mwQdZ2A1LbSMnp8fGvvaOTkJYwg.png" },
    { name: "Inmova", description: "Real estate", color: "#CF8216", white: "https://framerusercontent.com/assets/EB8aGOrkgAbO0xHw8OMgiURj8Lg.png", full: "https://framerusercontent.com/assets/AtW1nXtzH0A8r3UKUTGL07I8A8.png" },
    { name: "Play Academy", description: "Children's academy, pre-K", color: "#D12D73", white: "https://framerusercontent.com/assets/uMMxQilwfPUfxQ36o85me8Nq8a8.png", full: "https://framerusercontent.com/assets/B33UUW7lsC9J5AdtlFTiiVtno.png" },
    { name: "City Kitchen", description: "Food market, Times Square", color: "#1B1A18", white: "https://framerusercontent.com/assets/aUXUdR05ipZXV2F0HvK2QzxZWI.png", full: "https://framerusercontent.com/assets/3yS5g6jol3rLCddAZMVMkPVjc.png" },
    { name: "Dalcor Media", description: "Marketing and media company", color: "#009AD3", white: "https://framerusercontent.com/assets/92sVSBP2oGoWlrissgC2M7ktxuA.png", full: "https://framerusercontent.com/assets/UkHMRQsXQvWVK3wSzqkgEt62s.png" },
    { name: "U. Design Monterrey", description: "Design conference", color: "#1B1A18", white: "https://framerusercontent.com/assets/qiiq3b2dy8ytt40zU8aVIW6VG44.png", full: "https://framerusercontent.com/assets/kSv5W8iZkmjE9LLe4jDLRf0hYA.png" },
    { name: "First Look", description: "Venture company, NYC", color: "#31A86B", white: "https://framerusercontent.com/assets/6qWKpJB1n5xs9v8ada1iLWj3Bg.png", full: "https://framerusercontent.com/assets/JcWjr8VIjcJYheFnxUnleD0VKk.png" },
    { name: "Azteca Fight Club", description: "MMA academy", color: "#DF2022", white: "https://framerusercontent.com/assets/CJPjCmbILpsRm29ZKA4DwQnQoFM.png", full: "https://framerusercontent.com/assets/6vNbBAd0EuwhQybzpJZy0e40xAo.png" },
    { name: "Generations of Faith", description: "Fundraising campaign, Brooklyn", color: "#B28D42", white: "https://framerusercontent.com/assets/QmiwSGuvvYLYxpQlVKwA90JOw.png", full: "https://framerusercontent.com/assets/M4ZT3LAwK16mHyNOc6lqxPcio9g.png" },
    { name: "Portraits of Faith", description: "TV show", color: "#BA8C3F", white: "https://framerusercontent.com/assets/Ma6YaX3rIT6DGPwu8AAFUSDK28.png", full: "https://framerusercontent.com/assets/8w6ha9pPfFeDrr9h26TiaehJmOY.png" },
    { name: "Digital Democracy Bureau", description: "Digital", color: "#ED1942", white: "https://framerusercontent.com/assets/HMEmPbQUGRFGOd7ShOCcKOU6kUw.png", full: "https://framerusercontent.com/assets/nEprIiHhjz18FwLPKQIyh2wrHOk.png" },
    { name: "District", description: "Restaurant, New York", color: "#1B1A18", white: "https://framerusercontent.com/assets/TAkgm53fscnlN3sPwTIVlzXh95k.png", full: "https://framerusercontent.com/assets/0iZuT3Rf9OuVT8UN9wKCpoSKQ.png" },
    { name: "AMGW Agency", description: "Marketing agency", color: "#A52476", white: "https://framerusercontent.com/assets/ym0WCgvkk2FtkyaqOSQtnUtgc0.png", full: "https://framerusercontent.com/assets/DDUJACY6ShLy1kaU8hdxx9gKohI.png" },
    { name: "Kunming Mandarin", description: "Mandarin language school", color: "#6E9B31", white: "https://framerusercontent.com/assets/32ooVILjQZWJ716PP9n6uawbJE.png", full: "https://framerusercontent.com/assets/Zw9IJtJkDgxF7UvYJqnbZf3OlE.png" },
    { name: "Deep Clean", description: "Cleaning service", color: "#5B9E38", white: "https://framerusercontent.com/assets/LadXSFMfdF6KcB54dxAEJ91UVDw.png", full: "https://framerusercontent.com/assets/Fa5JDAyQxvKP5SPMq7Ta4MOpdU.png" },
    { name: "Fonovisa Records", description: "Music label", color: "#0079C2", white: "https://framerusercontent.com/assets/JLWWfiFt2eNl6k3spCJusgfyw.png", full: "https://framerusercontent.com/assets/j51zstlgZAGlUGd6RCBfJdCN9EY.png" },
    { name: "World Communications Day", description: "Media conference", color: "#D8731B", white: "https://framerusercontent.com/assets/9dTKHw3pwdXF6EAHO4elu5eHFMQ.png", full: "https://framerusercontent.com/assets/V7PKDHQGkH86VyPx22lIsRtBjM8.png" },
    { name: "Perfect Genlabs", description: "Health and performance", color: "#B08C06", white: "https://framerusercontent.com/assets/a3a7ETtJy6bvHsRizIpoaWCKFNk.png", full: "https://framerusercontent.com/assets/bzWQPHScHtftvHfx02CVxC1scxs.png" },
    { name: "Nautilus", description: "Hotel, Miami Beach", color: "#00719C", white: "https://framerusercontent.com/assets/zqbM8Cmt3TBN57mCNLz6GMfQ.png", full: "https://framerusercontent.com/assets/ISPv48Kc95lvoZpt9079TQVx0.png" },
    { name: "Alem Automotriz", description: "Automotive", color: "#026CA9", white: "https://framerusercontent.com/assets/0qlBUgXeQvgBWEiIel0JamerI.png", full: "https://framerusercontent.com/assets/pyY3d5dk9WfrzrVFE06IZYmvhM.png" },
    { name: "Movi Rad", description: "X-ray and medical imaging", color: "#1B1A18", white: "https://framerusercontent.com/assets/nUwvxWf1EP9pjoMmtemjaJzOw.png", full: "https://framerusercontent.com/assets/KCEUsEr2kOY2YgypITuKVcCxo.png" },
    { name: "JRC", description: "Construction", color: "#1B1A18", white: "https://framerusercontent.com/assets/uYIiECRiQjx4SCsxfLXxW4HNDg0.png", full: "https://framerusercontent.com/assets/33z5catlXK81NQKSdkPPXMjlk.png" },
    { name: "Sismedics", description: "Medical clinic", color: "#0E76BC", white: "https://framerusercontent.com/assets/JVwjL55sakW5zpxEFCsROgHVr98.png", full: "https://framerusercontent.com/assets/65LcjQFSexw1cz31yXQcXxyEc2o.png" },
    { name: "Hello World", description: "Media", color: "#ED1C24", white: "https://framerusercontent.com/assets/G3bgZBxofXXwWOt6ORq2OB4UY.png", full: "https://framerusercontent.com/assets/ZxrEzxnpHJJbT6qdYMGhBOaJQWs.png" },
    { name: "To Your Health", description: "Health", color: "#F04D4D", white: "https://framerusercontent.com/assets/3ZnuwSmlNP4eKoNCjsuUkVYMbU.png", full: "https://framerusercontent.com/assets/RIqvzLPnlANUxCh5qZzhqlrCEpU.png" },
    { name: "David Orsini Fitness", description: "Holistic health", color: "#ED1B2F", white: "https://framerusercontent.com/assets/0xJX0sxjpRdEVmOthbOQ5mf8.png", full: "https://framerusercontent.com/assets/PZS9N9BquIyTjGMhLwPRJZcBgQ.png" },
    { name: "Rikshow n the Ruckus", description: "Music band", color: "#ED2024", white: "https://framerusercontent.com/assets/PMJ7OFhsblHHLfNstJsVdQ8I16g.png", full: "https://framerusercontent.com/assets/f6VJ94FgHasNQgDkbmHYTvAX8.png" },
    { name: "Heal Good Food", description: "Healthy lifestyle", color: "#BD563D", white: "https://framerusercontent.com/assets/1zn4xw4XhYEpIxBMTaIHarnAM.png", full: "https://framerusercontent.com/assets/IDjkxm60lNL2a8Beu78DmbA1naw.png" },
    { name: "Carotiq", description: "Beauty product", color: "#FC5000", white: "https://framerusercontent.com/assets/HYC8CKvqPyNdxZpx7OprGMTpvzQ.png", full: "https://framerusercontent.com/assets/A7g0CrxTOVF8K7SQKZl6qT4uq0Y.png" },
    { name: "Organic for Us", description: "Organic food", color: "#33A042", white: "https://framerusercontent.com/assets/hGPxq1ICszLAzcyDT99KYSVulEI.png", full: "https://framerusercontent.com/assets/xvf9dyD3xfIrjY67R0rfKzTdTtE.png" },
    { name: "Mass Media & Mktg.", description: "Marketing", color: "#00A5A5", white: "https://framerusercontent.com/assets/NgG57os0bocysRuGhEXI0ETthuw.png", full: "https://framerusercontent.com/assets/glbFKnGItfFgwu9Z4hfE7zps.png" },
    { name: "WNYU 89.1 FM", description: "Radio station, NYC", color: "#1B1A18", white: "https://framerusercontent.com/assets/QPPaFWjy64bl6heSxqG6sFiCE.png", full: "https://framerusercontent.com/assets/juVwO5pLMyPt6FRYWGtLtQVoAiQ.png" },
    { name: "S&F Consulting", description: "Marketing consulting", color: "#C3841E", white: "https://framerusercontent.com/assets/vRqTZfcRAhulTJNeWXQUdsKq5Vk.png", full: "https://framerusercontent.com/assets/wH0sVXC2vgcGVamni3nW8bhci4.png" },
    { name: "Diario de un Inmigrante", description: "Latino podcast", color: "#15375F", white: "https://framerusercontent.com/assets/XxeXeLxJLFC8Dui0urm7PbIP7A.png", full: "https://framerusercontent.com/assets/JtkH7PCM1bV0Veeh7Wq4OnXC8.png" },
    { name: "Evoluzzionee", description: "Lifestyle coaching", color: "#2696B4", white: "https://framerusercontent.com/assets/cJXvFGIvTRNbc69fnb0WSaWNUMs.png", full: "https://framerusercontent.com/assets/8AeFbnZfKbSlC5xcbtKJbolBNw.png" },
    { name: "Media Management & Marketing", description: "Management", color: "#C4892E", white: "https://framerusercontent.com/assets/ycgvdxlP9ee0da25GBL4alL50s.png", full: "https://framerusercontent.com/assets/2NSvP4P8vgW9sdRLMROVfxX6bTc.png" },
    { name: "Generations of Faith (alt)", description: "Fundraising campaign, Brooklyn", color: "#2391C0", white: "https://framerusercontent.com/assets/nxwXHbpKGe56AMRDSZRk4L9pgo.png", full: "https://framerusercontent.com/assets/Rh9mYwD9E6q73Jwj0oyqvF4FOQ.png" },
]
const PORTFOLIO_ITEMS: LogoItem[] = PORTFOLIO.map((p) => ({
    name: p.name,
    description: p.description,
    color: p.color,
    logoWhite: { src: p.white, alt: p.name },
    logoColor: { src: p.full, alt: p.name },
}))

const HEIGHTS = [260, 340, 220, 300, 380, 240, 320, 280]
const EASE = [0.16, 1, 0.3, 1] as const

function Card(props: { item: LogoItem; index: number; col: number; row: number; height: number; radius: number; isStatic: boolean; fly: number; hoverStyle: HoverStyle; balanced: boolean; cardColor?: string; logoTone?: LogoTone; entrance?: Entrance; dir?: number }) {
    const { item, col, row, height, radius, isStatic, fly, hoverStyle, balanced, cardColor, logoTone = "auto", entrance = "fly", dir = 0 } = props
    const dock = entrance === "dock"
    const dark = logoTone === "ink" || (logoTone === "auto" && isLight(cardColor || item.color))
    const [hover, setHover] = useState(false)
    // Where the pointer entered/left the card, in % of the card (the color flood grows from / shrinks to here)
    const px = useMotionValue(50)
    const py = useMotionValue(50)
    const setPoint = (e: { clientX: number; clientY: number; currentTarget: Element }) => {
        const r = e.currentTarget.getBoundingClientRect()
        if (!r.width || (!e.clientX && !e.clientY)) return
        px.set(((e.clientX - r.left) / r.width) * 100)
        py.set(((e.clientY - r.top) / r.height) * 100)
    }
    const intro = row < 3 // the first rows fly in on load, the rest rise in as you scroll
    const fromX = [-350, 0, 350][col % 3] * fly

    const motionProps = isStatic || dock
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

    const button = (
        <motion.button
            type="button"
            aria-label={item.name}
            onMouseEnter={(e) => {
                setPoint(e)
                startTransition(() => setHover(true))
            }}
            onMouseLeave={(e) => {
                setPoint(e)
                startTransition(() => setHover(false))
            }}
            onClick={(e) => {
                setPoint(e)
                startTransition(() => setHover((h) => !h))
            }}
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
                background: cardColor || item.color,
                display: "block",
            }}
        >
            {hoverStyle === "flood" ? (
                <FloodFaces item={item} hover={hover} balanced={balanced} px={px} py={py} dark={dark} />
            ) : hoverStyle === "blur" ? (
                <BlurFaces item={item} hover={hover} balanced={balanced} dark={dark} />
            ) : (
                <>
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
                </>
            )}
        </motion.button>
    )
    return dock && !isStatic ? <DockShell dir={dir}>{button}</DockShell> : button
}

// Entrance "dock" (like the work room on the homepage): each card comes up from below the screen bigger, pushed
// out toward its side of the page (left column left, right column right) and a little blurred, as if it starts
// in front of the page. As you scroll it shrinks, sharpens and settles into its place. Scrolling up plays it back.
// 21i: the card settled over the bottom 20% of the screen (was 60%), which felt fast. 21j: middle ground, 40%:
// it starts as its top enters at the bottom edge and is in place when its top is 60% down the screen.
const DOCK_END = "start 0.6"
const DOCK_SCALE = 1.6 // starting size
const DOCK_X = 18 // vw pushed out to the side at the start
const DOCK_LIFT = 240 // px below its place at the start
const DOCK_BLUR = 7 // px blur at the start (21i: 10 -> 4; 21j: middle ground, 7)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

function DockShell(props: { dir: number; children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null)
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", DOCK_END] })
    const p = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.8 }) // softer than the room's, for smoothness
    const k = useTransform(p, (v) => (reduced ? 0 : 1 - easeOutCubic(clamp01(v))))
    const scale = useTransform(k, (v) => 1 + (DOCK_SCALE - 1) * v)
    const x = useTransform(k, (v) => `${(props.dir * DOCK_X * v).toFixed(2)}vw`)
    const y = useTransform(k, (v) => v * DOCK_LIFT)
    const filter = useTransform(k, (v) => (v < 0.01 ? "none" : `blur(${(v * DOCK_BLUR).toFixed(1)}px)`))
    return (
        <motion.div ref={ref} style={{ position: "relative", width: "100%", scale, x, y, filter, transformOrigin: "50% 50%" }}>
            {props.children}
        </motion.div>
    )
}

// Hover style "blur": the white knockout blurs away while the color logo comes into focus in the same spot,
// on a white card, then the name and line fade in. Hovering out plays it backwards.
// Round 21d: slower on an even ease, so the blur is visible instead of a jump. 21e: halved, 1.55s -> 0.78s. 21f: halved again -> 0.39s.
const BLUR = 16
const BLUR_EASE = { duration: 0.39, ease: [0.42, 0, 0.25, 1] as const }

/** True when a color is light enough that a white logo on it would not read. */
function isLight(color?: string) {
    if (!color) return false
    let r = 0, g = 0, b = 0
    const hex = /^#?([0-9a-f]{6})/i.exec(color)
    const rgb = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(color)
    if (hex) {
        const n = parseInt(hex[1], 16)
        r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255
    } else if (rgb) {
        r = +rgb[1]; g = +rgb[2]; b = +rgb[3]
    } else return false
    return 0.299 * r + 0.587 * g + 0.114 * b > 160
}

function LogoImage(props: { src?: string; alt: string; name: string; textColor: string; balanced: boolean; dark?: boolean }) {
    if (!props.src)
        return <span style={{ fontFamily: '"Wix Madefor Display", sans-serif', fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", color: props.dark ? "#111110" : props.textColor, textAlign: "center" }}>{props.name}</span>
    // dark: the white knockout turned ink-colored (for light cards), no extra files needed.
    const ink: CSSProperties = props.dark ? { filter: "brightness(0)", opacity: 0.86 } : {}
    // Balanced logos already carry their own padding on an 8:5 canvas, so they can fill the box.
    return props.balanced ? (
        <img src={props.src} alt={props.alt} draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", scale: "var(--logo-scale, 1)", ...ink }} />
    ) : (
        <img src={props.src} alt={props.alt} draggable={false} style={{ maxWidth: "62%", maxHeight: "46%", objectFit: "contain" }} />
    )
}

const logoBox = (balanced: boolean): CSSProperties =>
    balanced
        ? { position: "absolute", left: "8%", right: "8%", top: "10%", bottom: "22%", display: "flex", alignItems: "center", justifyContent: "center" }
        : { position: "absolute", inset: 0, bottom: "18%", display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }

/** One line under the logo on hover: the name in the sans, the category in the serif italic. */
function Caption(props: { item: LogoItem; hover: boolean; delay: number }) {
    const { item, hover, delay } = props
    return (
        <motion.div
            initial={false}
            animate={{ opacity: hover ? 1 : 0, y: hover ? 0 : 8 }}
            transition={{ duration: 0.4, delay: hover ? delay : 0, ease: EASE }}
            style={{ position: "absolute", left: 22, right: 22, bottom: 16, textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}
        >
            <span style={{ fontFamily: '"Wix Madefor Text", sans-serif', fontWeight: 600, fontSize: 15, color: "#111110" }}>{item.name}</span>
            {item.description ? (
                <span style={{ fontFamily: '"Newsreader", serif', fontStyle: "italic", fontWeight: 400, fontSize: 16, color: "#5E5D59", marginLeft: 8 }}>{item.description}</span>
            ) : null}
        </motion.div>
    )
}

function BlurFaces(props: { item: LogoItem; hover: boolean; balanced: boolean; dark?: boolean }) {
    const { item, hover, balanced, dark } = props
    const box = logoBox(balanced)
    return (
        <>
            {/* White card behind the color logo */}
            <motion.div initial={false} animate={{ opacity: hover ? 1 : 0 }} transition={BLUR_EASE} style={{ position: "absolute", inset: 0, background: "#FFFFFF" }} />
            {/* Front: one-color knockout on the card (white on dark cards, ink on light cards) */}
            <motion.div
                initial={false}
                animate={{ opacity: hover ? 0 : 1, filter: `blur(${hover ? BLUR : 0}px)`, scale: hover ? 1.04 : 1 }}
                transition={BLUR_EASE}
                style={box}
            >
                <LogoImage src={item.logoWhite?.src} alt={item.logoWhite?.alt || item.name} name={item.name} textColor="#fff" balanced={balanced} dark={dark} />
            </motion.div>
            {/* Back: the color logo, same spot */}
            <motion.div
                initial={false}
                animate={{ opacity: hover ? 1 : 0, filter: `blur(${hover ? 0 : BLUR}px)`, scale: hover ? 1 : 0.96 }}
                transition={BLUR_EASE}
                style={box}
            >
                <LogoImage src={item.logoColor?.src} alt={item.logoColor?.alt || item.name} name={item.name} textColor={item.color} balanced={balanced} />
            </motion.div>
            <Caption item={item} hover={hover} delay={0.22} />
        </>
    )
}

// Hover style "flood": the logo's own color floods the card from where the pointer comes in (a soft tint of
// it, so the color logo still reads), the color logo springs up into place, a light glint runs across it,
// then the caption fades in. Leaving pulls the flood back out toward where the pointer left.
function mixWithWhite(hex: string, amount: number) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "")
    if (!m) return "#FFFFFF"
    const n = parseInt(m[1], 16)
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(255 + (c - 255) * amount))
    return `rgb(${ch.join(",")})`
}

function Glint(props: { src: string; play: boolean }) {
    const mask = `url("${props.src}")`
    return (
        <motion.div
            initial={false}
            animate={{ backgroundPosition: props.play ? "-60% 0%" : "160% 0%" }}
            transition={props.play ? { duration: 1.1, delay: 0.5, ease: [0.4, 0, 0.2, 1] } : { duration: 0 }}
            style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                scale: "var(--logo-scale, 1)",
                backgroundImage: "linear-gradient(100deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 62%)",
                backgroundSize: "250% 100%",
                backgroundRepeat: "no-repeat",
                WebkitMaskImage: mask,
                maskImage: mask,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
            }}
        />
    )
}

function FloodFaces(props: { item: LogoItem; hover: boolean; balanced: boolean; px: MotionValue<number>; py: MotionValue<number>; dark?: boolean }) {
    const { item, hover, balanced, px, py, dark } = props
    const box = logoBox(balanced)
    const r = useMotionValue(0)
    useEffect(() => {
        const a = animate(r, hover ? 150 : 0, hover ? { duration: 0.75, ease: EASE } : { duration: 0.45, ease: [0.4, 0, 0.2, 1] })
        return () => a.stop()
    }, [hover])
    const clip = useMotionTemplate`circle(${r}% at ${px}% ${py}%)`
    return (
        <>
            {/* Rest: one-color knockout on the card color */}
            <div style={box}>
                <LogoImage src={item.logoWhite?.src} alt={item.logoWhite?.alt || item.name} name={item.name} textColor="#fff" balanced={balanced} dark={dark} />
            </div>
            {/* Hover: the logo's color floods in */}
            <motion.div style={{ position: "absolute", inset: 0, background: mixWithWhite(item.color, 0.12), clipPath: clip, WebkitClipPath: clip }}>
                <motion.div
                    initial={false}
                    animate={hover ? { opacity: 1, scale: 1, y: 0, rotate: 0, filter: "blur(0px)" } : { opacity: 0, scale: 0.86, y: 16, rotate: -4, filter: "blur(8px)" }}
                    transition={hover ? { type: "spring", stiffness: 260, damping: 15, delay: 0.12 } : { duration: 0.25 }}
                    style={box}
                >
                    <LogoImage src={item.logoColor?.src} alt={item.logoColor?.alt || item.name} name={item.name} textColor={item.color} balanced={balanced} />
                    {balanced && item.logoColor?.src ? <Glint src={item.logoColor.src} play={hover} /> : null}
                </motion.div>
                <Caption item={item} hover={hover} delay={0.3} />
            </motion.div>
        </>
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
 * Hover "Slide up": a white card slides up from the bottom. "Blur fade": the white logo blurs into the color one.
 * "Color flood": the logo's color floods in from the pointer and the color logo springs in with a glint.
 * Portfolio cards all share one "Card color" (default #D7D4CB, neutral-light 500, one step darker than the
 * "What I do" media color). "Logo at rest": white (default), ink, or auto (ink on light cards). Hover shows the real colors.
 * Logos "Portfolio": Israel's 57 real logos built in (see PORTFOLIO), instead of the list in the panel.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 3000
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 */
export default function LogoGallery(props: LogoGalleryProps) {
    const { items = DEFAULT_ITEMS, source = "custom", hover = "slide", cardColor = "#D7D4CB", logoTone = "white", logoSize = 120, entrance = "fly", columns = 3, gap = 16, radius = 20 } = props
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
    // Dock cards start pushed past the screen edges: clip sideways overflow (clip, not hidden, so sticky still works).
    useEffect(() => {
        if (entrance !== "dock" || isStatic || typeof document === "undefined") return
        const html = document.documentElement
        const prev = html.style.overflowX
        html.style.overflowX = "clip"
        return () => {
            html.style.overflowX = prev
        }
    }, [entrance, isStatic])
    const portfolio = source === "portfolio"
    const list = portfolio ? PORTFOLIO_ITEMS : (items && items.length ? items : DEFAULT_ITEMS).map((it, i) => ({ ...DEFAULT_ITEMS[i % DEFAULT_ITEMS.length], ...it }))
    const cols = width < 1000 ? 2 : Math.max(1, Math.min(4, columns))
    const colW = (width - gap * (cols - 1)) / cols
    const hScale = Math.max(0.55, Math.min(1.2, colW / 389))
    const fly = Math.max(0.35, Math.min(1, width / 1200))
    const buckets: { item: LogoItem; index: number }[][] = Array.from({ length: cols }, () => [])
    list.forEach((item, index) => buckets[index % cols].push({ item, index }))

    return (
        <div ref={ref} style={{ ...props.style, ["--logo-scale" as any]: portfolio ? logoSize / 100 : 1, position: "relative", width: "100%", display: "flex", gap, alignItems: "flex-start", paddingBottom: 200 }}>
            {buckets.map((bucket, c) => (
                <Column key={c} offset={c * 0.08} progress={scrollYProgress} gap={gap} isStatic={isStatic}>
                    {bucket.map(({ item, index }, r) => (
                        <Card key={index} item={item} index={index} col={c} row={r} height={Math.round(HEIGHTS[(index + c * 3) % HEIGHTS.length] * hScale)} radius={radius} isStatic={isStatic} fly={fly} hoverStyle={hover} balanced={portfolio} cardColor={portfolio ? cardColor : undefined} logoTone={portfolio ? logoTone : "white"} entrance={entrance} dir={cols > 1 ? (c / (cols - 1)) * 2 - 1 : 0} />
                    ))}
                </Column>
            ))}
        </div>
    )
}

addPropertyControls(LogoGallery, {
    source: {
        type: ControlType.Enum,
        title: "Logo set",
        options: ["custom", "portfolio"],
        optionTitles: ["List below", "Portfolio"],
        defaultValue: "custom",
        displaySegmentedControl: true,
    },
    hover: {
        type: ControlType.Enum,
        title: "Hover",
        options: ["slide", "blur", "flood"],
        optionTitles: ["Slide up", "Blur fade", "Color flood"],
        defaultValue: "slide",
        displaySegmentedControl: true,
    },
    cardColor: {
        type: ControlType.Color,
        title: "Card color",
        defaultValue: "#D7D4CB",
        hidden: (p: any) => p.source !== "portfolio",
    },
    logoSize: {
        type: ControlType.Number,
        title: "Logo size",
        defaultValue: 120,
        min: 60,
        max: 160,
        step: 5,
        unit: "%",
        hidden: (p: any) => p.source !== "portfolio",
    },
    logoTone: {
        type: ControlType.Enum,
        title: "Logo at rest",
        options: ["white", "ink", "auto"],
        optionTitles: ["White", "Ink", "Auto"],
        defaultValue: "white",
        displaySegmentedControl: true,
        hidden: (p: any) => p.source !== "portfolio",
    },
    items: {
        hidden: (p: any) => p.source === "portfolio",
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
    entrance: {
        type: ControlType.Enum,
        title: "Entrance",
        options: ["fly", "dock"],
        optionTitles: ["Fly in", "Dock (scroll)"],
        defaultValue: "fly",
        displaySegmentedControl: true,
    },
    columns: { type: ControlType.Number, title: "Columns", defaultValue: 3, min: 1, max: 4, step: 1, displayStepper: true },
    gap: { type: ControlType.Number, title: "Gap", defaultValue: 16, min: 0, max: 40, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 20, min: 0, max: 40, unit: "px" },
})
