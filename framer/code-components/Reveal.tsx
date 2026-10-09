import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, type ComponentType, type Ref, type RefObject } from "react"
import { useIsStaticRenderer } from "framer"
import { animate, useMotionValue, useTransform, type AnimationPlaybackControls, type MotionValue } from "framer-motion"

// Hero entrance overrides. Apply them in Framer on the layer's Code Override.
//
// Avatar, name and role (Oct 9, round 14): they no longer ride the timeline below. They pop in on their own the
// moment the name tag comes into view (the timeline had already finished them before you could see them):
// avatar first, popping up from below, then name, then role. Scrolling back above the hero resets them.
//
// The hero runs ONE shared timeline (0 → 1), published by FloatingClay on window.__ioHeroPlayhead. It follows
// the scroll, but never faster than ~1.1s for the whole entrance, so the order is always readable.
// Tightened Oct 9 (it felt slow, with an empty screen after the intro); the pieces now overlap:
//   0.00–0.32  avatar + name + role        (withClayPop, withRiseName, withRiseRole)
//   0.10–0.38  concha                      (FloatingClay, first object)
//   0.16–0.55  headline + the other clay + subtitle (HeroHeadline, FloatingClay, Clay3D, withRiseSubtitle)
// A page without FloatingClay plays the same timeline on its own (1.2s) once the layer is in view.

const EASE = [0.16, 1, 0.3, 1] as const
const HERO_KEY = "__ioHeroPlayhead"
const HERO_EVENT = "io-hero-playhead"

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const local = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))

function setGate(open: boolean) {
    if (typeof window === "undefined") return
    ;(window as any).__ioHeroGate = open
    window.dispatchEvent(new CustomEvent("io-hero-gate", { detail: open }))
}

function usePlay() {
    const isStatic = useIsStaticRenderer()
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    return !isStatic && !reduced
}

// A copy of the hero timeline for this layer (0 → 1).
function useHeroTimeline(play: boolean, el: RefObject<HTMLElement | null>): MotionValue<number> {
    const p = useMotionValue(play ? 0 : 1)
    useEffect(() => {
        if (!play || typeof window === "undefined") return
        let unsub = () => {}
        let fallback = 0
        let anim: AnimationPlaybackControls | null = null
        let io: IntersectionObserver | null = null
        const attach = () => {
            const src = (window as any)[HERO_KEY] as MotionValue<number> | undefined
            if (!src) return false
            window.clearTimeout(fallback)
            io?.disconnect()
            anim?.stop()
            unsub()
            p.set(src.get())
            unsub = src.on("change", (v) => p.set(v))
            return true
        }
        window.addEventListener(HERO_EVENT, attach)
        if (!attach()) {
            fallback = window.setTimeout(() => {
                const node = el.current
                if (!node || typeof IntersectionObserver === "undefined") return void p.set(1)
                io = new IntersectionObserver(
                    (entries) => {
                        if (!entries[0]?.isIntersecting) return
                        io?.disconnect()
                        anim = animate(p, 1, { duration: 1.2, ease: "linear" })
                    },
                    { rootMargin: "0px 0px -30% 0px" }
                )
                io.observe(node)
            }, 600)
        }
        return () => {
            unsub()
            window.removeEventListener(HERO_EVENT, attach)
            window.clearTimeout(fallback)
            io?.disconnect()
            anim?.stop()
        }
    }, [play])
    return p
}

function useOwnRef(ref: Ref<any>) {
    const own = useRef<HTMLElement | null>(null)
    const setRef = useCallback(
        (el: HTMLElement | null) => {
            own.current = el
            if (typeof ref === "function") ref(el)
            else if (ref) (ref as { current: HTMLElement | null }).current = el
        },
        [ref]
    )
    return [own, setRef] as const
}

// 0 → 1 once the layer comes into view (with a delay), on a springy "pop"; back to 0 when it leaves below the
// screen, so it plays again the next time you scroll down to it. With `gate`, it also tells the rest of the
// hero (FloatingClay's timeline) to start: the avatar always goes first.
function usePopIn(play: boolean, el: RefObject<HTMLElement | null>, delay: number, spring: { stiffness: number; damping: number }, gate = false) {
    const p = useMotionValue(play ? 0 : 1)
    useEffect(() => {
        const node = el.current
        if (!play || !node || typeof IntersectionObserver === "undefined") return
        let anim: AnimationPlaybackControls | null = null
        const io = new IntersectionObserver(
            (entries) => {
                const e = entries[0]
                if (!e) return
                if (e.isIntersecting) {
                    anim?.stop()
                    anim = animate(p, 1, { type: "spring", ...spring, delay })
                    if (gate) setGate(true)
                } else if (e.boundingClientRect.top > (window.innerHeight || 0) * 1.28) {
                    anim?.stop()
                    p.set(0)
                    if (gate) setGate(false)
                }
            },
            // Starts a little BEFORE the name tag is on screen (as the intro's last scroll ends), so the avatar is
            // already popping up as it comes into view: no blank hero.
            { rootMargin: "0px 0px 28% 0px" }
        )
        io.observe(node)
        return () => {
            io.disconnect()
            anim?.stop()
        }
    }, [play])
    return p
}

