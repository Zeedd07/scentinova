/**
 * CSS 3D tilt bottle — follows cursor (max ±15°).
 * Uses a still from the sequence as the product render.
 */
import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

const MAX = 15 // degrees

export default function TiltBottle({
  src = '/frames/frame-001.jpg',
  alt = 'Aurum perfume bottle',
}) {
  const ref = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const spring = { stiffness: 180, damping: 22, mass: 0.6 }
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [MAX, -MAX]), spring)
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-MAX, MAX]), spring)
  const glareX = useSpring(useTransform(mx, [-0.5, 0.5], [20, 80]), spring)
  const glareY = useSpring(useTransform(my, [-0.5, 0.5], [20, 80]), spring)

  // Compose glare position as a single motion value for background
  const glareBg = useTransform([glareX, glareY], ([x, y]) => {
    return `radial-gradient(circle at ${x}% ${y}%, rgba(244,229,178,0.45) 0%, transparent 55%)`
  })

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    mx.set(px)
    my.set(py)
  }

  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-[3/4] w-full max-w-md"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ perspective: 1200 }}
    >
      <motion.div
        className="relative h-full w-full overflow-hidden rounded-sm"
        style={{
          rotateX: rx,
          rotateY: ry,
          transformStyle: 'preserve-3d',
        }}
      >
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          draggable={false}
        />
        <motion.div
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{ background: glareBg }}
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/20" />
      </motion.div>
    </div>
  )
}
