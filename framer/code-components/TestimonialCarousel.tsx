import * as React from "react"
import { ComponentType } from "react"
// @ts-ignore — URL import: Framer's bundler resolves this at build time; TS has no types for URL imports
import { gsap } from "https://esm.sh/gsap@3.12.5"

// Separate store from the projects carousel so the two don't interfere.
const store = {
    api: null as null | { next: () => void; prev: () => void },
}

const VISIBLE = 3 // cards shown at once
const BLUR = 6 // subtle motion blur during the slide

function assignRef<T>(ref: React.Ref<T> | undefined, value: T) {
    if (!ref) return
    if (typeof ref === "function") {
        ref(value)
        return
    }
    try {
        ;(ref as React.MutableRefObject<T>).current = value
    } catch {
        // no-op
    }
}

function getCards(container: HTMLElement): HTMLElement[] {
    let kids = Array.from(container.children) as HTMLElement[]
    if (kids.length === 1 && kids[0].children.length > 1) {
        kids = Array.from(kids[0].children) as HTMLElement[]
    }
    return kids
}

export function withTestimonialTrack(Component: ComponentType<any>): ComponentType {
    return React.forwardRef<HTMLElement, any>(function WithTestimonialTrack(props, ref) {
        const containerRef = React.useRef<HTMLElement | null>(null)
        const indexRef = React.useRef(0)

        const setRefs = React.useCallback(
            (node: HTMLElement | null) => {
                containerRef.current = node
                assignRef(ref, node as any)
            },
            [ref]
        )

        React.useEffect(() => {
            const container = containerRef.current
            if (!container || typeof window === "undefined") return

            const cards = getCards(container)
            if (cards.length === 0) return

            container.style.overflow = "hidden"
            container.style.position = "relative"
            container.style.touchAction = "pan-y"
            container.style.cursor = cards.length > VISIBLE ? "grab" : "default"
            container.style.userSelect = "none"

            let gap = 0
            let cardW = 0
            let step = 0
            const maxIndex = () => Math.max(0, cards.length - VISIBLE)

            const measure = () => {
                gap = parseFloat(getComputedStyle(container).columnGap || "0") || 0
                cardW = (container.clientWidth - gap * (VISIBLE - 1)) / VISIBLE
                step = cardW + gap
                cards.forEach((c) => {
                    c.style.flex = "0 0 " + cardW + "px"
                    c.style.width = cardW + "px"
                    c.style.willChange = "transform, filter"
                    c.style.setProperty("--blur", "0px")
                    c.style.filter = "blur(var(--blur))"
                })
            }
            measure()

            const setX = (x: number) => gsap.set(cards, { x })
            setX(-indexRef.current * step)

            const animateTo = (i: number) => {
                gsap.to(cards, { x: -i * step, duration: 0.6, ease: "power3.inOut" })
                // Light motion blur that clears as the cards settle.
                gsap.fromTo(
                    cards,
                    { "--blur": BLUR + "px" },
                    { "--blur": "0px", duration: 0.6, ease: "power2.out" }
                )
            }

            const go = (dir: number) => {
                const ni = Math.max(0, Math.min(maxIndex(), indexRef.current + dir))
                if (ni === indexRef.current) {
                    gsap.fromTo(
                        cards,
                        { x: -indexRef.current * step - dir * 18 },
                        { x: -indexRef.current * step, duration: 0.4, ease: "power2.out" }
                    )
                    return
                }
                indexRef.current = ni
                animateTo(ni)
            }
            store.api = { next: () => go(1), prev: () => go(-1) }

            // Drag / swipe.
            let down = false
            let startX = 0
            let baseX = 0
            let dragged = false
            const onDown = (e: PointerEvent) => {
                if (cards.length <= VISIBLE) return
                down = true
                dragged = false
                startX = e.clientX
                baseX = -indexRef.current * step
                container.style.cursor = "grabbing"
                gsap.killTweensOf(cards)
            }
            const onMove = (e: PointerEvent) => {
                if (!down) return
                const dx = e.clientX - startX
                if (Math.abs(dx) > 4) dragged = true
                let x = baseX + dx
                const minX = -maxIndex() * step
                if (x > 0) x = x * 0.3
                if (x < minX) x = minX + (x - minX) * 0.3
                setX(x)
            }
            const onUp = (e: PointerEvent) => {
                if (!down) return
                down = false
                container.style.cursor = "grab"
                const x = baseX + (e.clientX - startX)
                const ni = Math.max(0, Math.min(maxIndex(), Math.round(-x / step)))
                indexRef.current = ni
                animateTo(ni)
            }
            container.addEventListener("pointerdown", onDown)
            window.addEventListener("pointermove", onMove)
            window.addEventListener("pointerup", onUp)

            const onClickCapture = (e: MouseEvent) => {
                if (dragged) {
                    e.preventDefault()
                    e.stopPropagation()
                    dragged = false
                }
            }
            container.addEventListener("click", onClickCapture, true)

            // Horizontal trackpad swipe — leave vertical page scroll alone.
            let wheelLock = false
            const onWheel = (e: WheelEvent) => {
                if (cards.length <= VISIBLE) return
                if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
                if (Math.abs(e.deltaX) < 20) return
                e.preventDefault()
                if (wheelLock) return
                wheelLock = true
                window.setTimeout(() => {
                    wheelLock = false
                }, 600)
                go(e.deltaX > 0 ? 1 : -1)
            }
            container.addEventListener("wheel", onWheel, { passive: false })

            const onResize = () => {
                measure()
                gsap.set(cards, { x: -indexRef.current * step })
            }
            window.addEventListener("resize", onResize)

            return () => {
                container.removeEventListener("pointerdown", onDown)
                window.removeEventListener("pointermove", onMove)
                window.removeEventListener("pointerup", onUp)
                container.removeEventListener("click", onClickCapture, true)
                container.removeEventListener("wheel", onWheel)
                window.removeEventListener("resize", onResize)
                gsap.killTweensOf(cards)
                store.api = null
            }
        }, [])

        return <Component {...props} ref={setRefs} style={{ ...props.style }} />
    })
}

export function withTestimonialPrev(Component: ComponentType<any>): ComponentType {
    return React.forwardRef<any, any>(function WithTestimonialPrev(props, ref) {
        const handleClick = React.useCallback(
            (event: any) => {
                if (typeof props.onClick === "function") props.onClick(event)
                if (typeof window === "undefined") return
                store.api?.prev()
            },
            [props]
        )
        return (
            <Component
                {...props}
                ref={ref}
                onClick={handleClick}
                style={{ ...props.style, cursor: "pointer" }}
            />
        )
    })
}

export function withTestimonialNext(Component: ComponentType<any>): ComponentType {
    return React.forwardRef<any, any>(function WithTestimonialNext(props, ref) {
        const handleClick = React.useCallback(
            (event: any) => {
                if (typeof props.onClick === "function") props.onClick(event)
                if (typeof window === "undefined") return
                store.api?.next()
            },
            [props]
        )
        return (
            <Component
                {...props}
                ref={ref}
                onClick={handleClick}
                style={{ ...props.style, cursor: "pointer" }}
            />
        )
    })
}
