import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, type ComponentType, type Ref } from "react"
import { useIsStaticRenderer } from "framer"
import { useScroll, useSpring } from "framer-motion"

// "Dock" entrance (inspired by realfood.gov): the frame comes up from the bottom of the screen as wide as the
// screen, then settles into its real size and place as it rises, like a boat docking. It follows the scroll
// (on a spring, so it feels soft) and plays backwards when you scroll up.
//
//   withDock      rooms (black boxes, contact rooms): the box's own color grows out to the screen edges on
//                 every side, with rounded corners, then pulls back in. Text and layout never move sideways.
//   withDockCard  cards (Selected work deck): the whole card starts scaled up to the screen width and
//                 shrinks into place. Used where a card has a border or inner frame, so you never see a
//                 "second card" inside the wider shape.
//
// Round 14 (Oct 9): no clip-path anymore (it cut the top flat), cards scale instead of spreading.
// Round 15: more exaggerated. Starts at 110% of the screen width (5% past each edge), rises 240px, and lands
// later (when its top reaches 15% from the top of the screen).

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const OVERSHOOT = 1.1 // starting width, as a share of the screen

type Mode = "spread" | "scale"

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

function makeDock(mode: Mode, end: string, lift: number) {
    return function (Component: ComponentType<any>): ComponentType {
        return forwardRef(function Docked(props: any, ref: Ref<any>) {
            const isStatic = useIsStaticRenderer()
            const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
            const play = !isStatic && !reduced
            const [own, setRef] = useOwnRef(ref)
            const { scrollYProgress } = useScroll({ target: own, offset: ["start end", end as any] })
            const p = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.7 })

            useIsoLayoutEffect(() => {
                const el = own.current
                if (!play || !el || typeof window === "undefined") return
                // The frame's own color. On a component instance it can sit one layer in.
                const clear = (c: string) => !c || c === "transparent" || /rgba\(.*,\s*0\)$/.test(c)
                let paintEl: HTMLElement = el
                if (clear(window.getComputedStyle(el).backgroundColor)) {
                    const inner = Array.from(el.children).find((c) => !clear(window.getComputedStyle(c).backgroundColor)) as HTMLElement | undefined
                    if (inner) paintEl = inner
                }
                const color = window.getComputedStyle(paintEl).backgroundColor
                const baseShadow = window.getComputedStyle(paintEl).boxShadow
                const keepShadow = baseShadow && baseShadow !== "none" ? baseShadow : ""
                let gap = 0 // px between the frame and the screen edge (each side)
                let grow = 1 // scale that makes the frame as wide as the screen

                const measure = () => {
                    const w = el.offsetWidth || 1
                    const screen = document.documentElement.clientWidth
                    gap = Math.max(0, (screen * OVERSHOOT - w) / 2)
                    grow = Math.max(1, (screen * OVERSHOOT) / w)
                }

                const paint = (v: number) => {
                    const e = easeOut(Math.min(1, Math.max(0, v)))
                    if (e >= 0.999) {
                        paintEl.style.boxShadow = ""
                        el.style.scale = ""
                        el.style.translate = ""
                        return
                    }
                    const k = 1 - e
                    if (mode === "spread") {
                        paintEl.style.boxShadow = `0 0 0 ${(gap * k).toFixed(1)}px ${color}${keepShadow ? ", " + keepShadow : ""}`
                    } else {
                        el.style.scale = (1 + (grow - 1) * k).toFixed(4)
                    }
                    el.style.translate = `0px ${(lift * k).toFixed(1)}px`
                }

                measure()
                paint(p.get())
                const unsub = p.on("change", paint)
                let ro: ResizeObserver | null = null
                if (typeof ResizeObserver !== "undefined") {
                    ro = new ResizeObserver(() => {
                        measure()
                        paint(p.get())
                    })
                    ro.observe(document.documentElement)
                }
                return () => {
                    unsub()
                    ro?.disconnect()
                    paintEl.style.boxShadow = ""
                    el.style.scale = ""
                    el.style.translate = ""
                }
            }, [play])

            return <Component ref={setRef} {...props} />
        })
    }
}

/** Rooms: the black box grows out to the screen edges as it arrives, rises ~240px and docks into its frame. */
export function withDock(Component: ComponentType<any>): ComponentType {
    return makeDock("spread", "start 0.15", 240)(Component)
}

/** Deck cards: the card arrives as wide as the screen, then shrinks and rises into its place. */
export function withDockCard(Component: ComponentType<any>): ComponentType {
    return makeDock("scale", "start 0.15", 240)(Component)
}

/** Kept for older layers that used it: same as the card version. */
export function withDockInRoom(Component: ComponentType<any>): ComponentType {
    return makeDock("scale", "start 0.3", 120)(Component)
}
