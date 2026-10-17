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

// On a page with the avatar → nav flight (/homepage-8), the hero entrance plays once per visit: scrolling back up
// no longer resets it, so going back and forth never replays the pops (Oct 17: it read as jagged).
const ONCE_KEY = "__ioHeroOnce"

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
                    if (p.get() === 1) return
                    anim?.stop()
                    anim = animate(p, 1, { type: "spring", ...spring, delay })
                    if (gate) setGate(true)
                } else if (!(window as any)[ONCE_KEY] && e.boundingClientRect.top > (window.innerHeight || 0) * 1.28) {
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

// Avatar → nav (Oct 15, after butter.video's statement icons that drop into the timeline below as you scroll).
// Scrolling down from the hero, the avatar lifts out of the name tag, tilts as it travels down the screen,
// shrinks, and lands in the nav where the logo icon sits. It stays there for the rest of the page; scrolling
// back up flies it home. The nav's Logo Icon IS the avatar (same image, same roundness) on every page; on this
// page it stays hidden until the flying avatar lands on it, then the flying copy hands over to it.
// Two overrides work together:
//   withClayPopDock  on the hero avatar (the same pop-in as withClayPop, plus the flight)
//   withNavLogoSlot  on MainNav's "Logo Icon" (marks the landing spot; optional, see findLogoIcons)
// Round 3 (Oct 17, "jagged when I scroll back and forth"):
//   - Before lift-off the real avatar stays in the page (it scrolls with the text, so they can never drift apart).
//   - Only the flight's progress is smoothed. Its start point is read from the page every frame, so the avatar
//     never lags behind the name tag; the smoothing just eases it in and out of each wheel step.
//   - The flight is longer (80% of the screen height of scrolling, was 60%), so it reads calmer.
//   - Once landed, the flying copy hides and the nav's own avatar shows, so it rides the nav exactly.
const DOCK_KEY = "__ioAvatarDock"
const DOCK_EVENT = "io-avatar-dock"
const DOCK_LEAD = 0.04 // share of the screen height you scroll before the avatar lifts off
const DOCK_TRAVEL = 0.8 // share of the screen height the flight takes
const DOCK_TILT = -12 // degrees of tilt at mid-flight
const DOCK_SMOOTH = 0.18 // s: how softly the flight follows the scroll (a critically damped spring, so its speed never jumps)
// Kept on window, not in this module: the nav (a component) and the page can load separate copies of this file.
function navSlots(): Set<HTMLElement> {
    const w = window as any
    return (w.__ioNavSlots ||= new Set<HTMLElement>())
}
// Visible "Logo Icon" layers (Framer writes each layer's name on its element); used if the nav override is missing.
function findLogoIcons(): HTMLElement[] {
    const found: HTMLElement[] = []
    navSlots().forEach((el) => found.push(el))
    if (!found.length) document.querySelectorAll<HTMLElement>('[data-framer-name="Logo Icon"]').forEach((el) => found.push(el))
    return found
}
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// On this page the nav avatar stays hidden (and unclickable) until the flying avatar has landed on it.
function hideLogo(el: HTMLElement, hide: boolean) {
    el.style.opacity = hide ? "0" : ""
    el.style.pointerEvents = hide ? "none" : ""
}

function publishDock(p: number) {
    if ((window as any)[DOCK_KEY] === p) return
    ;(window as any)[DOCK_KEY] = p
    window.dispatchEvent(new CustomEvent(DOCK_EVENT, { detail: p }))
}

function useAvatarDock(el: RefObject<HTMLElement | null>) {
    const isStatic = useIsStaticRenderer()
    useEffect(() => {
        const node = el.current
        if (isStatic || !node || typeof window === "undefined") return
        const w = window as any
        w[ONCE_KEY] = true
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        const logos = new Set<HTMLElement>()
        let fly: HTMLDivElement | null = null
        let p = 0
        let vel = 0
        let last = performance.now()
        let raf = 0
        let warned = false
        let state = ""

        const slot = () => {
            for (const s of findLogoIcons()) {
                logos.add(s)
                const r = s.getBoundingClientRect()
                if (r.width > 0 && r.height > 0) {
                    const sw = s.offsetWidth || r.width
                    const sh = s.offsetHeight || r.height
                    return { el: s, cx: r.left + r.width / 2, cy: r.top + r.height / 2, size: Math.min(sw, sh) }
                }
            }
            if (!warned) console.warn("[io-avatar-dock] no visible nav Logo Icon found, the avatar stays in the hero")
            warned = true
            return null
        }
        // The avatar's image and corner roundness, read from the layer itself.
        const makeFly = () => {
            const d = document.createElement("div")
            d.setAttribute("aria-hidden", "true")
            const cs = getComputedStyle(node)
            const img = node.querySelector("img")
            Object.assign(d.style, {
                position: "fixed",
                left: "0px",
                top: "0px",
                zIndex: "30",
                pointerEvents: "none",
                overflow: "hidden",
                display: "none",
                transformOrigin: "50% 50%",
                willChange: "transform",
                backgroundColor: cs.backgroundColor,
                backgroundImage: cs.backgroundImage,
                backgroundSize: cs.backgroundSize,
                backgroundPosition: cs.backgroundPosition,
                boxShadow: cs.boxShadow,
                isolation: "isolate",
            })
            if (img) {
                const im = document.createElement("img")
                im.src = img.currentSrc || img.src
                im.alt = ""
                im.decoding = "async"
                const ics = getComputedStyle(img)
                Object.assign(im.style, { width: "100%", height: "100%", display: "block", objectFit: ics.objectFit || "cover", objectPosition: ics.objectPosition })
                d.appendChild(im)
            }
            document.body.appendChild(d)
            return d
        }
        const radiusRatio = () => {
            for (const e of [node, node.firstElementChild as HTMLElement | null]) {
                if (!e) continue
                const r = parseFloat(getComputedStyle(e).borderTopLeftRadius)
                if (r > 0) return r / (node.offsetWidth || 1)
            }
            return 0.27
        }
        let ratio = radiusRatio()
        // The pop-in has settled when withClayPop's scale/translate are back to rest.
        const settled = () => Math.abs(parseFloat(node.style.getPropertyValue("scale") || "1") - 1) < 0.01 && parseFloat((node.style.getPropertyValue("translate") || "0px 0px").split(" ")[1] || "0") < 1
        // Only touch the DOM when the state changes (home / flying / docked).
        const show = (next: string) => {
            if (next === state) return
            state = next
            if (fly) fly.style.display = next === "flying" ? "block" : "none"
            node.style.visibility = next === "home" ? "" : "hidden"
            for (const lg of logos) hideLogo(lg, next !== "docked")
        }

        const tick = () => {
            raf = requestAnimationFrame(tick)
            const now = performance.now()
            const dt = Math.min(0.064, (now - last) / 1000)
            last = now
            const vh = window.innerHeight || 1
            const r = node.getBoundingClientRect()
            const hero = node.closest("#hero") as HTMLElement | null
            const heroTop = hero ? hero.getBoundingClientRect().top + window.scrollY : r.top + window.scrollY - vh * 0.18
            const target = slot()
            if (!state) show("home")
            for (const lg of logos) if (state !== "docked") hideLogo(lg, true)

            // Where the flight should be for this scroll position (0 = in the name tag, 1 = in the nav).
            const goal = target && settled() ? clamp01((window.scrollY - heroTop - vh * DOCK_LEAD) / (vh * DOCK_TRAVEL)) : 0
            if (reduced) p = goal > 0.5 ? 1 : 0
            else {
                // Smooth damp toward the goal: eases in and out of every wheel step, never jumps.
                const omega = 2 / DOCK_SMOOTH
                const x = omega * dt
                const k = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
                const change = p - goal
                const temp = (vel + omega * change) * dt
                vel = (vel - omega * temp) * k
                p = goal + (change + temp) * k
                if (Math.abs(p - goal) < 0.0005 && Math.abs(vel) < 0.01) {
                    p = goal
                    vel = 0
                }
            }
            p = clamp01(p)
            publishDock(p)
            if (p <= 0 || !target) return show("home")
            if (p >= 1) return show("docked")

            if (!fly) fly = makeFly()
            const e = easeInOut(p)
            // Start point read live from the page, so the avatar leaves exactly from where the name tag is now.
            const w0 = node.offsetWidth || r.width
            const homeCx = r.left + r.width / 2
            const homeCy = r.top + r.height / 2
            const size = w0 + (target.size - w0) * e
            const cx = homeCx + (target.cx - homeCx) * e
            const cy = homeCy + (target.cy - homeCy) * e
            const tilt = reduced ? 0 : DOCK_TILT * Math.sin(Math.PI * p)
            const st = fly.style
            st.width = `${size}px`
            st.height = `${size}px`
            st.borderRadius = `${ratio * size}px`
            st.transform = `translate3d(${cx - size / 2}px, ${cy - size / 2}px, 0) rotate(${tilt}deg)`
            show("flying")
        }
        const onResize = () => {
            ratio = radiusRatio()
        }
        raf = requestAnimationFrame(tick)
        window.addEventListener("resize", onResize)
        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener("resize", onResize)
            fly?.remove()
            node.style.visibility = ""
            for (const lg of logos) hideLogo(lg, false)
            publishDock(0)
            delete w[ONCE_KEY]
        }
    }, [isStatic])
}

