import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type CSSProperties, type Ref } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

// Pinned "depth" hero (Oct 17 2026, homepages 9, 10 and 11). No intro: the page opens on the hero, which stays on screen
// while you scroll through three copy stages. Behind the copy, clay objects (transparent stills, no 3D) travel
// through depth:
//   toward  (homepage 9, after microsoft.ai)  they come from far away (small, faded, blurred) toward you and slide
//           out past the edges of the screen; the copy also flies past you as it changes.
//   away    (homepage 10, after contralabs.com)  they come in from outside the screen and shrink toward the center,
//           blurring a little and fading out near the end; the copy recedes as it changes.
//
// Setup in Framer: the hero section (#hero) is taller than the screen (400vh) and holds one sticky 100vh "Stage"
// frame. In the stage: this component (absolute, fills it) and three stage frames stacked on top of each other,
// each with its override: withDepthStage1/2/3 (homepage 9) or withRecedeStage1/2/3 (homepage 10). Homepage 11 keeps
// the name tag and changes the copy under it instead (see "Homepage 11" below).
// Everything follows ONE smoothed scroll progress of #hero (0 at the top, 1 when the stage lets go), so the copy and
// the objects can never drift apart.

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const local = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

// ── Shared scroll progress ────────────────────────────────────────────────────────────────────────────────────
// One loop per hero, shared by the component and the three stage overrides (kept on window: Framer can load
// separate copies of this file for the component and the overrides).
const SMOOTH = 0.16 // s: a critically damped follow, so each wheel step eases in and out instead of jumping

type Track = { p: number; vel: number; last: number; raf: number; subs: Set<(p: number) => void> }

function trackMap(): Map<HTMLElement, Track> {
    const w = window as any
    return (w.__ioDepthTracks ||= new Map<HTMLElement, Track>())
}

function rawProgress(el: HTMLElement) {
    const r = el.getBoundingClientRect()
    const run = Math.max(1, r.height - (window.innerHeight || 1))
    return clamp01(-r.top / run)
}

// The scroll track: the #hero section, or else the first ancestor much taller than the screen.
function findTrack(node: HTMLElement): HTMLElement {
    const hero = node.closest("#hero") as HTMLElement | null
    if (hero) return hero
    let el = node.parentElement
    while (el && el !== document.body) {
        if (el.offsetHeight > (window.innerHeight || 1) * 1.5) return el
        el = el.parentElement
    }
    return node
}

function followTrack(el: HTMLElement, cb: (p: number) => void, reduced: boolean) {
    const map = trackMap()
    let t = map.get(el)
    if (!t) {
        const track: Track = { p: rawProgress(el), vel: 0, last: performance.now(), raf: 0, subs: new Set() }
        const tick = () => {
            track.raf = requestAnimationFrame(tick)
            const now = performance.now()
            const dt = Math.min(0.064, (now - track.last) / 1000)
            track.last = now
            const goal = rawProgress(el)
            let p = track.p
            if (reduced) p = goal
            else {
                const omega = 2 / SMOOTH
                const x = omega * dt
                const k = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
                const change = p - goal
                const temp = (track.vel + omega * change) * dt
                track.vel = (track.vel - omega * temp) * k
                p = goal + (change + temp) * k
                if (Math.abs(p - goal) < 0.0002 && Math.abs(track.vel) < 0.005) {
                    p = goal
                    track.vel = 0
                }
            }
            if (p === track.p) return
            track.p = p
            track.subs.forEach((f) => f(p))
        }
        track.raf = requestAnimationFrame(tick)
        map.set(el, track)
        t = track
    }
    const track = t
    track.subs.add(cb)
    cb(track.p)
    return () => {
        track.subs.delete(cb)
        if (!track.subs.size) {
            cancelAnimationFrame(track.raf)
            map.delete(el)
        }
    }
}

// ── Copy stages ───────────────────────────────────────────────────────────────────────────────────────────────
// Where each stage comes in and goes out, as shares of the hero's scroll. Stage 1 is there from the start (the
// avatar flies to the nav while it leaves); stage 3 stays until the next section.
const STAGES: { enter: [number, number] | null; exit: [number, number] | null }[] = [
    { enter: null, exit: [0.2, 0.33] },
    { enter: [0.27, 0.4], exit: [0.6, 0.73] },
    { enter: [0.67, 0.8], exit: null },
]

