import * as React from "react"
import { ComponentType } from "react"
// @ts-ignore — URL import: Framer's bundler resolves this at build time; TS has no types for URL imports
import { gsap } from "https://esm.sh/gsap@3.12.5"

// Shared control surface so the arrow overrides can drive the track override.
const store = {
    api: null as null | { next: () => void; prev: () => void },
}

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

function getSlides(container: HTMLElement): HTMLElement[] {
    let kids = Array.from(container.children) as HTMLElement[]
    if (kids.length === 1 && kids[0].children.length > 1) {
        kids = Array.from(kids[0].children) as HTMLElement[]
    }
    return kids
}

const BLUR = 16 // px of blur at the start/end of a transition
const SHIFT_RATIO = 0.22 // how far a card travels, as a fraction of its width (~22%)

export function withCarouselTrack(Component: ComponentType<any>): ComponentType {
    return React.forwardRef<HTMLElement, any>(function WithCarouselTrack(props, ref) {
        const containerRef = React.useRef<HTMLElement | null>(null)
        const indexRef = React.useRef(0)
        const animatingRef = React.useRef(false)

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

            const slides = getSlides(container)
            if (slides.length === 0) return

            // Reserve the tallest card so the container never collapses, then stack
            // every card in the same spot (slide 0 stays in flow to hold height).
            const maxH = Math.max(...slides.map((s) => s.offsetHeight))
            if (maxH > 0) container.style.minHeight = maxH + "px"
            container.style.position = "relative"
            // Visible overflow so the blurred card edges feather out instead of
            // being sharply clipped at the track boundary.
            container.style.overflow = "visible"
            container.style.overflowX = "visible"
            container.style.overflowY = "visible"
            container.style.touchAction = "pan-y"
            container.style.cursor = "grab"
            container.style.userSelect = "none"
            slides.forEach((s, i) => {
                s.style.position = i === 0 ? "relative" : "absolute"
                if (i !== 0) {
                    s.style.top = "0"
                    s.style.left = "0"
                    s.style.right = "0"
                    s.style.bottom = "0"
                }
                s.style.width = "100%"
                // Lite: no permanent filter/will-change — they're only switched on
                // while a slide is moving (see `go`), so idle cards stay cheap to draw.
                s.style.setProperty("--blur", "0px")
                s.style.opacity = i === 0 ? "1" : "0"
                s.style.pointerEvents = i === 0 ? "auto" : "none"
            })

            // dir = +1 => next (incoming slides in from the right, right-to-left)
            // dir = -1 => prev (incoming slides in from the left, left-to-right)
            const go = (dir: number) => {
                const list = getSlides(container)
                const n = list.length
                if (n === 0 || animatingRef.current) return
                const next = ((indexRef.current + dir) % n + n) % n
                if (next === indexRef.current) return
                animatingRef.current = true

                const currEl = list[indexRef.current]
                const nextEl = list[next]
                const shift = container.clientWidth * SHIFT_RATIO
                gsap.killTweensOf([currEl, nextEl])
                currEl.style.pointerEvents = "none"
                nextEl.style.pointerEvents = "none"
                for (const el of [currEl, nextEl]) {
                    el.style.willChange = "transform, opacity, filter"
                    el.style.filter = "blur(var(--blur))"
                }
                const settle = (el: HTMLElement) => {
                    el.style.filter = "none"
                    el.style.willChange = "auto"
                }

                // Outgoing: travels ~22% of its width while fading + blurring out.
                gsap.to(currEl, {
                    opacity: 0,
                    x: -dir * shift,
                    "--blur": BLUR + "px",
                    duration: 0.55,
                    ease: "power2.in",
                    onComplete: () => settle(currEl),
                })

                // Incoming: starts ~22% offset + blurred, slides into place + sharpens.
                gsap.fromTo(
                    nextEl,
                    { opacity: 0, x: dir * shift, "--blur": BLUR + "px" },
                    {
                        opacity: 1,
                        x: 0,
                        "--blur": "0px",
                        duration: 0.7,
                        ease: "power2.out",
                        delay: 0.1,
                        onComplete: () => {
                            settle(nextEl)
                            nextEl.style.pointerEvents = "auto"
                            animatingRef.current = false
                        },
                    }
                )
                indexRef.current = next
            }

            store.api = { next: () => go(1), prev: () => go(-1) }

            // Drag / swipe.
            let down = false
            let startX = 0
            let startY = 0
            const onDown = (e: PointerEvent) => {
                down = true
                startX = e.clientX
                startY = e.clientY
                container.style.cursor = "grabbing"
            }
            const onUp = (e: PointerEvent) => {
                if (!down) return
                down = false
                container.style.cursor = "grab"
                const dx = e.clientX - startX
                const dy = e.clientY - startY
                if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
                    if (dx < 0) store.api?.next()
                    else store.api?.prev()
                }
            }
            container.addEventListener("pointerdown", onDown)
            window.addEventListener("pointerup", onUp)

            // Horizontal trackpad swipe — leave vertical page scroll alone.
            let wheelLock = false
            const onWheel = (e: WheelEvent) => {
                if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
                if (Math.abs(e.deltaX) < 20) return
                e.preventDefault()
                if (wheelLock) return
                wheelLock = true
                window.setTimeout(() => {
                    wheelLock = false
                }, 650)
                if (e.deltaX > 0) store.api?.next()
                else store.api?.prev()
            }
            container.addEventListener("wheel", onWheel, { passive: false })

            return () => {
                container.removeEventListener("pointerdown", onDown)
                window.removeEventListener("pointerup", onUp)
                container.removeEventListener("wheel", onWheel)
                gsap.killTweensOf(slides)
                store.api = null
            }
        }, [])

        return <Component {...props} ref={setRefs} style={{ ...props.style }} />
    })
}

export function withCarouselPrev(Component: ComponentType<any>): ComponentType {
    return React.forwardRef<any, any>(function WithCarouselPrev(props, ref) {
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

export function withCarouselNext(Component: ComponentType<any>): ComponentType {
    return React.forwardRef<any, any>(function WithCarouselNext(props, ref) {
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