/**
 * Hero avatar on /homepage-8: pops in like withClayPop, then flies into the nav (where the logo icon is) as you
 * scroll down, and stays there. Needs withNavLogoSlot on MainNav's Logo Icon.
 */
export function withClayPopDock(Component: ComponentType<any>): ComponentType {
    const Popped = withClayPop(Component)
    return forwardRef(function ClayPopDock(props: any, ref: Ref<any>) {
        const [own, setRef] = useOwnRef(ref)
        useAvatarDock(own)
        return <Popped ref={setRef} {...props} />
    })
}

/**
 * MainNav's Logo Icon: marks the avatar's landing spot (the avatar's code hides the logo on its page). On pages
 * without withClayPopDock it does nothing. Optional: without it, the avatar finds the layer named "Logo Icon".
 */
export function withNavLogoSlot(Component: ComponentType<any>): ComponentType {
    return forwardRef(function NavLogoSlot(props: any, ref: Ref<any>) {
        const isStatic = useIsStaticRenderer()
        const [own, setRef] = useOwnRef(ref)
        useEffect(() => {
            const el = own.current
            if (isStatic || !el || typeof window === "undefined") return
            navSlots().add(el)
            window.dispatchEvent(new CustomEvent("io-nav-slot"))
            return () => {
                navSlots().delete(el)
            }
        }, [isStatic])
        return <Component ref={setRef} {...props} />
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
