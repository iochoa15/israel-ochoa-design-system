import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import {
    motion,
    useInView,
    useMotionValue,
    useSpring,
    useTransform,
    type MotionValue,
} from "framer-motion"

const IMG = (id: string) => `https://framerusercontent.com/images/${id}.png`

interface ClayItem {
    image?: { src: string; alt?: string }
    x: number // % from left
    y: number // % from top
    size: number // px width
    depth: number // 0.2 (far) – 1.5 (near): how much it follows the mouse
    rotate: number // resting tilt in degrees
}

interface FloatingClayProps {
    items: ClayItem[]
    mouseStrength: number
    repelRadius: number
    style?: CSSProperties
}

const DEFAULTS: ClayItem[] = [
    { image: { src: IMG("fMAYl6eSQce5mNu5WU4bnQrdhA"), alt: "Clay concha" }, x: 6, y: 6, size: 150, depth: 0.9, rotate: -8 },
    { image: { src: IMG("DFjCTNNntA2RH7XCit2i6qNu0h4"), alt: "Clay bottle" }, x: 88, y: 9, size: 70, depth: 1.3, rotate: 10 },
    { image: { src: IMG("MJDOVmTb4YxBuYJ9vbderDX2wo"), alt: "Clay statue" }, x: 87, y: 52, size: 86, depth: 0.6, rotate: -6 },
    { image: { src: IMG("Id0Y7CZYFQ3YOkCAeWn9fdqWrw"), alt: "Clay pencil" }, x: 8, y: 55, size: 56, depth: 1.1, rotate: -14 },
    { image: { src: IMG("eLdwIZmJqyF0i8rQnKn0TGWDEHI"), alt: "Clay taco" }, x: 3, y: 80, size: 96, depth: 0.45, rotate: 8 },
]