type StageLook = (enter: number, exit: number) => { opacity: number; scale: number; y: number; blur: number }

// Homepage 9: the copy comes out of the distance and, when it changes, flies past you (like the objects).
const towardLook: StageLook = (enter, exit) => ({
    opacity: enter * (1 - exit),
    scale: 0.86 + 0.14 * enter + 0.22 * exit,
    y: 0,
    blur: 10 * (1 - enter) + 12 * exit,
})

// Homepage 10 (contralabs.com): the next line rises in from below, settling from 120% to 100%; the old one shrinks
// to 70% into the distance and fades.
const recedeLook: StageLook = (enter, exit) => ({
    opacity: enter * (1 - exit),
    scale: 1.2 - 0.2 * enter - 0.3 * exit,
    y: 120 * (1 - enter) - 30 * exit,
    blur: 4 * exit,
})

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

function stageOverride(index: number, look: StageLook) {
    return (Component: ComponentType<any>): ComponentType =>
        forwardRef(function DepthStage(props: any, ref: Ref<any>) {
            const isStatic = useIsStaticRenderer()
            const [own, setRef] = useOwnRef(ref)
            useIsoLayoutEffect(() => {
                const el = own.current
                if (!el || isStatic) return
                const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
                const { enter, exit } = STAGES[index]
                let shown = el.style.visibility
                const paint = (p: number) => {
                    const e = enter ? easeInOut(local(p, enter[0], enter[1])) : 1
                    const x = exit ? easeInOut(local(p, exit[0], exit[1])) : 0
                    const s = reduced ? { opacity: e * (1 - x), scale: 1, y: 0, blur: 0 } : look(e, x)
                    // Phones get half the scale and travel: at 120% the copy would spill past the screen edges.
                    const k = window.innerWidth < 810 ? 0.5 : 1
                    const st = el.style
                    st.opacity = String(s.opacity)
                    st.setProperty("scale", String(1 + (s.scale - 1) * k))
                    st.setProperty("translate", `0px ${s.y * k}px`)
                    st.filter = s.blur > 0.05 ? `blur(${s.blur.toFixed(2)}px)` : ""
                    // Gone stages leave the screen reader and the pointer alone.
                    const next = s.opacity < 0.01 ? "hidden" : ""
                    if (next !== shown) {
                        shown = next
                        st.visibility = next
                        st.pointerEvents = next ? "none" : ""
                    }
                }
                const stop = followTrack(findTrack(el), paint, reduced)
                return () => {
                    stop()
                    for (const k of ["opacity", "scale", "translate", "filter", "visibility", "pointer-events"]) el.style.removeProperty(k)
                }
            }, [isStatic])
            // On the canvas only the first stage shows (pick the others in the Layers panel to edit them). The
            // server sends the later stages hidden, so a refresh doesn't flash every line at once (Oct 17 fix).
            const style = index === 0 ? props.style : isStatic ? { ...props.style, opacity: 0 } : { ...props.style, opacity: 0, visibility: "hidden" }
            return <Component ref={setRef} {...props} style={style} />
        })
}

/** Homepage 9 stage 1 (name tag + typed headline): flies past you as stage 2 arrives. */
export function withDepthStage1(Component: ComponentType<any>): ComponentType {
    return stageOverride(0, towardLook)(Component)
}
/** Homepage 9 stage 2: comes out of the distance, then flies past you. */
export function withDepthStage2(Component: ComponentType<any>): ComponentType {
    return stageOverride(1, towardLook)(Component)
}
/** Homepage 9 stage 3: comes out of the distance and stays. */
export function withDepthStage3(Component: ComponentType<any>): ComponentType {
    return stageOverride(2, towardLook)(Component)
}
/** Homepage 10 stage 1: shrinks into the distance as stage 2 rises in. */
export function withRecedeStage1(Component: ComponentType<any>): ComponentType {
    return stageOverride(0, recedeLook)(Component)
}
/** Homepage 10 stage 2: rises in from below, then shrinks away. */
export function withRecedeStage2(Component: ComponentType<any>): ComponentType {
    return stageOverride(1, recedeLook)(Component)
}
/** Homepage 10 stage 3: rises in from below and stays. */
export function withRecedeStage3(Component: ComponentType<any>): ComponentType {
    return stageOverride(2, recedeLook)(Component)
}

