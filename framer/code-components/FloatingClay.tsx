import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import {
    motion,
    useMotionValue,
    useScroll,
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
    tiltStrength: number
    stagger: number
    style?: CSSProperties
}

const DEFAULTS: ClayItem[] = [
    { image: { src: IMG("fMAYl6eSQce5mNu5WU4bnQrdhA"), alt: "Clay concha" }, x: 6, y: 6, size: 150, depth: 0.9, rotate: -8 },
    { image: { src: IMG("DFjCTNNntA2RH7XCit2i6qNu0h4"), alt: "Clay bottle" }, x: 88, y: 9, size: 70, depth: 1.3, rotate: 10 },
    { image: { src: IMG("MJDOVmTb4YxBuYJ9vbderDX2wo"), alt: "Clay statue" }, x: 87, y: 52, size: 86, depth: 0.6, rotate: -6 },
    { image: { src: IMG("Id0Y7CZYFQ3YOkCAeWn9fdqWrw"), alt: "Clay pencil" }, x: 8, y: 55, size: 56, depth: 1.1, rotate: -14 },
    { image: { src: IMG("eLdwIZmJqyF0i8rQnKn0TGWDEHI"), alt: "Clay taco" }, x: 3, y: 80, size: 96, depth: 0.45, rotate: 8 },
]

// On phones and tablets the text spans most of the width, so objects settle in the top and bottom bands.
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

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
// Hero timeline (see Reveal.tsx): avatar + name tag 0–0.41, first object 0.28–0.62, the rest from 0.42.
const LEAD_AT = 0.28
const REST_AT = 0.42
const MAX_RATE = 1 / 2.4 // the whole entrance never runs faster than ~2.4s, even when the intro snaps to the hero
const HERO_KEY = "__ioHeroPlayhead"
const HERO_EVENT = "io-hero-playhead"
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