function Clay(props: {
    item: ClayItem
    index: number
    mx: MotionValue<number>
    my: MotionValue<number>
    pointer: MotionValue<{ x: number; y: number }>
    mouseStrength: number
    repelRadius: number
    visible: boolean
    isStatic: boolean
    scale: number
}) {
    const { item, index, mx, my, pointer, mouseStrength, repelRadius, visible, isStatic, scale } = props
    const ref = useRef<HTMLDivElement>(null)

    // Parallax: nearer objects (bigger depth) move more, each on its own lazy spring.
    const spring = { stiffness: 40 + index * 6, damping: 14, mass: 1 + item.depth * 0.4 }
    const px = useSpring(useTransform(mx, (v) => v * 36 * item.depth * mouseStrength), spring)
    const py = useSpring(useTransform(my, (v) => v * 26 * item.depth * mouseStrength), spring)

    // Repel: the cursor gently pushes nearby objects away.
    const rx = useMotionValue(0)
    const ry = useMotionValue(0)
    const srx = useSpring(rx, { stiffness: 120, damping: 12 })
    const sry = useSpring(ry, { stiffness: 120, damping: 12 })
    useEffect(() => {
        if (isStatic) return
        return pointer.on("change", (p) => {
            const el = ref.current
            if (!el) return
            const r = el.getBoundingClientRect()
            const dx = r.left + r.width / 2 - p.x
            const dy = r.top + r.height / 2 - p.y
            const d = Math.hypot(dx, dy)
            if (d < repelRadius && d > 0.01) {
                const f = (1 - d / repelRadius) * 46
                rx.set((dx / d) * f)
                ry.set((dy / d) * f)
            } else {
                rx.set(0)
                ry.set(0)
            }
        })
    }, [pointer, repelRadius, isStatic])

    const x = useTransform([px, srx] as MotionValue<number>[], ([a, b]: number[]) => a + b)
    const y = useTransform([py, sry] as MotionValue<number>[], ([a, b]: number[]) => a + b)

    const floatDur = 4.2 + (index % 3) * 0.9 + item.depth

    return (
        <motion.div
            ref={ref}
            style={{
                position: "absolute",
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: item.size * scale,
                x: isStatic ? 0 : x,
                y: isStatic ? 0 : y,
                zIndex: Math.round(item.depth * 10),
                pointerEvents: "auto",
            }}
        >
            <motion.div
                initial={isStatic ? false : { opacity: 0, scale: 0.2, rotate: item.rotate - 40 }}
                animate={visible || isStatic ? { opacity: 1, scale: 1, rotate: item.rotate } : undefined}
                transition={{ type: "spring", stiffness: 220, damping: 13, mass: 0.8, delay: 0.25 + index * 0.12 }}
            >
                <motion.div
                    animate={isStatic ? undefined : { y: [0, -14, 0, 8, 0], rotate: [0, 3, 0, -3, 0] }}
                    transition={{ duration: floatDur, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
                >
                    <motion.img
                        src={item.image?.src || DEFAULTS[index % DEFAULTS.length].image!.src}
                        alt={item.image?.alt || DEFAULTS[index % DEFAULTS.length].image!.alt || ""}
                        draggable={false}
                        drag={!isStatic}
                        dragSnapToOrigin
                        dragElastic={0.6}
                        dragTransition={{ bounceStiffness: 260, bounceDamping: 14 }}
                        whileHover={{ scale: 1.1, rotate: item.rotate > 0 ? -6 : 6 }}
                        whileDrag={{ scale: 1.18, cursor: "grabbing" }}
                        transition={{ type: "spring", stiffness: 300, damping: 16 }}
                        style={{ width: "100%", height: "auto", display: "block", cursor: "grab", userSelect: "none", touchAction: "none" }}
                    />
                </motion.div>
            </motion.div>
        </motion.div>
    )
}

/**
 * Floating clay objects: they pop in, drift, follow the mouse at different depths, dodge the cursor and can be flung.
 * Place it absolutely over a section (fill the section).
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FloatingClay(props: FloatingClayProps) {
    const { items = DEFAULTS, mouseStrength = 1, repelRadius = 220 } = props
    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const visible = useInView(rootRef, { once: true, amount: 0.2 })
    const mx = useMotionValue(0)
    const my = useMotionValue(0)
    const pointer = useMotionValue({ x: -9999, y: -9999 })
    const [vw, setVw] = useState(1200)
    const [touch, setTouch] = useState(false)

    useEffect(() => {
        if (typeof window === "undefined") return
        startTransition(() => setTouch(window.matchMedia("(hover: none), (pointer: coarse)").matches))
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width
            if (w) startTransition(() => setVw(w))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        // Touch screens have no cursor: keep the pop-in, float and drag, skip mouse-follow and dodge.
        if (isStatic || touch || typeof window === "undefined") return
        let frame = 0
        let last = { x: 0, y: 0 }
        function onMove(e: PointerEvent) {
            last = { x: e.clientX, y: e.clientY }
            if (frame) return
            frame = window.requestAnimationFrame(() => {
                frame = 0
                mx.set((last.x / window.innerWidth) * 2 - 1)
                my.set((last.y / window.innerHeight) * 2 - 1)
                pointer.set(last)
            })
        }
        window.addEventListener("pointermove", onMove, { passive: true })
        return () => {
            window.removeEventListener("pointermove", onMove)
            if (frame) window.cancelAnimationFrame(frame)
        }
    }, [isStatic, touch])

    // On phones and tablets the text spans most of the width, so objects move to the top and bottom bands.
    const PHONE_POS = [
        { x: 4, y: 4 },
        { x: 80, y: 5 },
        { x: 76, y: 84 },
        { x: 6, y: 86 },
        { x: 44, y: 90 },
        { x: 60, y: 3 },
    ]
    const TABLET_POS = [
        { x: 6, y: 8 },
        { x: 86, y: 10 },
        { x: 80, y: 78 },
        { x: 10, y: 80 },
        { x: 48, y: 88 },
        { x: 58, y: 6 },
    ]
    const bands = vw < 640 ? PHONE_POS : vw < 1000 ? TABLET_POS : null
    const baseList = items && items.length ? items : DEFAULTS
    const list = bands ? baseList.map((it, i) => ({ ...it, ...bands[i % bands.length] })) : baseList
    const scale = Math.max(0.5, Math.min(1, vw / 1200))

    return (
        <div ref={rootRef} style={{ ...props.style, position: "relative", width: "100%", height: "100%", pointerEvents: "none" }}>
            {list.map((item, i) => (
                <Clay
                    key={i}
                    item={item}
                    index={i}
                    mx={mx}
                    my={my}
                    pointer={pointer}
                    mouseStrength={mouseStrength}
                    repelRadius={repelRadius}
                    visible={visible}
                    isStatic={isStatic}
                    scale={scale}
                />
            ))}
        </div>
    )
}

addPropertyControls(FloatingClay, {
    items: {
        type: ControlType.Array,
        title: "Objects",
        control: {
            type: ControlType.Object,
            controls: {
                image: { type: ControlType.ResponsiveImage, title: "Image" },
                x: { type: ControlType.Number, title: "X %", defaultValue: 10, min: 0, max: 100 },
                y: { type: ControlType.Number, title: "Y %", defaultValue: 10, min: 0, max: 100 },
                size: { type: ControlType.Number, title: "Size", defaultValue: 100, min: 30, max: 400, unit: "px" },
                depth: { type: ControlType.Number, title: "Depth", defaultValue: 1, min: 0.2, max: 1.5, step: 0.05 },
                rotate: { type: ControlType.Number, title: "Tilt", defaultValue: 0, min: -45, max: 45, unit: "°" },
            },
        },
        defaultValue: DEFAULTS,
    },
    mouseStrength: { type: ControlType.Number, title: "Mouse follow", defaultValue: 1, min: 0, max: 2, step: 0.05 },
    repelRadius: { type: ControlType.Number, title: "Dodge radius", defaultValue: 220, min: 0, max: 400, unit: "px" },
})
