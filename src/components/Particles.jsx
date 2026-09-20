/**
 * Floating gold dust / sparkle particles — visual match for mid-sequence mist.
 * Lightweight canvas overlay; pauses when off-screen via IntersectionObserver.
 */
import { useEffect, useRef } from 'react'

const GOLD = [
  'rgba(212,175,55,',
  'rgba(244,229,178,',
  'rgba(138,109,59,',
]

function spawnParticle(w, h) {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    r: 0.4 + Math.random() * 1.8,
    vx: (Math.random() - 0.5) * 0.25,
    vy: -0.15 - Math.random() * 0.35,
    life: 0.3 + Math.random() * 0.7,
    decay: 0.0015 + Math.random() * 0.0025,
    color: GOLD[(Math.random() * GOLD.length) | 0],
  }
}

export default function Particles({ density = 48, className = '' }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const visibleRef = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d', { alpha: true })
    let particles = []
    let w = 0
    let h = 0

    let resizeTimer = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (particles.length === 0) {
        particles = Array.from({ length: density }, () => spawnParticle(w, h))
      }
    }

    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(resize, 140)
    }

    resize()
    window.addEventListener('resize', onResize, { passive: true })

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting
      },
      { threshold: 0.05 },
    )
    io.observe(canvas)

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      if (!visibleRef.current) return

      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.life -= p.decay

        if (p.life <= 0 || p.y < -10 || p.x < -10 || p.x > w + 10) {
          particles[i] = spawnParticle(w, h)
          particles[i].y = h + Math.random() * 40
          continue
        }

        ctx.beginPath()
        ctx.fillStyle = `${p.color}${Math.max(0, p.life).toFixed(3)})`
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      io.disconnect()
    }
  }, [density])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  )
}