// ── Homepage 11: one copy slot under the name tag ─────────────────────────────────────────────────────────────
// Oct 17, round 2 (Israel: on homepage 9 the copy went by too fast, and the header should form first). The hero
// holds the screen until every step has played. The name tag (avatar, name, title) stays put; the copy under it
// changes in steps. The scroll decides WHICH step shows, and each change then plays out on its own (about half a
// second), so the copy is never caught half faded when you stop scrolling. Cues, as shares of the hero's pinned
// scroll:
//   0.10  line 2 ("for the moment AI meets a real person.") rises in under "I design/"
//   0.38  the header leaves; the paragraph (10+ years) comes in once it's gone
//   0.85  the paragraph leaves
//   0.92  the avatar lifts off into the nav as the next section comes in (withClayPopDockLate in Reveal.tsx)
// Setup in Framer (inside the sticky stage): Column (centered stack) → name tag + Copy slot. Copy slot → Header
// (withStepHeader: "I design/" + line 2 with withStepLine2) and the paragraph (withStepParagraph, absolute, pinned
// to the top of the slot).
const CUE = { form: 0.1, headerOut: 0.38, paraIn: 0.42, paraOut: 0.85 }
const STEP_SMOOTH = 0.22 // s: each change settles in about half a second
const FORM = 0
const HEADER = 1
const PARA = 2
const STEP_KEYS = ["form", "header", "para"]

// Each step's phase: 0 = waiting below, 1 = shown, 2 = gone above.
type Steps = { ph: number[]; vel: number[]; last: number; raf: number; subs: Set<(ph: number[]) => void> }

function stepMap(): Map<HTMLElement, Steps> {
    const w = window as any
    return (w.__ioStepTracks ||= new Map<HTMLElement, Steps>())
}

const onScreen = (ph: number) => ph > 0.15 && ph < 1.85

// Where each step is headed for this scroll position. The header and the paragraph share the slot, so each one
// waits for the other to clear it first.
function stepGoals(p: number, ph: number[]) {
    return [
        p >= CUE.form ? 1 : 0,
        p >= CUE.headerOut || onScreen(ph[PARA]) ? 2 : 1,
        // Flung past without it ever showing: it stays below instead of flashing through.
        p >= CUE.paraOut ? (ph[PARA] >= 0.5 ? 2 : 0) : p >= CUE.paraIn && !onScreen(ph[HEADER]) ? 1 : 0,
    ]
}

function followSteps(el: HTMLElement, cb: (ph: number[]) => void, reduced: boolean) {
    const map = stepMap()
    let s = map.get(el)
    if (!s) {
        // Opens on the right step (a refresh halfway down the hero doesn't replay the earlier ones).
        const ph = [0, 1, 0]
        for (let k = 0; k < 3; k++) stepGoals(rawProgress(el), ph).forEach((g, i) => (ph[i] = g))
        const steps: Steps = { ph, vel: [0, 0, 0], last: performance.now(), raf: 0, subs: new Set() }
        const tick = () => {
            steps.raf = requestAnimationFrame(tick)
            const now = performance.now()
            const dt = Math.min(0.064, (now - steps.last) / 1000)
            steps.last = now
            const goals = stepGoals(rawProgress(el), steps.ph)
            let moved = false
            for (let i = 0; i < goals.length; i++) {
                const goal = goals[i]
                let x = steps.ph[i]
                if (x === goal) continue
                if (reduced) x = goal
                else {
                    const omega = 2 / STEP_SMOOTH
                    const t = omega * dt
                    const k = 1 / (1 + t + 0.48 * t * t + 0.235 * t * t * t)
                    const change = x - goal
                    const temp = (steps.vel[i] + omega * change) * dt
                    steps.vel[i] = (steps.vel[i] - omega * temp) * k
                    x = goal + (change + temp) * k
                    if (Math.abs(x - goal) < 0.002 && Math.abs(steps.vel[i]) < 0.02) {
                        x = goal
                        steps.vel[i] = 0
                    }
                }
                steps.ph[i] = x
                moved = true
            }
            if (moved) steps.subs.forEach((f) => f(steps.ph))
        }
        steps.raf = requestAnimationFrame(tick)
        map.set(el, steps)
        s = steps
    }
    const steps = s
    steps.subs.add(cb)
    cb(steps.ph)
    return () => {
        steps.subs.delete(cb)
        if (!steps.subs.size) {
            cancelAnimationFrame(steps.raf)
            map.delete(el)
        }
    }
}

