import { useRef, type CSSProperties } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import { motion, useInView } from "framer-motion"

interface PersonTagProps {
    photo?: { src: string; srcSet?: string; alt?: string }
    video?: string
    name: string
    role: string
    avatarSize: number
    radius: number
    textSize: number
    nameColor: string
    roleColor: string
    tileColor: string
    style?: CSSProperties
}

// The IOD mark, used as the avatar until a photo, GIF or video is added.
const LOGO_PATHS = [
    "M7.61.387H0v30.227h7.61z",
    "M24.913 30.994a17.6 17.6 0 0 1-2.778-.224c-6.67-1.079-11.902-6.136-13.016-12.586a15.24 15.24 0 0 1 3.556-12.695C15.731 2.001 20.192 0 24.913 0c.92 0 1.854.076 2.779.225 6.67 1.078 11.902 6.136 13.016 12.586a15.24 15.24 0 0 1-3.558 12.695c-3.055 3.489-7.515 5.488-12.237 5.488M24.908 6.93c-2.336.001-4.55.9-6.237 2.531-1.686 1.63-2.616 3.772-2.618 6.03-.001 2.29.92 4.443 2.593 6.063s3.9 2.512 6.267 2.512a8.95 8.95 0 0 0 6.244-2.532c1.686-1.63 2.615-3.771 2.618-6.03.001-2.29-.92-4.443-2.593-6.063s-3.9-2.511-6.267-2.511z",
    "M40.163 24.064c4.823-.072 8.722-3.886 8.722-8.567 0-4.68-3.9-8.495-8.722-8.567V0c8.774.072 15.89 6.995 15.89 15.497s-7.114 15.425-15.89 15.497z",
]

// Same entrance as the clay in the intro: small, blurred and faded, then it grows in on a soft spring.
const SPRING = { type: "spring", stiffness: 140, damping: 20, mass: 1 } as const

/**
 * Name tag: avatar (photo, GIF or video) with name and role underneath.
 *
 * @framerIntrinsicWidth 260
 * @framerIntrinsicHeight 100
 *
 * @framerSupportedLayoutWidth auto
 * @framerSupportedLayoutHeight auto
 */
export default function PersonTag(props: PersonTagProps) {
    const {
        photo,
        video,
        name = "Israel Ochoa",
        role = "Product and Brand Designer",
        avatarSize = 48,
        radius = 14,
        textSize = 18,
        nameColor = "#111110",
        roleColor = "#5E5D59",
        tileColor = "#111110",
    } = props
    const isStatic = useIsStaticRenderer()
    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, { once: true, amount: 0.6 })
    const shown = isStatic || inView

    const text: CSSProperties = {
        fontFamily: '"Wix Madefor Text", sans-serif',
        fontSize: textSize,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        margin: 0,
    }

    return (
        <motion.div
            ref={ref}
            initial={isStatic ? false : { opacity: 0, scale: 0.4, filter: "blur(10px)" }}
            animate={shown ? { opacity: 1, scale: 1, filter: "blur(0px)" } : undefined}
            transition={SPRING}
            style={{ ...props.style, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: "max-content" }}
        >
            <motion.div
                whileHover={{ scale: 1.06, rotate: -3 }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
                style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: radius,
                    overflow: "hidden",
                    background: tileColor,
                    marginBottom: 6,
                    boxShadow: "0 0 0 1px rgba(17,17,16,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {video ? (
                    <video src={video} poster={photo?.src} muted loop playsInline autoPlay style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : photo?.src ? (
                    <img src={photo.src} srcSet={photo.srcSet} alt={photo.alt || name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                    <svg viewBox="0 0 56.053 30.994" width={avatarSize * 0.6} aria-label={name}>
                        {LOGO_PATHS.map((d, i) => (
                            <path key={i} d={d} fill="#FFFFFF" />
                        ))}
                    </svg>
                )}
            </motion.div>
            <p style={{ ...text, fontWeight: 600, color: nameColor }}>{name}</p>
            <p style={{ ...text, fontWeight: 400, color: roleColor }}>{role}</p>
        </motion.div>
    )
}

addPropertyControls(PersonTag, {
    photo: { type: ControlType.ResponsiveImage, title: "Photo / GIF" },
    video: { type: ControlType.File, title: "Video (optional)", allowedFileTypes: ["mp4", "webm", "mov"] },
    name: { type: ControlType.String, title: "Name", defaultValue: "Israel Ochoa" },
    role: { type: ControlType.String, title: "Role", defaultValue: "Product and Brand Designer" },
    avatarSize: { type: ControlType.Number, title: "Avatar", defaultValue: 48, min: 24, max: 120, unit: "px" },
    radius: { type: ControlType.Number, title: "Radius", defaultValue: 14, min: 0, max: 60, unit: "px" },
    textSize: { type: ControlType.Number, title: "Text size", defaultValue: 18, min: 12, max: 28, unit: "px" },
    nameColor: { type: ControlType.Color, title: "Name", defaultValue: "#111110" },
    roleColor: { type: ControlType.Color, title: "Role", defaultValue: "#5E5D59" },
    tileColor: { type: ControlType.Color, title: "Tile", defaultValue: "#111110" },
})
