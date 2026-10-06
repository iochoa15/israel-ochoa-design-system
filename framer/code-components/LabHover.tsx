import { forwardRef, type ComponentType } from "react"

// Overrides for the Lab cells: hovering anywhere on a cell tells its LiveTile (same hover key) to play.
function announce(key: string, on: boolean) {
    if (typeof window === "undefined") return
    window.dispatchEvent(new CustomEvent("io-lab-hover", { detail: { key, on } }))
}

function wrap(Component: ComponentType<any>, key: string): ComponentType<any> {
        return forwardRef(function LabHoverCell(props: any, ref) {
            return (
                <Component
                    ref={ref}
                    {...props}
                    onMouseEnter={(e: any) => {
                        announce(key, true)
                        props.onMouseEnter?.(e)
                    }}
                    onMouseLeave={(e: any) => {
                        announce(key, false)
                        props.onMouseLeave?.(e)
                    }}
                />
            )
        })
}

export function withLabHoverAway(Component: ComponentType<any>): ComponentType<any> {
    return wrap(Component, "away")
}

export function withLabHoverAnnotator(Component: ComponentType<any>): ComponentType<any> {
    return wrap(Component, "annotator")
}

export function withLabHoverToken(Component: ComponentType<any>): ComponentType<any> {
    return wrap(Component, "token")
}

export function withLabHoverSite(Component: ComponentType<any>): ComponentType<any> {
    return wrap(Component, "site")
}

export function withLabHoverLog(Component: ComponentType<any>): ComponentType<any> {
    return wrap(Component, "log")
}
