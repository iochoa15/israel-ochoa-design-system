import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, type ComponentType, type Ref, type RefObject } from "react"
import { useIsStaticRenderer } from "framer"
import { animate, useMotionValue, useTransform, type AnimationPlaybackControls, type MotionValue } from "framer-motion"

// Hero entrance overrides. Apply them in Framer on the layer's Code Override.
//
// The hero runs ONE shared timeline (0 → 1), published by FloatingClay on window.__ioHeroPlayhead. It follows
// the scroll, but never faster than ~2.4s for the whole entrance, so the order is always readable:
//   0.00–0.41  avatar + name + role        (withClayPop, withRiseName, withRiseRole)
//   0.28–0.62  concha                      (FloatingClay, first object)
//   0.42–1.00  the other clay + headline + subtitle (FloatingClay, Clay3D, HeroHeadline, withRiseSubtitle)
// A page without FloatingClay plays the same timeline on its own once the layer is in view.

const EASE = [0.16, 1, 0.3, 1] as const
const HERO_KEY = "__ioHeroPlayhead"
const HERO_EVENT = "io-hero-playhead"

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const local = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))

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
                        anim = animate(p, 1, { duration: 2.4, ease: "linear" })
                    },
                    { rootMargin: "0px 0px -30% 0px" }
                )
                io.observe(node)
            }, 1200)
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

/**
 * Avatar entrance, same feel as the floating clay: starts small, blurred, faded and a little turned, then
 * grows into place. First thing in the hero. Scale and turn use the CSS scale/rotate properties, so the
 * layer's own hover effect still works.
 */
export function withClayPop(Component: ComponentType<any>): ComponentType {
    return forwardRef(function ClayPop(props: any, ref: Ref<any>) {
        const play = usePlay()
        const [own, setRef] = useOwnRef(ref)
        const p = useHeroTimeline(play, own)
        const opacity = useTransform(p, (v) => clamp01(local(v, 0, 0.36) / 0.45))
        const filter = useTransform(p, (v) => `blur(${(1 - easeOut(local(v, 0, 0.36))) * 8}px)`)

        // Writes only to this layer's own element.
        useIsoLayoutEffect(() => {
            const el = own.current
            if (!el) return
            const paint = (v: number) => {
                const e = easeOut(local(v, 0, 0.36))
                el.style.setProperty("scale", String(0.3 + 0.7 * e))
                el.style.setProperty("rotate", `${-12 * (1 - e)}deg`)
                el.style.setProperty("translate", `0px ${24 * (1 - e)}px`)
            }
            paint(p.get())
            if (!play) return
            return p.on("change", paint)
        }, [play])

        if (!play) return <Component ref={setRef} {...props} />
        return <Component ref={setRef} {...props} style={{ ...props.style, opacity, filter }} />
    })
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

/** Name under the avatar: arrives with the avatar. */
export function withRiseName(Component: ComponentType<any>): ComponentType {
    return makeRise(0.03, 0.38)(Component)
}

/** Role under the name: right behind the name. */
export function withRiseRole(Component: ComponentType<any>): ComponentType {
    return makeRise(0.06, 0.41)(Component)
}

/** Hero subtitle: with the rest of the clay, just after the headline. */
export function withRiseSubtitle(Component: ComponentType<any>): ComponentType {
    return makeRise(0.56, 0.92)(Component)
}

/** Small tiles: opens from a small round window and grows to full size. */
export function withFrameReveal(Component: ComponentType<any>): ComponentType {
    return makeReveal("inset(30% 30% 30% 30% round 50%)", "inset(0% 0% 0% 0% round 0%)", 0.6, 1.2)(Component)
}

/** Big images and cards: opens from a narrower window, a little slower (closest to Joby). */
export function withFrameRevealLarge(Component: ComponentType<any>): ComponentType {
    return makeReveal("inset(18% 22% 18% 22% round 24px)", "inset(0% 0% 0% 0% round 0px)", 0.92, 1.4)(Component)
}