// Rises in from below with its blur clearing; leaves upward, blurring out. Calm, no scale.
function stepLook(ph: number) {
    const e = clamp01(ph)
    const x = clamp01(ph - 1)
    return { opacity: e * (1 - x), y: 26 * (1 - e) - 26 * x, blur: 8 * (1 - e) + 8 * x }
}

function stepOverride(index: number) {
    return (Component: ComponentType<any>): ComponentType =>
        forwardRef(function CopyStep(props: any, ref: Ref<any>) {
            const isStatic = useIsStaticRenderer()
            const [own, setRef] = useOwnRef(ref)
            useIsoLayoutEffect(() => {
                const el = own.current
                if (!el || isStatic) return
                el.dataset.ioStep = STEP_KEYS[index]
                const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
                let shown = el.style.visibility
                const paint = (ph: number[]) => {
                    const s = reduced ? { opacity: stepLook(ph[index]).opacity, y: 0, blur: 0 } : stepLook(ph[index])
                    const k = window.innerWidth < 810 ? 0.6 : 1
                    const st = el.style
                    st.opacity = String(s.opacity)
                    st.setProperty("translate", `0px ${(s.y * k).toFixed(2)}px`)
                    st.filter = s.blur > 0.05 ? `blur(${s.blur.toFixed(2)}px)` : ""
                    const next = s.opacity < 0.01 ? "hidden" : ""
                    if (next !== shown) {
                        shown = next
                        st.visibility = next
                        st.pointerEvents = next ? "none" : ""
                    }
                }
                const stop = followSteps(findTrack(el), paint, reduced)
                return () => {
                    stop()
                    delete el.dataset.ioStep
                    for (const k of ["opacity", "translate", "filter", "visibility", "pointer-events"]) el.style.removeProperty(k)
                }
            }, [isStatic])
            // The server sends line 2 and the paragraph hidden (no flash of every line on refresh). On the canvas
            // the full header shows and the paragraph is hidden (pick it in the Layers panel to edit it).
            const hide = isStatic ? index === PARA : index !== HEADER
            const style = !hide ? props.style : isStatic ? { ...props.style, opacity: 0 } : { ...props.style, opacity: 0, visibility: "hidden" }
            return <Component ref={setRef} {...props} style={style} />
        })
}

/** Homepage 11, line 2 of the header ("for the moment AI meets a real person."): rises in under "I design/". */
export function withStepLine2(Component: ComponentType<any>): ComponentType {
    return stepOverride(FORM)(Component)
}
/** Homepage 11, the header ("I design/" + line 2): leaves upward to make room for the paragraph. */
export function withStepHeader(Component: ComponentType<any>): ComponentType {
    return stepOverride(HEADER)(Component)
}
/** Homepage 11, the paragraph (10+ years): comes in once the header is gone, then leaves too. */
export function withStepParagraph(Component: ComponentType<any>): ComponentType {
    return stepOverride(PARA)(Component)
}

/**
 * Homepage 11, the "Scroll" hint at the bottom of the stage (Oct 19): there on landing, sinks away as line 2 rises
 * in, and comes back if you scroll back to the top. Put it on the frame around the ScrollHint component, not on the
 * component itself (a code component doesn't hand its element to an override).
 */
