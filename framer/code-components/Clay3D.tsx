import { useEffect, useRef, useState, startTransition, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion"
// @ts-ignore — URL import: Framer's bundler resolves it, TypeScript has no types for it
import * as THREE from "https://esm.sh/three@0.169.0"
// @ts-ignore
import { GLTFLoader } from "https://esm.sh/three@0.169.0/examples/jsm/loaders/GLTFLoader.js"
// @ts-ignore
import { MeshoptDecoder } from "https://esm.sh/three@0.169.0/examples/jsm/libs/meshopt_decoder.module.js"

interface Clay3DProps {
    model: string
    poster?: { src: string; alt?: string }
    follow: number
    turn: number
    tilt: number
    light: number
    dragToSpin: boolean
    float: boolean
    heroAt: number
    style?: CSSProperties
}

const DEFAULT_MODEL = "https://framerusercontent.com/assets/7QOlCVTC5gDNTuFp80eEqRckYWY.glb"
const DEFAULT_POSTER = { src: "https://framerusercontent.com/images/XEMXYicF2jUA9UzW1gCpbodUQ.png", alt: "Clay pizza" }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const HERO_KEY = "__ioHeroPlayhead"
const HERO_EVENT = "io-hero-playhead"

// Follows the hero timeline published by FloatingClay (see Reveal.tsx). Without one, it is simply "done".
function useHeroTimeline(enabled: boolean): MotionValue<number> {
    const p = useMotionValue(enabled ? 0 : 1)
    useEffect(() => {
        if (!enabled || typeof window === "undefined") return
        let unsub = () => {}
        const attach = () => {
            const src = (window as any)[HERO_KEY] as MotionValue<number> | undefined
            if (!src) return false
            unsub()
            p.set(src.get())
            unsub = src.on("change", (v) => p.set(v))
            return true
        }
        window.addEventListener(HERO_EVENT, attach)
        const fallback = attach() ? 0 : window.setTimeout(() => !(window as any)[HERO_KEY] && p.set(1), 1200)
        return () => {
            unsub()
            window.removeEventListener(HERO_EVENT, attach)
            window.clearTimeout(fallback)
        }
    }, [enabled])
    return p
}
const damp = (from: number, to: number, speed: number, dt: number) => from + (to - from) * (1 - Math.exp(-speed * dt))

/**
 * One clay object in real 3D (a .glb file). It turns to look at the cursor, grows a little on hover,
 * floats, and can be dragged to spin. Shows the flat image first and on the canvas.
 * Only draws while on screen.
 *
 * @framerIntrinsicWidth 180
 * @framerIntrinsicHeight 180
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function Clay3D(props: Clay3DProps) {
    const { model = DEFAULT_MODEL, poster = DEFAULT_POSTER, follow = 1, turn = -20, tilt = 40, light = 1, dragToSpin = true, float = true, heroAt = 0.6 } = props
    const isStatic = useIsStaticRenderer()
    // Hero entrance: pops in at its slot of the hero timeline (0 = off, plays as soon as it has loaded).
    const hero = useHeroTimeline(!isStatic && heroAt > 0)
    const heroLocal = useTransform(hero, (v) => (heroAt > 0 ? clamp((v - heroAt) / 0.32, 0, 1) : 1))
    const heroOpacity = useTransform(heroLocal, (e) => clamp(e / 0.45, 0, 1))
    const heroScale = useTransform(heroLocal, (e) => 0.55 + 0.45 * (1 - Math.pow(1 - e, 3)))
    const heroFilter = useTransform(heroLocal, (e) => `blur(${(1 - (1 - Math.pow(1 - e, 3))) * 6}px)`)
    const hostRef = useRef<HTMLDivElement>(null)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const host = hostRef.current
        if (!host) return
        let disposed = false

        const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.NeutralToneMapping
        const canvas = renderer.domElement as HTMLCanvasElement
        canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block"
        host.appendChild(canvas)

        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100)
        camera.position.set(0, 0, 4)
        // Soft studio light: warm sky/floor fill, a key from top right, a cool rim from behind.
        scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d4cc, 1.7 * light))
        const key = new THREE.DirectionalLight(0xffffff, 2.1 * light)
        key.position.set(2.5, 3, 4)
        scene.add(key)
        const rim = new THREE.DirectionalLight(0xdfe6ff, 0.9 * light)
        rim.position.set(-3, 1, -2.5)
        scene.add(rim)

        const pivot = new THREE.Group()
        scene.add(pivot)

        const loader = new GLTFLoader()
        loader.setMeshoptDecoder(MeshoptDecoder)
        loader.load(
            model,
            (gltf: any) => {
                if (disposed) return
                const obj = gltf.scene
                const box = new THREE.Box3().setFromObject(obj)
                const size = box.getSize(new THREE.Vector3())
                const center = box.getCenter(new THREE.Vector3())
                obj.position.sub(center)
                const radius = size.length() / 2 || 1
                // Fit the whole object in view with a little air around it.
                camera.position.z = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.02
                camera.near = camera.position.z / 100
                camera.far = camera.position.z * 10
                camera.updateProjectionMatrix()
                pivot.add(obj)
                startTransition(() => setReady(true))
            },
            undefined,
            (err: unknown) => console.warn("[Clay3D] could not load model", err)
        )

        function resize() {
            const w = host!.clientWidth || 1
            const h = host!.clientHeight || 1
            renderer.setSize(w, h, false)
            camera.aspect = w / h
            camera.updateProjectionMatrix()
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(host)

        // Interaction state
        let lookX = 0 // -1..1, where the cursor is relative to the object
        let lookY = 0
        let hover = false
        let dragging = false
        let lastX = 0
        let lastT = 0
        let spin = 0 // extra turn from dragging (radians)
        let spinVel = 0

        function onPointerMove(e: PointerEvent) {
            if (touch) return
            const r = host!.getBoundingClientRect()
            lookX = clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), -1, 1)
            lookY = clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2), -1, 1)
        }
        function onDown(e: PointerEvent) {
            if (!dragToSpin) return
            dragging = true
            lastX = e.clientX
            lastT = performance.now()
            spinVel = 0
            host!.setPointerCapture(e.pointerId)
        }
        function onDragMove(e: PointerEvent) {
            if (!dragging) return
            const now = performance.now()
            const dx = e.clientX - lastX
            const dt = Math.max(1, now - lastT) / 1000
            spin += dx * 0.012
            spinVel = (dx * 0.012) / dt
            lastX = e.clientX
            lastT = now
        }
        function onUp(e: PointerEvent) {
            dragging = false
            try {
                host!.releasePointerCapture(e.pointerId)
            } catch (err) {}
        }
        const onEnter = () => (hover = true)
        const onLeave = () => (hover = false)
        window.addEventListener("pointermove", onPointerMove, { passive: true })
        host.addEventListener("pointerdown", onDown)
        host.addEventListener("pointermove", onDragMove)
        host.addEventListener("pointerup", onUp)
        host.addEventListener("pointercancel", onUp)
        host.addEventListener("pointerenter", onEnter)
        host.addEventListener("pointerleave", onLeave)

        const baseYaw = THREE.MathUtils.degToRad(turn)
        const basePitch = THREE.MathUtils.degToRad(tilt)
        let yaw = baseYaw
        let pitch = basePitch
        let scale = 1
        let t = 0
        let last = performance.now()
        let raf = 0

        // Only draw while on screen.
        let onScreen = true
        const io = new IntersectionObserver((entries) => {
            onScreen = entries[0]?.isIntersecting ?? true
            if (onScreen && !raf) {
                last = performance.now()
                raf = requestAnimationFrame(frame)
            }
        })
        io.observe(host)

        function frame(now: number) {
            raf = 0
            if (disposed || !onScreen) return
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            t += dt

            // Drag spin coasts, then eases back to the resting pose.
            if (!dragging) {
                spin += spinVel * dt
                spinVel *= Math.exp(-dt * 3.2)
                if (Math.abs(spinVel) < 0.4) spin = damp(spin, 0, 1.6, dt)
            }

            const idle = touch && !reduced ? Math.sin(t * 0.55) * 0.35 : 0
            const targetYaw = baseYaw + lookX * 0.65 * follow + idle + spin
            const targetPitch = basePitch + lookY * 0.38 * follow
            yaw = damp(yaw, targetYaw, dragging ? 30 : 6, dt)
            pitch = damp(pitch, targetPitch, 6, dt)
            scale = damp(scale, hover || dragging ? 1.08 : 1, 9, dt)

            pivot.rotation.set(pitch, yaw, float && !reduced ? Math.sin(t * 0.9) * 0.05 : 0)
            pivot.position.y = float && !reduced ? Math.sin(t * 1.3) * 0.04 * (camera.position.z / 4) : 0
            pivot.scale.setScalar(scale)

            renderer.render(scene, camera)
            raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)

        return () => {
            disposed = true
            if (raf) cancelAnimationFrame(raf)
            ro.disconnect()
            io.disconnect()
            window.removeEventListener("pointermove", onPointerMove)
            host.removeEventListener("pointerdown", onDown)
            host.removeEventListener("pointermove", onDragMove)
            host.removeEventListener("pointerup", onUp)
            host.removeEventListener("pointercancel", onUp)
            host.removeEventListener("pointerenter", onEnter)
            host.removeEventListener("pointerleave", onLeave)
            scene.traverse((o: any) => {
                o.geometry?.dispose?.()
                const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
                mats.forEach((m: any) => {
                    Object.values(m).forEach((v: any) => v && v.isTexture && v.dispose())
                    m.dispose?.()
                })
            })
            renderer.dispose()
            canvas.remove()
            startTransition(() => setReady(false))
        }
    }, [isStatic, model, light, turn, tilt, follow, dragToSpin, float])

    return (
        <motion.div style={{ ...props.style, position: "relative", width: "100%", height: "100%", opacity: heroOpacity, scale: heroScale, filter: heroFilter }}>
        <motion.div
            ref={hostRef}
            initial={isStatic ? false : { opacity: 0, scale: 0.4, filter: "blur(10px)" }}
            animate={isStatic || ready ? { opacity: 1, scale: 1, filter: "blur(0px)" } : undefined}
            transition={{ type: "spring", stiffness: 140, damping: 20, mass: 1 }}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                cursor: dragToSpin ? "grab" : "default",
                touchAction: "pan-y",
            }}
        >
            {/* Flat image: shown on the canvas and until the 3D model has loaded */}
            {(isStatic || !ready) && poster?.src ? (
                <img
                    src={poster.src}
                    alt={poster.alt || ""}
                    draggable={false}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", userSelect: "none" }}
                />
            ) : null}
        </motion.div>
        </motion.div>
    )
}

addPropertyControls(Clay3D, {
    model: { type: ControlType.File, title: "3D model", allowedFileTypes: ["glb"] },
    poster: { type: ControlType.ResponsiveImage, title: "Flat image" },
    follow: { type: ControlType.Number, title: "Follow cursor", defaultValue: 1, min: 0, max: 2, step: 0.05 },
    turn: { type: ControlType.Number, title: "Resting turn", defaultValue: -20, min: -180, max: 180, unit: "°" },
    tilt: { type: ControlType.Number, title: "Resting tilt", defaultValue: 40, min: -90, max: 90, unit: "°" },
    light: { type: ControlType.Number, title: "Light", defaultValue: 1, min: 0.3, max: 2, step: 0.05 },
    dragToSpin: { type: ControlType.Boolean, title: "Drag to spin", defaultValue: true },
    float: { type: ControlType.Boolean, title: "Float", defaultValue: true },
    heroAt: { type: ControlType.Number, title: "Hero entrance at", description: "Slot on the hero timeline (0 = off)", defaultValue: 0.6, min: 0, max: 0.9, step: 0.01 },
})