/**
 * Avatar entrance: pops up from below (small, blurred, faded, a little turned → full size) the moment the name
 * tag comes into view. First thing in the hero. Scale and turn use the CSS scale/rotate properties, so the
 * layer's own hover effect still works.
 */
export function withClayPop(Component: ComponentType<any>): ComponentType {
    return forwardRef(function ClayPop(props: any, ref: Ref<any>) {
        const play = usePlay()
        const [own, setRef] = useOwnRef(ref)
        // Bold, bouncy pop from below (overshoots, like clay landing). Opens the gate for the rest of the hero.
        const p = usePopIn(play, own, 0, { stiffness: 190, damping: 12 }, true)
        const opacity = useTransform(p, (v) => clamp01(v / 0.3))
        const filter = useTransform(p, (v) => `blur(${(1 - clamp01(v)) * 10}px)`)

        // Writes only to this layer's own element.
        useIsoLayoutEffect(() => {
            const el = own.current
            if (!el) return
            const paint = (v: number) => {
                el.style.setProperty("scale", String(0.15 + 0.85 * v))
                el.style.setProperty("rotate", `${-18 * (1 - v)}deg`)
                el.style.setProperty("translate", `0px ${130 * (1 - v)}px`)
            }
            paint(p.get())
            if (!play) return
            return p.on("change", paint)
        }, [play])

        if (!play) return <Component ref={setRef} {...props} />
        return <Component ref={setRef} {...props} style={{ ...props.style, opacity, filter }} />
    })
}

// Name and role: the site's text rise (fade in, y 32 → 0), right after the avatar pops.
function makeRiseInView(delay: number) {
    return function (Component: ComponentType<any>): ComponentType {
        return forwardRef(function RisenInView(props: any, ref: Ref<any>) {
            const play = usePlay()
            const [own, setRef] = useOwnRef(ref)
            const p = usePopIn(play, own, delay, { stiffness: 170, damping: 24 })
            const opacity = useTransform(p, (v) => clamp01(v / 0.6))
            const y = useTransform(p, (v) => 32 * (1 - v))
            if (!play) return <Component ref={setRef} {...props} />
            return <Component ref={setRef} {...props} style={{ ...props.style, opacity, y }} />
        })
    }
}

// Same rise as the other text on the site (fade in, y 32 → 0), placed on the hero timeline.
function makeRise(a: number, b: number) {
    return function (Component: ComponentType<any>): ComponentType {
        return forwardRef(function Risen(props: any, ref: Ref<any>) {
            const play = usePlay()
            const [own, setRef] = useOwnRef(ref)
            const p = useHeroTimeline(play, own)
            const opacity = useTransform(p, (v) => clamp01(local(v, a, b) / 0.6))
            const y = useTransform(p, (v) => 32 * (1 - easeOut(local(v, a, b))))
            if (!play) return <Component ref={setRef} {...props} />
            return <Component ref={setRef} {...props} style={{ ...props.style, opacity, y }} />
        })
    }
}

// Joby-style frame reveal for images further down the page: a small round window grows to full size.
function makeReveal(start: string, end: string, fromScale: number, duration: number) {
    return function (Component: ComponentType<any>): ComponentType {
        return forwardRef(function Revealed(props: any, ref) {
            if (!usePlay()) return <Component ref={ref} {...props} />
            return (
                <Component
                    ref={ref}
                    {...props}
                    initial={{ clipPath: start, scale: fromScale, opacity: 0 }}
                    whileInView={{ clipPath: end, scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: "0px 0px -40% 0px" }}
                    transition={{
                        clipPath: { duration, ease: EASE },
                        scale: { duration, ease: EASE },
                        opacity: { duration: 0.3 },
                    }}
                />
            )
        })
    }
}

/** Name under the avatar: rises right after the avatar pops. */
export function withRiseName(Component: ComponentType<any>): ComponentType {
    return makeRiseInView(0.12)(Component)
}

/** Role under the name: right behind the name. */
export function withRiseRole(Component: ComponentType<any>): ComponentType {
    return makeRiseInView(0.2)(Component)
}

/** Hero subtitle: with the rest of the clay, just after the headline. */
export function withRiseSubtitle(Component: ComponentType<any>): ComponentType {
    return makeRise(0.24, 0.52)(Component)
}

/** Small tiles: opens from a small round window and grows to full size. */
export function withFrameReveal(Component: ComponentType<any>): ComponentType {
    return makeReveal("inset(30% 30% 30% 30% round 50%)", "inset(0% 0% 0% 0% round 0%)", 0.6, 1.2)(Component)
}

/** Big images and cards: opens from a narrower window, a little slower (closest to Joby). */
export function withFrameRevealLarge(Component: ComponentType<any>): ComponentType {
    return makeReveal("inset(18% 22% 18% 22% round 24px)", "inset(0% 0% 0% 0% round 0px)", 0.92, 1.4)(Component)
}