export function withStepScrollHint(Component: ComponentType<any>): ComponentType {
    return forwardRef(function ScrollHintStep(props: any, ref: Ref<any>) {
        const isStatic = useIsStaticRenderer()
        const [own, setRef] = useOwnRef(ref)
        useIsoLayoutEffect(() => {
            const el = own.current
            if (!el || isStatic) return
            const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
            let shown = ""
            const paint = (ph: number[]) => {
                const x = clamp01(ph[FORM])
                const st = el.style
                st.opacity = String(1 - x)
                st.setProperty("translate", `0px ${(14 * x).toFixed(2)}px`)
                const next = x > 0.99 ? "hidden" : ""
                if (next !== shown) {
                    shown = next
                    st.visibility = next
                    st.pointerEvents = next ? "none" : ""
                }
            }
            const stop = followSteps(findTrack(el), paint, reduced)
            return () => {
                stop()
                for (const k of ["opacity", "translate", "visibility", "pointer-events"]) el.style.removeProperty(k)
            }
        }, [isStatic])
        return <Component ref={setRef} {...props} />
    })
}

// ── Objects in depth ──────────────────────────────────────────────────────────────────────────────────────────
// His clay stills (transparent WebP, the same ones as the intro).
const CLAY = [
    { src: "https://framerusercontent.com/images/GZ7ltRMxOLG1Dl2fB7LdYIujjg.webp", alt: "Clay concha" },
    { src: "https://framerusercontent.com/images/oJWOzjsoIpt7JLejqzl4I1WbAp4.webp", alt: "Clay pizza" },
    { src: "https://framerusercontent.com/images/G7kUeulTgMVDgL0KdpIJzyhrL8.webp", alt: "Clay Statue of Liberty" },
    { src: "https://framerusercontent.com/images/IJ4v1DFwdMVVWv6GBbPgtLA3fs.webp", alt: "Clay taco" },
    { src: "https://framerusercontent.com/images/3qXZMDiMk9rlAQv1OMEB0WXDjJc.webp", alt: "Clay Dragon Ball" },
    { src: "https://framerusercontent.com/images/sxQHvbBGfY9UcjdXmi1CX2jHQ.webp", alt: "Clay candy skull" },
    { src: "https://framerusercontent.com/images/CIaDHs03xx80z7e3aJyfJhnPVE.webp", alt: "Clay beer bottle" },
    { src: "https://framerusercontent.com/images/uv1gEP7i6lDXaHnBjwoAqSPbJk.webp", alt: "Clay A train coin" },
    { src: "https://framerusercontent.com/images/x4GWujFlQHQEfLyxTiGDEtRLZwk.webp", alt: "Clay boxing glove" },
    { src: "https://framerusercontent.com/images/0g742sol6L6HsgEQmligfq2U9M.webp", alt: "Clay rainbow" },
    { src: "https://framerusercontent.com/images/SeSrl7KlX1bsHnal18ztjJKT2I.webp", alt: "Clay Evangelion" },
    { src: "https://framerusercontent.com/images/qeREjdnZusv1jJ0oSFtoLMPbo.webp", alt: "Clay kettlebell" },
    { src: "https://framerusercontent.com/images/HtuqR8xeYER3wxXjwFxPw4tBFU.webp", alt: "Clay moon wand" },
    { src: "https://framerusercontent.com/images/qtSEzW2E7DYzsmtfe0FBZvFKWs.webp", alt: "Clay Virgin of Guadalupe" },
    { src: "https://framerusercontent.com/images/gYfvYKJ3gfPKK27NtQSYThTxU.webp", alt: "Clay dumbbell" },
]

