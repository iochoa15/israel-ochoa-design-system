import { lazy, Suspense, useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
// The live 3D engine (three.js, ~600 KB) only downloads when live 3D is used; the flipbook never loads it.
const Clay3D = lazy(() => import("./Clay3D.tsx"))
import {
    animate,
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    type AnimationPlaybackControls,
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
    use3D: boolean
    flipbook: boolean
    mouseStrength: number
    tiltStrength: number
    stagger: number
    style?: CSSProperties
}

// The 19 clay objects as light 3D files (3d/models-v2/08_web), with their flat image shown while loading.
// In 3D mode every visit picks a different handful at random (never the same set as the last visit).
const POOL_3D = [
    { model: "https://framerusercontent.com/assets/WmyKVQMrlYKehZGW0yu08tjw.glb", poster: "https://framerusercontent.com/images/CIaDHs03xx80z7e3aJyfJhnPVE.webp", alt: "Clay beer bottle", sheet: "https://framerusercontent.com/assets/VInEGch1fZhOrkN4fSmBIpxdoc.webp" },
    { model: "https://framerusercontent.com/assets/p0o9ZcRxw9q3bRp0duS1dBZOxM.glb", poster: "https://framerusercontent.com/images/GZ7ltRMxOLG1Dl2fB7LdYIujjg.webp", alt: "Clay concha", sheet: "https://framerusercontent.com/assets/pp0mSZVJCgSpWb01REy03XKzE.webp" },
    { model: "https://framerusercontent.com/assets/xo9P8EvV0x4MInqwoQuegTOSptQ.glb", poster: "https://framerusercontent.com/images/IJ4v1DFwdMVVWv6GBbPgtLA3fs.webp", alt: "Clay taco", sheet: "https://framerusercontent.com/assets/7x1XQ8vEXH8zEBeyN6JNapbNg.webp" },
    { model: "https://framerusercontent.com/assets/zj0Zdro8FXeddgjvgPghD4fvb4.glb", poster: "https://framerusercontent.com/images/uv1gEP7i6lDXaHnBjwoAqSPbJk.webp", alt: "Clay A train coin", sheet: "https://framerusercontent.com/assets/1031HSPynBqDX6SVAPXaony8blQ.webp" },
    { model: "https://framerusercontent.com/assets/ywhYTmZDpmhXCl1G63gdlyIEc.glb", poster: "https://framerusercontent.com/images/G7kUeulTgMVDgL0KdpIJzyhrL8.webp", alt: "Clay Statue of Liberty", sheet: "https://framerusercontent.com/assets/5AVCXTqISWNlEhcEKRDg12FSM.webp" },
    { model: "https://framerusercontent.com/assets/egfDwr2a4y3fTTgVKVbT5aGQvQk.glb", poster: "https://framerusercontent.com/images/oJWOzjsoIpt7JLejqzl4I1WbAp4.webp", alt: "Clay pizza", sheet: "https://framerusercontent.com/assets/rmlFneFrFwq7fsPKTavXHuPqAU.webp" },
    { model: "https://framerusercontent.com/assets/xYhloYCS3SYicMkl6CK1Ueqr8.glb", poster: "https://framerusercontent.com/images/SeSrl7KlX1bsHnal18ztjJKT2I.webp", alt: "Clay Evangelion", sheet: "https://framerusercontent.com/assets/eDrfyT9BfCRqEb5Qjzh8w2sks.webp" },
    { model: "https://framerusercontent.com/assets/efr8E4iuRW5s6WUHqrma9voVJg.glb", poster: "https://framerusercontent.com/images/3qXZMDiMk9rlAQv1OMEB0WXDjJc.webp", alt: "Clay Dragon Ball", sheet: "https://framerusercontent.com/assets/Sb7FAqQSbYKsxFbxdkIrup43wg.webp" },
    { model: "https://framerusercontent.com/assets/ZOLjOGf3Y7UQTfBQt5hBklMOs.glb", poster: "https://framerusercontent.com/images/HtuqR8xeYER3wxXjwFxPw4tBFU.webp", alt: "Clay moon wand", sheet: "https://framerusercontent.com/assets/iZDTvcG77lOM45kIoIwDceWYZ10.webp" },
    { model: "https://framerusercontent.com/assets/u1XFm11a9eJCPnWl2c4vprMJD7c.glb", poster: "https://framerusercontent.com/images/gYfvYKJ3gfPKK27NtQSYThTxU.webp", alt: "Clay dumbbell", sheet: "https://framerusercontent.com/assets/nr98BUCTuKYBLRSMCECoEZ17v0.webp" },
    { model: "https://framerusercontent.com/assets/MPraey4teeVZTqiMaOTR2yRcwE.glb", poster: "https://framerusercontent.com/images/qeREjdnZusv1jJ0oSFtoLMPbo.webp", alt: "Clay kettlebell", sheet: "https://framerusercontent.com/assets/7FImc1exHlFhxxpPvzNfo6SWKnQ.webp" },
    { model: "https://framerusercontent.com/assets/AEJrEQWod7WDh2FuXpx6z3Ntbc.glb", poster: "https://framerusercontent.com/images/x4GWujFlQHQEfLyxTiGDEtRLZwk.webp", alt: "Clay boxing glove", sheet: "https://framerusercontent.com/assets/YUs7A9GyrFMgjtsRlqHZzuW62wo.webp" },
    { model: "https://framerusercontent.com/assets/1L9NJv9uuM1udPQLBhHIbqTTPLo.glb", poster: "https://framerusercontent.com/images/qtSEzW2E7DYzsmtfe0FBZvFKWs.webp", alt: "Clay Virgin of Guadalupe", sheet: "https://framerusercontent.com/assets/EwJDW75GmFKXMy55vSbNaJx7TA.webp" },
    { model: "https://framerusercontent.com/assets/chn8vm3r8CxSFRpRwI8eIKOfgFQ.glb", poster: "https://framerusercontent.com/images/sxQHvbBGfY9UcjdXmi1CX2jHQ.webp", alt: "Clay candy skull", sheet: "https://framerusercontent.com/assets/3LxDWind6jrGIFPU80aBBsUOI.webp" },
    { model: "https://framerusercontent.com/assets/wPLYS1kSy7trvfxXq0lIDUqrTM.glb", poster: "https://framerusercontent.com/images/0g742sol6L6HsgEQmligfq2U9M.webp", alt: "Clay rainbow", sheet: "https://framerusercontent.com/assets/hcB52ZqtPEaAZhs7ZjepEpaFyyE.webp" },
    { model: "https://framerusercontent.com/assets/u3zUaDh8niPfjxB1CwVQatqcQE.glb", poster: "https://framerusercontent.com/images/v7fipW588JL1LkhpHEdoty4uY0.webp", alt: "Clay pencil", sheet: "https://framerusercontent.com/assets/JNwFNilWsIkTSa98qv2RjpdsY.webp" },
    { model: "https://framerusercontent.com/assets/wx78233jS6noNu3BtpSKUfe6vPA.glb", poster: "https://framerusercontent.com/images/iVKYYLqi1hkFx0P1HlIMdIKY1c.webp", alt: "Clay Rubik's cube", sheet: "https://framerusercontent.com/assets/AiodxV315bZ46mjeS6xStdHnfI.webp" },
    { model: "https://framerusercontent.com/assets/GHWMEouP7Si1ngCQhuzWJUDsyhw.glb", poster: "https://framerusercontent.com/images/nbMQ99PO7AG3oA1Sv5mmlCAow.webp", alt: "Clay Lego bricks", sheet: "https://framerusercontent.com/assets/hTa2UWNLmwjjG8U2qtObIpZorTM.webp" },
    { model: "https://framerusercontent.com/assets/DBrwYZbyWBymhtFep5xqijiXwac.glb", poster: "https://framerusercontent.com/images/Blz4Fx2sAbMdmRjOoMVsqLE67I.webp", alt: "Clay matryoshka doll", sheet: "https://framerusercontent.com/assets/aA0HHCGciz9Ah84wwV6QVgN68o.webp" },
]
const LAST_KEY = "io-hero-clay-last"

function pickRandom(count: number): number[] {
    let last: number[] = []
    try {
        last = JSON.parse(window.sessionStorage.getItem(LAST_KEY) || "[]")
    } catch (e) {}
    const shuffle = (arr: number[]) => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
        }
        return arr
    }
    // Objects not shown last visit come first, then the rest fill in.
    const all = POOL_3D.map((_, i) => i)
    const pool = [...shuffle(all.filter((i) => !last.includes(i))), ...shuffle(all.filter((i) => last.includes(i)))]
    const picks = pool.slice(0, count)
    try {
        window.sessionStorage.setItem(LAST_KEY, JSON.stringify(picks))
    } catch (e) {}
    return picks
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

