import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { useEffect } from "react"

// Page-level helper for scroll "stages" — every layer whose name starts with
// "Stage_" (a tall frame with a sticky, full-screen section inside).
// 1. Snaps gently to the start of each stage.
// 2. Keeps the same spot inside the current stage when the window is resized,
//    so vh-based heights changing never push the next stage into view.
// Place one tiny instance on the page (like GlobalCSS). Renders nothing visible.

const STAGE_SELECTOR = '[data-framer-name^="Stage_"]'

interface StageSnapProps {
    snap?: "proximity" | "mandatory" | "none"
}

type Anchor = { index: number; progress: number }

function getStages(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>(STAGE_SELECTOR))
}

// Which stage holds the top of the viewport, and how far through its pinned range we are.
function readAnchor(stages: HTMLElement[]): Anchor | null {
    const vh = window.innerHeight
    let best: Anchor | null = null
    for (let i = 0; i < stages.length; i++) {
        const rect = stages[i].getBoundingClientRect()
        if (rect.top <= 1 && rect.bottom > 1) {
            const range = Math.max(1, rect.height - vh)
            best = { index: i, progress: Math.min(1, Math.max(0, -rect.top / range)) }
            break
        }
    }
    return best
}

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function StageSnap({ snap = "proximity" }: StageSnapProps) {
    const isStatic = useIsStaticRenderer()

    // Snap points: html snap container + each stage aligned to its top edge.
    const css =
        snap === "none"
            ? ""
            : `html { scroll-snap-type: y ${snap}; }
               ${STAGE_SELECTOR} { scroll-snap-align: start; scroll-snap-stop: normal; }`

    useEffect(() => {
        if (isStatic || typeof window === "undefined") return
        let anchor: Anchor | null = null
        let restoring = false
        let raf = 0

        const record = () => {
            raf = 0
            if (restoring) return
            anchor = readAnchor(getStages())
        }
        const onScroll = () => {
            if (!raf) raf = window.requestAnimationFrame(record)
        }

        const onResize = () => {
            const saved = anchor
            if (!saved) return
            window.requestAnimationFrame(() => {
                const stage = getStages()[saved.index]
                if (!stage) return
                const vh = window.innerHeight
                const rect = stage.getBoundingClientRect()
                const range = Math.max(1, rect.height - vh)
                const target = window.scrollY + rect.top + saved.progress * range
                // Pause snapping for the jump so the browser doesn't fight it.
                const root = document.documentElement
                const prevSnap = root.style.scrollSnapType
                restoring = true
                root.style.scrollSnapType = "none"
                window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior })
                window.requestAnimationFrame(() => {
                    root.style.scrollSnapType = prevSnap
                    restoring = false
                })
            })
        }

        record()
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onResize)
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onResize)
            window.cancelAnimationFrame(raf)
        }
    }, [isStatic])

    return (
        <div style={{ position: "relative", width: 1, height: 1, overflow: "hidden", pointerEvents: "none" }}>
            {!isStatic && css ? <style>{css}</style> : null}
        </div>
    )
}

addPropertyControls(StageSnap, {
    snap: {
        type: ControlType.Enum,
        title: "Snap",
        options: ["proximity", "mandatory", "none"],
        optionTitles: ["Gentle", "Strict", "Off"],
        defaultValue: "proximity",
    },
})