// Lanes: where each object sits at "arm's length" (z = 0), as shares of the stage, its width (share of the
// screen's longer side) and its resting turn. Far away the perspective pulls them toward the center; up close it
// pushes them out past the edges. They keep to the top and bottom bands and the far edges, so the copy in the middle stays clear.
type Lane = { x: number; y: number; w: number; r: number }
const WIDE: Lane[] = [
    { x: 0.08, y: 0.16, w: 0.15, r: -8 },
    { x: 0.92, y: 0.8, w: 0.17, r: 7 },
    { x: 0.78, y: 0.1, w: 0.14, r: 9 },
    { x: 0.2, y: 0.88, w: 0.14, r: -6 },
    { x: 0.98, y: 0.45, w: 0.16, r: 5 },
    { x: 0.45, y: 0.04, w: 0.12, r: -10 },
    { x: 0.02, y: 0.6, w: 0.16, r: 8 },
    { x: 0.62, y: 0.95, w: 0.13, r: 6 },
    { x: 0.94, y: 0.2, w: 0.14, r: -5 },
    { x: 0.06, y: 0.82, w: 0.15, r: 9 },
    { x: 0.3, y: 0.07, w: 0.13, r: -9 },
    { x: 0.85, y: 0.93, w: 0.14, r: 4 },
    { x: 0.02, y: 0.3, w: 0.14, r: -7 },
    { x: 0.38, y: 0.96, w: 0.13, r: 7 },
]
// Phones (portrait): the copy fills the width, so the objects keep to the top and bottom bands and the far edges.
const TALL: Lane[] = [
    { x: 0.2, y: 0.1, w: 0.14, r: -8 },
    { x: 0.8, y: 0.9, w: 0.15, r: 7 },
    { x: 0.82, y: 0.12, w: 0.13, r: 9 },
    { x: 0.18, y: 0.9, w: 0.14, r: -6 },
    { x: 0.5, y: 0.03, w: 0.12, r: 5 },
    { x: 0.98, y: 0.8, w: 0.13, r: -9 },
    { x: 0.02, y: 0.2, w: 0.12, r: -5 },
    { x: 0.5, y: 0.97, w: 0.12, r: 8 },
    { x: 0.98, y: 0.18, w: 0.12, r: 6 },
    { x: 0.02, y: 0.82, w: 0.13, r: -7 },
]

// Depth, in % of the screen height (CSS translateZ in vh), seen through a 250vh perspective (as microsoft.ai).
const PERSPECTIVE = 250
const Z_FAR = -300 // invisible from here on
const Z_GONE = 50 // toward: passed the camera
const Z_ENTER = 90 // away: just outside the screen, about to come in
const GAP = 55 // depth between two objects in the queue (the default "Spacing")
const FADE_S = 0.9 // s: the objects fade in (and, with "Start hidden", back out at the very top)
const START_AT = 0.01 // "Start hidden" (homepage 11, Oct 19): the objects show once you've scrolled this share of the hero

// Opacity and blur by depth. toward: fades in from far, sharpest at -100 (where the nearest one sits on arrival),
// blurs again up close (depth of field).
function towardAt(z: number, maxBlur: number) {
    const opacity = z < -120 ? clamp01((z - Z_FAR) / 180) : z > -10 ? clamp01(1 - (z + 10) / (Z_GONE + 10)) : 1
    const blur = Math.min(maxBlur, Math.abs(z + 100) * 0.075)
    return { opacity, blur }
}
// away: fades in at the screen edge, sharp most of the way, then blurs a little and fades out near the end.
function awayAt(z: number, maxBlur: number) {
    const opacity = z > 50 ? clamp01((Z_ENTER - z) / (Z_ENTER - 50)) : z < -160 ? clamp01((z - Z_FAR) / 140) : 1
    const blur = z < -110 ? Math.min(maxBlur, ((-110 - z) / 190) * maxBlur) : 0
    return { opacity, blur }
}

// Objects passing behind the copy soften to 30%, so the words stay readable. The copy zone is an ellipse in the
// middle of the stage (half-width, half-height as shares of the stage).
const ZONE_WIDE = { rx: 0.36, ry: 0.2 }
const ZONE_TALL = { rx: 0.5, ry: 0.17 }
function behindCopy(lane: Lane, z: number, zone: { rx: number; ry: number }) {
    const k = PERSPECTIVE / (PERSPECTIVE - z) // how much the perspective scales its distance from the center
    const dx = ((lane.x - 0.5) * k) / zone.rx
    const dy = ((lane.y - 0.5) * k) / zone.ry
    const t = clamp01((Math.sqrt(dx * dx + dy * dy) - 0.6) / 0.4)
    return 0.3 + 0.7 * t * t * (3 - 2 * t)
}