// 3D mode: 12 objects in mixed sizes around the edges of the hero (the middle stays clear for the text).
// x / y are % of the hero, size in px at 1200 wide; depth = how much it follows the mouse.
type Spot = { x: number; y: number; size: number; depth: number; rotate: number }
const LAYOUT_3D: { desktop: Spot[]; tablet: Spot[]; phone: Spot[] } = {
    desktop: [
        { x: 3, y: 5, size: 132, depth: 0.9, rotate: -8 },
        { x: 21, y: 2, size: 66, depth: 1.3, rotate: 10 },
        { x: 69, y: 3, size: 78, depth: 0.6, rotate: -6 },
        { x: 86, y: 7, size: 118, depth: 1.1, rotate: 8 },
        { x: 1, y: 38, size: 88, depth: 0.5, rotate: 6 },
        { x: 90, y: 37, size: 96, depth: 1.2, rotate: -10 },
        { x: 8, y: 66, size: 70, depth: 1.4, rotate: -12 },
        { x: 85, y: 68, size: 84, depth: 0.7, rotate: 12 },
        { x: 22, y: 84, size: 104, depth: 0.8, rotate: 4 },
        { x: 66, y: 86, size: 112, depth: 1.0, rotate: -4 },
        { x: 42, y: 1, size: 60, depth: 1.2, rotate: -6 },
        { x: 45, y: 91, size: 72, depth: 0.9, rotate: 8 },
    ],
    tablet: [
        { x: 3, y: 4, size: 120, depth: 0.9, rotate: -8 },
        { x: 30, y: 2, size: 64, depth: 1.3, rotate: 10 },
        { x: 58, y: 3, size: 72, depth: 0.6, rotate: -6 },
        { x: 82, y: 5, size: 110, depth: 1.1, rotate: 8 },
        { x: 2, y: 30, size: 76, depth: 0.5, rotate: 6 },
        { x: 86, y: 32, size: 80, depth: 1.2, rotate: -10 },
        { x: 4, y: 80, size: 90, depth: 1.4, rotate: -12 },
        { x: 30, y: 88, size: 70, depth: 0.7, rotate: 12 },
        { x: 56, y: 87, size: 86, depth: 0.8, rotate: 4 },
        { x: 82, y: 80, size: 104, depth: 1.0, rotate: -4 },
        { x: 44, y: 1, size: 58, depth: 1.2, rotate: -6 },
        { x: 90, y: 56, size: 66, depth: 0.9, rotate: 8 },
    ],
    phone: [
        { x: 2, y: 2, size: 120, depth: 0.9, rotate: -8 },
        { x: 30, y: 1, size: 76, depth: 1.3, rotate: 10 },
        { x: 52, y: 3, size: 88, depth: 0.6, rotate: -6 },
        { x: 76, y: 2, size: 110, depth: 1.1, rotate: 8 },
        { x: 84, y: 14, size: 70, depth: 0.5, rotate: 6 },
        { x: 2, y: 84, size: 100, depth: 1.2, rotate: -10 },
        { x: 26, y: 90, size: 72, depth: 1.4, rotate: -12 },
        { x: 48, y: 86, size: 96, depth: 0.7, rotate: 12 },
        { x: 74, y: 88, size: 112, depth: 0.8, rotate: 4 },
        { x: 4, y: 14, size: 66, depth: 1.0, rotate: -4 },
        { x: 40, y: 12, size: 60, depth: 1.2, rotate: -6 },
        { x: 62, y: 80, size: 64, depth: 0.9, rotate: 8 },
    ],
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
// Hero timeline (see Reveal.tsx), tightened Oct 9: avatar + name tag 0–0.30, first object 0.10–0.38,
// headline from 0.16, the rest of the clay from 0.18, subtitle 0.24–0.52. Everything is in by ~0.55.
const LEAD_AT = 0.1
const REST_AT = 0.18
const PLAY_TIME = 1.3 // seconds for the whole hero after the avatar
const AFTER_AVATAR = 0.3 // the rest waits this long after the avatar starts popping
const HERO_KEY = "__ioHeroPlayhead"
const HERO_EVENT = "io-hero-playhead"
const GATE_KEY = "__ioHeroGate"
const GATE_EVENT = "io-hero-gate"
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

// Flipbook version of a 3D object: one image holding 72 photos of the model (24 turns × 3 tilts, shot with the
// website's exact 3D lights, see 3d/models-v2/scripts/web_preview/sprite.html). It shows the photo for the
// current angle: turns toward the cursor, spins when dragged (and coasts), grows a little on hover.
// No 3D engine: just moving a background image, so it's light and works the same on phones.
const SHEET = { cols: 24, pitches: [10, 30, 50], restYaw: -20, restPitch: 30 }
function ClaySprite(props: { sheet: string; alt: string; touch: boolean }) {
    const { sheet, alt, touch } = props
    const ref = useRef<HTMLDivElement>(null)
    const rows = SHEET.pitches.length
    useEffect(() => {
        const el = ref.current
        if (!el || typeof window === "undefined") return
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        let lookX = 0
        let lookY = 0
        let hover = false
        let dragging = false
        let lastX = 0
        let lastT = 0
        let spin = 0 // degrees
        let spinVel = 0
        let yaw = SHEET.restYaw
        let pitch = SHEET.restPitch
        let scale = 1
        let t = 0
        let last = performance.now()
        let raf = 0
        let shown = ""
        let onScreen = true
        const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt))

        const onPointer = (e: PointerEvent) => {
            if (touch) return
            const r = el.getBoundingClientRect()
            lookX = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)))
            lookY = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)))
        }
        const onDown = (e: PointerEvent) => {
            dragging = true
            lastX = e.clientX
            lastT = performance.now()
            spinVel = 0
            el.setPointerCapture(e.pointerId)
        }
        const onDrag = (e: PointerEvent) => {
            if (!dragging) return
            const now = performance.now()
            const dx = e.clientX - lastX
            spin += dx * 0.7
            spinVel = (dx * 0.7) / (Math.max(1, now - lastT) / 1000)
            lastX = e.clientX
            lastT = now
        }
        const onUp = (e: PointerEvent) => {
            dragging = false
            try {
                el.releasePointerCapture(e.pointerId)
            } catch (err) {}
        }
        const onEnter = () => (hover = true)
        const onLeave = () => (hover = false)

        const frame = (now: number) => {
            raf = 0
            if (!onScreen) return
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            t += dt
            if (!dragging) {
                spin += spinVel * dt
                spinVel *= Math.exp(-dt * 3.2)
                if (Math.abs(spinVel) < 25) spin = damp(spin, 0, 1.6, dt)
            }
            const idle = touch && !reduced ? Math.sin(t * 0.55) * 20 : 0
            yaw = damp(yaw, SHEET.restYaw + lookX * 37 + idle + spin, dragging ? 30 : 6, dt)
            pitch = damp(pitch, SHEET.restPitch + lookY * 22, 6, dt)
            scale = damp(scale, hover || dragging ? 1.08 : 1, 9, dt)
            const step = 360 / SHEET.cols
            const col = (((Math.round(yaw / step) % SHEET.cols) + SHEET.cols) % SHEET.cols)
            let row = 0
            SHEET.pitches.forEach((p, i) => {
                if (Math.abs(p - pitch) < Math.abs(SHEET.pitches[row] - pitch)) row = i
            })
            const pos = `${(col / (SHEET.cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`
            if (pos !== shown) {
                el.style.backgroundPosition = pos
                shown = pos
            }
            el.style.transform = `scale(${scale.toFixed(3)})`
            raf = requestAnimationFrame(frame)
        }
        const io = new IntersectionObserver((entries) => {
            onScreen = entries[0]?.isIntersecting ?? true
            if (onScreen && !raf) {
                last = performance.now()
                raf = requestAnimationFrame(frame)
            }
        })
        io.observe(el)
        window.addEventListener("pointermove", onPointer, { passive: true })
        el.addEventListener("pointerdown", onDown)
        el.addEventListener("pointermove", onDrag)
        el.addEventListener("pointerup", onUp)
        el.addEventListener("pointercancel", onUp)
        el.addEventListener("pointerenter", onEnter)
        el.addEventListener("pointerleave", onLeave)
        raf = requestAnimationFrame(frame)
        return () => {
            if (raf) cancelAnimationFrame(raf)
            io.disconnect()
            window.removeEventListener("pointermove", onPointer)
            el.removeEventListener("pointerdown", onDown)
            el.removeEventListener("pointermove", onDrag)
            el.removeEventListener("pointerup", onUp)
            el.removeEventListener("pointercancel", onUp)
            el.removeEventListener("pointerenter", onEnter)
            el.removeEventListener("pointerleave", onLeave)
        }
    }, [sheet, touch])
    const startCol = (((Math.round(SHEET.restYaw / (360 / SHEET.cols)) % SHEET.cols) + SHEET.cols) % SHEET.cols)
    return (
        <div
            ref={ref}
            role="img"
            aria-label={alt}
            style={{
                width: "100%",
                height: "100%",
                backgroundImage: `url("${sheet}")`,
                backgroundSize: `${SHEET.cols * 100}% ${rows * 100}%`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: `${(startCol / (SHEET.cols - 1)) * 100}% 50%`,
                cursor: "grab",
                touchAction: "pan-y",
                userSelect: "none",
            }}
        />
    )
}

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
    model?: { model: string; poster: string; alt: string; sheet: string }
    flipbook: boolean
}) {
    const { item, index, count, progress, mx, my, box, mouseStrength, tiltStrength, stagger, touch, isStatic, scale, model, flipbook } = props
    // 3D objects get a slightly bigger box: the model is framed with some air around it.
    const size = item.size * scale * (model ? 1.45 : 1)

    // Where it rests, and where it starts: bunched up near the middle of the hero (passionfroot.me style).
    const restX = (item.x / 100) * box.w + size / 2
    const restY = (item.y / 100) * box.h + size / 2
    const fromX = (box.w / 2 - restX) * 0.82
    const fromY = (box.h / 2 - restY) * 0.82
    const spin = index % 2 ? 12 : -12

    // Each object runs its own slice of the hero timeline: the first one (concha) right after the avatar and
    // name tag, the others together with the headline, one after another.
    const start = index === 0 ? LEAD_AT : REST_AT + (index - 1) * stagger
    const span = index === 0 ? 0.28 : 0.3
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

    const selfRef = useRef<HTMLDivElement>(null)

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

    // Each object wanders on its own loose loop (side to side and up and down on different clocks), so they're
    // always on the move, never in sync. Bigger, nearer objects wander a bit further.
    const floatDur = 5.6 + (index % 3) * 1.1 + item.depth + (index % 4) * 0.43
    const driftDur = floatDur * 1.43 + (index % 5) * 0.37
    const reach = 18 + item.depth * 14
    const dir = index % 2 ? 1 : -1
    const wanderX = [0, reach * dir, reach * 0.3 * dir, -reach * 0.8 * dir, -reach * 0.2 * dir, 0]
    const wanderY = [0, -reach * 0.9, reach * 0.4, -reach * 0.3, reach * 0.7, 0]
    const fallback = DEFAULTS[index % DEFAULTS.length].image!

    return (
        <motion.div
            ref={selfRef}
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
                animate={isStatic ? undefined : { x: wanderX }}
                transition={{ duration: driftDur, repeat: Infinity, ease: "easeInOut", delay: index * 0.23 }}
            >
            <motion.div
                animate={isStatic ? undefined : { y: wanderY, rotate: [0, 5 * dir, -2 * dir, -5 * dir, 2 * dir, 0] }}
                transition={{ duration: floatDur, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
                style={{ perspective: 600 }}
            >
                {model ? (
                    // Real 3D: it turns toward the cursor and spins when dragged on its own; the float above stays.
                    <div style={{ width: size, height: size, pointerEvents: "auto" }}>
                        {flipbook ? (
                            <ClaySprite sheet={model.sheet} alt={model.alt} touch={touch} />
                        ) : (
                        <Suspense fallback={<img src={model.poster} alt={model.alt} style={{ width: "100%", height: "100%", objectFit: "contain" }} />}>
                        <Clay3D
                            model={model.model}
                            poster={{ src: model.poster, alt: model.alt }}
                            follow={1}
                            turn={-20}
                            tilt={30}
                            light={1}
                            dragToSpin={true}
                            float={false}
                            heroAt={0}
                        />
                        </Suspense>
                        )}
                    </div>
                ) : (
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
                )}
            </motion.div>
            </motion.div>
        </motion.div>
    )
}

/**
 * Floating clay objects. They start bunched in the middle of the section, then drift out to their spots,
 * one after another, right after the avatar pops in (and back in when you scroll up above the hero). They follow the mouse, tilt toward the cursor and can be flung.
 * Place it absolutely over a section (fill the section).
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function FloatingClay(props: FloatingClayProps) {
    const { items = DEFAULTS, use3D = true, flipbook = false, mouseStrength = 1, tiltStrength = 26, stagger = 0.04 } = props
    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement>(null)
    const mx = useMotionValue(0)
    const my = useMotionValue(0)
    const [box, setBox] = useState({ w: 1200, h: 800 })
    const [touch, setTouch] = useState(false)

    // Hero timeline (Oct 9, round 15): the avatar goes first. When it pops in (Reveal.tsx → "io-hero-gate"),
    // the rest of the hero plays in order over ~1.3s, starting a beat later. Scrolling back above the hero resets
    // it. Shared with the name tag, headline, subtitle and 3D clay via window.
    const progress = useMotionValue(isStatic ? 1 : 0)
    const smooth = useSpring(progress, { stiffness: 110, damping: 24, mass: 0.6 })

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const w = window as any
        w[HERO_KEY] = smooth
        window.dispatchEvent(new CustomEvent(HERO_EVENT))
        let anim: AnimationPlaybackControls | null = null
        let fallback = 0
        const open = () => {
            window.clearTimeout(fallback)
            anim?.stop()
            anim = animate(progress, 1, { duration: PLAY_TIME * (1 - progress.get()), delay: AFTER_AVATAR, ease: "linear" })
        }
        const close = () => {
            anim?.stop()
            progress.set(0)
        }
        const onGate = (e: Event) => ((e as CustomEvent).detail ? open() : close())
        window.addEventListener(GATE_EVENT, onGate)
        if (w[GATE_KEY]) open()
        // A page with no avatar: play once this section is in view.
        let io: IntersectionObserver | null = null
        const el = rootRef.current
        if (el && typeof IntersectionObserver !== "undefined") {
            io = new IntersectionObserver(
                (entries) => {
                    if (!entries[0]?.isIntersecting) return
                    io?.disconnect()
                    fallback = window.setTimeout(() => !w[GATE_KEY] && open(), 2000)
                },
                { rootMargin: "0px 0px -20% 0px" }
            )
            io.observe(el)
        }
        return () => {
            window.removeEventListener(GATE_EVENT, onGate)
            window.clearTimeout(fallback)
            io?.disconnect()
            anim?.stop()
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

    // 3D: a fresh random handful on every visit (after the page loads, so the canvas and first paint show images).
    const [picks, setPicks] = useState<number[] | null>(null)
    useEffect(() => {
        if (isStatic || !use3D || typeof window === "undefined") return
        startTransition(() => setPicks(pickRandom(LAYOUT_3D.desktop.length)))
    }, [isStatic, use3D])

    const bands = box.w < 640 ? PHONE_POS : box.w < 1000 ? TABLET_POS : null
    const baseList = items && items.length ? items : DEFAULTS
    const list3D = box.w < 640 ? LAYOUT_3D.phone : box.w < 1000 ? LAYOUT_3D.tablet : LAYOUT_3D.desktop
    const list: ClayItem[] =
        use3D && !isStatic
            ? list3D.map((spot, i) => ({ ...spot, image: DEFAULTS[i % DEFAULTS.length].image }))
            : bands
              ? baseList.map((it, i) => ({ ...it, ...bands[i % bands.length] }))
              : baseList
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
                    model={picks ? POOL_3D[picks[i % picks.length]] : undefined}
                    flipbook={flipbook}
                />
            ))}
        </div>
    )
}

addPropertyControls(FloatingClay, {
    flipbook: {
        type: ControlType.Boolean,
        title: "Flipbook",
        description: "On: the 3D objects are pre-shot photos from 72 angles (plain images, light, phone-friendly). Off: live 3D.",
        defaultValue: false,
        hidden: (p: any) => p.use3D === false,
    },
    use3D: {
        type: ControlType.Boolean,
        title: "3D objects",
        description: "On: a random handful of the 19 clay models, different on every visit. Off: the images below.",
        defaultValue: true,
    },
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
    stagger: { type: ControlType.Number, title: "Stagger", defaultValue: 0.04, min: 0, max: 0.15, step: 0.01 },
})
