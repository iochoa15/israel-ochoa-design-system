import * as React from "react"
import { ComponentType } from "react"
import { useIsStaticRenderer } from "framer"

// Hero sequence for the landing stage:
// 1. withHeroCard      — MainCard rises from below the viewport to the center.
// 2. withTopStatsDrop  — once the card has settled, TopStats drops in from the top…
// 3. withMainNavRise   — …while MainNav slides up from the bottom, at the same time.
// Both bars then stay put for the rest of the page. Scrolling back above the
// landing stage reverses everything. HeroTypewriter (auto mode) listens to the
// same "landed" signal to start typing.

const HERO_EVENT = "io-hero"
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)" // expo-out: quick start, long soft settle
const CARD_MS = 1300
const CHROME_MS = 1000
const LAND_AT = 0.8 // fraction of the card rise after which the bars start moving
const ENTER_AT = 0.12 // rise once the landing stage top is within 12% of the viewport top
const LEAVE_AT = 0.55 // reset once scrolled back up so the stage top sits below 55%

function setHeroLanded(landed: boolean) {
    if (typeof window === "undefined") return
    ;(window as any).__ioHeroLanded = landed
    window.dispatchEvent(new CustomEvent(HERO_EVENT, { detail: { landed } }))
}

function useHeroLanded(): boolean {
    const [landed, setLanded] = React.useState(false)
    React.useEffect(() => {
        if (typeof window === "undefined") return
        setLanded(Boolean((window as any).__ioHeroLanded))
        const onHero = (e: Event) =>
            setLanded(Boolean((e as CustomEvent).detail?.landed))
        window.addEventListener(HERO_EVENT, onHero)
        return () => window.removeEventListener(HERO_EVENT, onHero)
    }, [])
    return landed
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

// Nearest ancestor taller than the viewport — the scroll stage the card is pinned inside.
function findStage(el: HTMLElement): HTMLElement | null {
    let stage = el.parentElement
    while (stage && stage.offsetHeight <= window.innerHeight * 1.2) {
        stage = stage.parentElement
    }
    return stage
}

export function withHeroCard(Component: ComponentType<any>): ComponentType {
    return React.forwardRef<HTMLElement, any>(function WithHeroCard(props, ref) {
        const isStatic = useIsStaticRenderer()
        const elRef = React.useRef<HTMLElement | null>(null)
        const [risen, setRisen] = React.useState(false)

        const setRefs = React.useCallback(
            (node: HTMLElement | null) => {
                elRef.current = node
                assignRef(ref, node as any)
            },
            [ref]
        )

        React.useEffect(() => {
            if (isStatic || typeof window === "undefined") return
            const el = elRef.current
            if (!el) {
                // Can't measure — never leave the card stuck off-screen.
                setRisen(true)
                setHeroLanded(true)
                return
            }
            const stage = findStage(el)
            let isUp = false
            let landTimer = 0
            let raf = 0
            let lastResize = 0

            const check = () => {
                raf = 0
                // StageSnap restores the scroll spot right after a resize — don't
                // react to the in-between position or the card would drop and re-rise.
                if (performance.now() - lastResize < 400) return
                const top = (stage ?? el).getBoundingClientRect().top
                const vh = window.innerHeight
                if (!isUp && top <= vh * ENTER_AT) {
                    isUp = true
                    setRisen(true)
                    window.clearTimeout(landTimer)
                    landTimer = window.setTimeout(
                        () => setHeroLanded(true),
                        CARD_MS * LAND_AT
                    )
                } else if (isUp && top > vh * LEAVE_AT) {
                    isUp = false
                    setRisen(false)
                    window.clearTimeout(landTimer)
                    setHeroLanded(false)
                }
            }
            const onScroll = () => {
                if (!raf) raf = window.requestAnimationFrame(check)
            }
            let settleTimer = 0
            const onResize = () => {
                lastResize = performance.now()
                window.clearTimeout(settleTimer)
                settleTimer = window.setTimeout(check, 450)
            }

            check()
            window.addEventListener("scroll", onScroll, { passive: true })
            window.addEventListener("resize", onResize)
            return () => {
                window.removeEventListener("scroll", onScroll)
                window.removeEventListener("resize", onResize)
                window.cancelAnimationFrame(raf)
                window.clearTimeout(landTimer)
                window.clearTimeout(settleTimer)
                setHeroLanded(false)
            }
        }, [isStatic])

        const shown = isStatic || risen
        return (
            <Component
                {...props}
                ref={setRefs}
                style={{
                    ...props.style,
                    // `translate` composes with any transform Framer already sets.
                    translate: shown ? "0px 0px" : "0px calc(50vh + 60%)",
                    opacity: shown ? 1 : 0,
                    transition: `translate ${CARD_MS}ms ${EASE}, opacity ${CARD_MS * 0.5}ms ease-out`,
                    willChange: "translate, opacity",
                }}
            />
        )
    })
}

function withHeroChrome(
    Component: ComponentType<any>,
    hiddenTranslate: string
): ComponentType {
    return React.forwardRef<HTMLElement, any>(function WithHeroChrome(props, ref) {
        const isStatic = useIsStaticRenderer()
        const landed = useHeroLanded()
        const shown = isStatic || landed
        return (
            <Component
                {...props}
                ref={ref}
                style={{
                    ...props.style,
                    translate: shown ? "0px 0px" : hiddenTranslate,
                    opacity: shown ? 1 : 0,
                    pointerEvents: shown ? undefined : "none",
                    transition: `translate ${CHROME_MS}ms ${EASE}, opacity ${CHROME_MS * 0.6}ms ease-out`,
                    willChange: "translate, opacity",
                }}
            />
        )
    })
}

export function withTopStatsDrop(Component: ComponentType<any>): ComponentType {
    return withHeroChrome(Component, "0px calc(-100% - 40px)")
}

export function withMainNavRise(Component: ComponentType<any>): ComponentType {
    return withHeroChrome(Component, "0px calc(100% + 48px)")
}
