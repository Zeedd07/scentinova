/**
 * Frame-driven window scroll for when Lenis isn't running (mobile).
 * Native `behavior: 'smooth'` gets cancelled by layout shifts and stalls on busy frames;
 * this sets the position every frame and always lands on the target.
 */
let cancelActive = null

export function smoothScrollTo(top) {
  cancelActive?.()
  const target = Math.max(0, Math.round(top))
  const start = window.scrollY
  const distance = target - start
  if (Math.abs(distance) < 2) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, target)
    return
  }

  const duration = Math.min(1100, 450 + Math.abs(distance) * 0.12)
  const t0 = performance.now()
  let raf = 0
  // Frames can be throttled or paused; never leave the page short of the target
  const fallback = window.setTimeout(() => {
    stop()
    window.scrollTo(0, target)
  }, duration + 250)

  const stop = () => {
    cancelAnimationFrame(raf)
    window.clearTimeout(fallback)
    window.removeEventListener('wheel', stop)
    window.removeEventListener('touchstart', stop)
    cancelActive = null
  }
  // The visitor taking over the scroll ends the animation
  window.addEventListener('wheel', stop, { passive: true })
  window.addEventListener('touchstart', stop, { passive: true })

  const tick = (now) => {
    const t = Math.min(1, (now - t0) / duration)
    const eased = 1 - (1 - t) ** 3
    window.scrollTo(0, Math.round(start + distance * eased))
    if (t < 1) raf = requestAnimationFrame(tick)
    else stop()
  }
  raf = requestAnimationFrame(tick)
  cancelActive = stop
}