interface HeroDepthProps {
    direction: "toward" | "away"
    images: { src: string; alt?: string }[]
    count: number
    phoneCount: number
    size: number
    blur: number
    spacing: number
    float: boolean
    startHidden: boolean
    style?: CSSProperties
}

const BOB_CSS = `@keyframes ioDepthBob{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-7px) rotate(1.6deg)}}`

/**
 * Clay objects traveling through depth as the hero scrolls (see the top of the file). Place it absolute, filling
 * the sticky stage inside #hero, behind the copy.
 *
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 800
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function HeroDepth(props: HeroDepthProps) {
    const { direction = "toward", images, count = 14, phoneCount = 9, size = 100, blur = 14, spacing = GAP, float = true, startHidden = false } = props
    const isStatic = useIsStaticRenderer()
    const root = useRef<HTMLDivElement>(null)
    const items = useRef<(HTMLDivElement | null)[]>([])
    // Phones get their own lanes and fewer objects; decided after mount (the server doesn't know the screen).
    const [tall, setTall] = useState<boolean | null>(isStatic ? false : null)

    const list = images && images.length && images.some((i) => i?.src) ? images.filter((i) => i?.src) : CLAY
    const lanes = tall ? TALL : WIDE
    const n = Math.max(1, Math.round(tall ? phoneCount : count))
    const maxBlur = tall ? Math.min(blur, 8) : blur
    const zone = tall ? ZONE_TALL : ZONE_WIDE
    const toward = direction !== "away"
    // Where each object starts and how far the whole queue travels, so the last one just finishes at the end.
    // More objects or more spacing = a longer queue in the same scroll, so each one goes by faster.
    const gap = Math.max(20, spacing)
    const start = (i: number) => (toward ? -90 - i * gap : -120 + i * gap)
    const travel = toward ? Z_GONE - start(n - 1) : start(n - 1) - Z_FAR
    const zAt = (i: number, p: number) => (toward ? start(i) + p * travel : start(i) - p * travel)

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        const check = () => setTall(window.innerWidth < 810 && window.innerHeight > window.innerWidth)
        check()
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [isStatic])

    useEffect(() => {
        const el = root.current
        if (isStatic || tall === null || !el) return
        const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
        // Objects fade in over the first 0.9s after load, so the page doesn't open on a pop. With "Start hidden"
        // they wait for the first scroll (the visitor lands on the name tag and the headline alone), and fade back
        // out if you scroll all the way back to the top.
        let raw = 0
        let fade = 0
        let last = 0
        let raf = 0
        let prev = 0
        const goal = () => (startHidden && last <= START_AT ? 0 : 1)
        const fadeStep = (now: number) => {
            const dt = Math.min(0.064, Math.max(0, now - prev) / 1000)
            prev = now
            const g = goal()
            raw = g > raw ? Math.min(g, raw + dt / FADE_S) : Math.max(g, raw - dt / FADE_S)
            fade = easeInOut(raw)
            raf = 0
            paint(last)
        }
        const look = toward ? towardAt : awayAt
        const paint = (p: number) => {
            last = p
            if (reduced) fade = raw = goal()
            else if (!raf && raw !== goal()) {
                prev = performance.now()
                raf = requestAnimationFrame(fadeStep)
            }
            // Whatever is still on stage fades out over the last tenth, so nothing gets cut by the section's edge
            // when the stage lets go.
            const end = 1 - easeInOut(local(p, 0.9, 1))
            for (let i = 0; i < n; i++) {
                const node = items.current[i]
                if (!node) continue
                const z = zAt(i, p)
                const hidden = toward ? z <= Z_FAR || z >= Z_GONE : z >= Z_ENTER || z <= Z_FAR
                if (hidden) {
                    if (node.style.display !== "none") node.style.display = "none"
                    continue
                }
                if (node.style.display === "none") node.style.display = ""
                const { opacity, blur: b } = look(z, maxBlur)
                const lane = lanes[i % lanes.length]
                node.style.opacity = String(opacity * behindCopy(lane, z, zone) * fade * end)
                node.style.transform = `translate(-50%, -50%) translate3d(0, 0, ${z.toFixed(2)}vh) rotate(${lane.r}deg)`
                node.style.filter = b > 0.2 ? `blur(${b.toFixed(1)}px)` : ""
                node.style.zIndex = String(Math.round(1000 + z))
            }
        }
        const stop = followTrack(findTrack(el), paint, reduced)
        return () => {
            stop()
            cancelAnimationFrame(raf)
        }
    }, [isStatic, tall, direction, n, gap, maxBlur, lanes, zone, startHidden])

    // The canvas and the server show the opening frame (progress 0).
    const initial = (i: number): CSSProperties => {
        const z = zAt(i, 0)
        const hidden = toward ? z <= Z_FAR || z >= Z_GONE : z >= Z_ENTER || z <= Z_FAR
        const { opacity, blur: b } = (toward ? towardAt : awayAt)(z, maxBlur)
        const lane = lanes[i % lanes.length]
        return {
            display: hidden ? "none" : undefined,
            opacity: isStatic ? opacity * behindCopy(lane, z, zone) : 0,
            transform: `translate(-50%, -50%) translate3d(0, 0, ${z}vh) rotate(${lane.r}deg)`,
            filter: b > 0.2 ? `blur(${b.toFixed(1)}px)` : undefined,
            zIndex: Math.round(1000 + z),
        }
    }

    return (
        <div
            ref={root}
            aria-hidden="true"
            style={{
                ...props.style,
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                pointerEvents: "none",
                perspective: `${PERSPECTIVE}vh`,
                perspectiveOrigin: "50% 50%",
            }}
        >
            {float && <style>{BOB_CSS}</style>}
            {tall !== null &&
                Array.from({ length: n }, (_, i) => {
                    const lane = lanes[i % lanes.length]
                    const img = list[i % list.length]
                    return (
                        <div
                            key={`${tall ? "t" : "w"}${i}`}
                            ref={(el) => {
                                items.current[i] = el
                            }}
                            style={{
                                position: "absolute",
                                left: `${lane.x * 100}%`,
                                top: `${lane.y * 100}%`,
                                width: `${lane.w * size}vmax`,
                                willChange: "transform, opacity, filter",
                                ...initial(i),
                            }}
                        >
                            <div style={float ? { animation: `ioDepthBob ${5.5 + (i % 4) * 0.9}s ease-in-out ${-i * 1.3}s infinite` } : undefined}>
                                <img src={img.src} alt="" decoding="async" draggable={false} style={{ display: "block", width: "100%", height: "auto", userSelect: "none" }} />
                            </div>
                        </div>
                    )
                })}
        </div>
    )
}

addPropertyControls(HeroDepth, {
    direction: {
        type: ControlType.Enum,
        title: "Direction",
        options: ["toward", "away"],
        optionTitles: ["Toward you", "Away, to the center"],
        defaultValue: "toward",
    },
    images: {
        type: ControlType.Array,
        title: "Images",
        control: { type: ControlType.ResponsiveImage },
        description: "Transparent PNG or WebP. Empty = the clay stills.",
    },
    count: { type: ControlType.Number, title: "Objects", defaultValue: 14, min: 4, max: 40, step: 1 },
    phoneCount: { type: ControlType.Number, title: "Phone objects", defaultValue: 9, min: 3, max: 30, step: 1 },
    size: { type: ControlType.Number, title: "Size", defaultValue: 100, min: 50, max: 160, step: 5, unit: "%" },
    blur: { type: ControlType.Number, title: "Max blur", defaultValue: 14, min: 0, max: 24, step: 1, unit: "px" },
    spacing: {
        type: ControlType.Number,
        title: "Spacing",
        defaultValue: GAP,
        min: 20,
        max: 160,
        step: 5,
        description: "Depth between objects. More spacing (or more objects) = each one goes by faster.",
    },
    float: { type: ControlType.Boolean, title: "Float", defaultValue: true },
    startHidden: {
        type: ControlType.Boolean,
        title: "Start hidden",
        defaultValue: false,
        description: "Hidden on landing; the objects fade in once you start scrolling.",
    },
})