function Clay(props: {
    item: ClayItem
    index: number
    count: number
    progress: MotionValue<number>
    mx: MotionValue<number>
    my: MotionValue<number>
    box: { w: number; h: number }
    mouseStrength: number
    tiltStrength: number
    stagger: number
    touch: boolean
    isStatic: boolean
    scale: number
}) {
    const { item, index, count, progress, mx, my, box, mouseStrength, tiltStrength, stagger, touch, isStatic, scale } = props
    const size = item.size * scale

    // Where it rests, and where it starts: bunched up near the middle of the hero (passionfroot.me style).
    const restX = (item.x / 100) * box.w + size / 2
    const restY = (item.y / 100) * box.h + size / 2
    const fromX = (box.w / 2 - restX) * 0.82
    const fromY = (box.h / 2 - restY) * 0.82
    const spin = index % 2 ? 12 : -12

    // Each object runs its own slice of the hero timeline: the first one (concha) right after the avatar and
    // name tag, the others together with the headline, one after another.
    const start = index === 0 ? LEAD_AT : REST_AT + (index - 1) * stagger
    const span = index === 0 ? 0.34 : Math.min(0.4, Math.max(0.2, 1 - (REST_AT + Math.max(0, count - 2) * stagger)))
    const local = useTransform(progress, (p) => clamp01((p - start) / span))
    const eased = useTransform(local, easeOut)
    const enterX = useTransform(eased, (e) => fromX * (1 - e))
    const enterY = useTransform(eased, (e) => fromY * (1 - e) + 12 * (1 - e))
    const enterScale = useTransform(eased, (e) => 0.55 + 0.45 * e)
    const enterRotate = useTransform(eased, (e) => item.rotate + spin * (1 - e))
    const opacity = useTransform(local, [0, 0.45], [0, 1])
    const filter = useTransform(eased, (e) => `blur(${(1 - e) * 6}px)`)

    // Mouse parallax: nearer objects (bigger depth) drift more, each on its own lazy spring.
    const spring = { stiffness: 40 + index * 6, damping: 14, mass: 1 + item.depth * 0.4 }
    const px = useSpring(useTransform(mx, (v) => v * 36 * item.depth * mouseStrength), spring)
    const py = useSpring(useTransform(my, (v) => v * 26 * item.depth * mouseStrength), spring)
    const x = useTransform([enterX, px] as MotionValue<number>[], ([a, b]: number[]) => a + b)
    const y = useTransform([enterY, py] as MotionValue<number>[], ([a, b]: number[]) => a + b)

    // Hover tilt: the object leans toward the cursor in 3D (a real 3D model can replace the image later).
    const tx = useMotionValue(0)
    const ty = useMotionValue(0)
    const rotY = useSpring(useTransform(tx, (v) => v * tiltStrength), { stiffness: 180, damping: 16 })
    const rotX = useSpring(useTransform(ty, (v) => -v * tiltStrength), { stiffness: 180, damping: 16 })

    function onMove(e: React.PointerEvent<HTMLDivElement>) {
        if (touch) return
        const r = e.currentTarget.getBoundingClientRect()
        tx.set((e.clientX - r.left) / r.width - 0.5)
        ty.set((e.clientY - r.top) / r.height - 0.5)
    }
    function onLeave() {
        tx.set(0)
        ty.set(0)
    }

    const floatDur = 4.2 + (index % 3) * 0.9 + item.depth
    const fallback = DEFAULTS[index % DEFAULTS.length].image!

    return (
        <motion.div
            style={{
                position: "absolute",
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: size,
                x: isStatic ? 0 : x,
                y: isStatic ? 0 : y,
                scale: isStatic ? 1 : enterScale,
                rotate: isStatic ? item.rotate : enterRotate,
                opacity: isStatic ? 1 : opacity,
                filter: isStatic ? "none" : filter,
                zIndex: Math.round(item.depth * 10),
                pointerEvents: "auto",
                willChange: "transform, opacity, filter",
            }}
        >
            <motion.div
                animate={isStatic ? undefined : { y: [0, -14, 0, 8, 0], rotate: [0, 3, 0, -3, 0] }}
                transition={{ duration: floatDur, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
                style={{ perspective: 600 }}
            >
                <motion.div
                    onPointerMove={onMove}
                    onPointerLeave={onLeave}
                    style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
                >
                    <motion.img
                        src={item.image?.src || fallback.src}
                        alt={item.image?.alt || fallback.alt || ""}
                        draggable={false}
                        drag={!isStatic}
                        dragSnapToOrigin
                        dragElastic={0.6}
                        dragTransition={{ bounceStiffness: 260, bounceDamping: 14 }}
                        whileHover={touch ? undefined : { scale: 1.1 }}
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
 * Floating clay objects. They start bunched in the middle of the section, then drift out to their spots,
 * one after another, as the section scrolls into view (and back in when you scroll up). Arriving straight
 * on the section plays the same move on its own. They follow the mouse, tilt toward the cursor and can be flung.
 * Place it absolutely over a section (fill the section).
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FloatingClay(props: FloatingClayProps) {
    const { items = DEFAULTS, mouseStrength = 1, tiltStrength = 26, stagger = 0.07 } = props
    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const mx = useMotionValue(0)
    const my = useMotionValue(0)
    const [box, setBox] = useState({ w: 1200, h: 800 })
    const [touch, setTouch] = useState(false)

    // Progress runs 0 → 1 while the section rises from the bottom of the screen to near the top.
    const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start 0.95", "start 0.1"] })
    // The playhead follows the scroll, capped at MAX_RATE, so a fast scroll or a jump still plays the whole
    // entrance in order. It is shared with the avatar, name tag, headline and 3D clay via window.
    const progress = useMotionValue(isStatic ? 1 : 0)
    const smooth = useSpring(progress, { stiffness: 110, damping: 24, mass: 0.6 })

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const w = window as any
        w[HERO_KEY] = smooth
        window.dispatchEvent(new CustomEvent(HERO_EVENT))
        let raf = 0
        let last = 0
        const tick = (now: number) => {
            raf = 0
            const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
            last = now
            const target = scrollYProgress.get()
            const cur = progress.get()
            const diff = target - cur
            if (Math.abs(diff) < 0.0005) {
                progress.set(target)
                last = 0
                return
            }
            progress.set(cur + Math.sign(diff) * Math.min(Math.abs(diff), MAX_RATE * dt))
            raf = window.requestAnimationFrame(tick)
        }
        const kick = () => {
            if (!raf) raf = window.requestAnimationFrame(tick)
        }
        kick()
        const unsub = scrollYProgress.on("change", kick)
        return () => {
            unsub()
            if (raf) window.cancelAnimationFrame(raf)
            if (w[HERO_KEY] === smooth) delete w[HERO_KEY]
        }
    }, [isStatic])

    useEffect(() => {
        if (typeof window === "undefined") return
        startTransition(() => setTouch(window.matchMedia("(hover: none), (pointer: coarse)").matches))
        const el = rootRef.current
        if (!el || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (r && r.width && r.height) startTransition(() => setBox({ w: r.width, h: r.height }))
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        // Touch screens have no cursor: keep the drift-out, float and drag, skip mouse-follow and tilt.
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
            })
        }
        window.addEventListener("pointermove", onMove, { passive: true })
        return () => {
            window.removeEventListener("pointermove", onMove)
            if (frame) window.cancelAnimationFrame(frame)
        }
    }, [isStatic, touch])

    const bands = box.w < 640 ? PHONE_POS : box.w < 1000 ? TABLET_POS : null
    const baseList = items && items.length ? items : DEFAULTS
    const list = bands ? baseList.map((it, i) => ({ ...it, ...bands[i % bands.length] })) : baseList
    const scale = Math.max(0.5, Math.min(1, box.w / 1200))

    return (
        <div ref={rootRef} style={{ ...props.style, position: "relative", width: "100%", height: "100%", pointerEvents: "none" }}>
            {list.map((item, i) => (
                <Clay
                    key={i}
                    item={item}
                    index={i}
                    count={list.length}
                    progress={isStatic ? progress : smooth}
                    mx={mx}
                    my={my}
                    box={box}
                    mouseStrength={mouseStrength}
                    tiltStrength={tiltStrength}
                    stagger={stagger}
                    touch={touch}
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
    tiltStrength: { type: ControlType.Number, title: "Hover tilt", defaultValue: 26, min: 0, max: 45, unit: "°" },
    stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 0.07, min: 0, max: 0.15, step: 0.01 },
})
