/**
 * Lenis smooth scroll + GSAP ScrollTrigger bridge (storefront only).
 * Uses GSAP ticker for Lenis.raf so ScrollTrigger scrub stays in sync.
 */
import { useEffect } from 'react'
import { ReactLenis, useLenis } from 'lenis/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger)

function LenisGsapBridge() {
  const lenis = useLenis()

  useEffect(() => {
    if (!lenis) return undefined

    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    const tick = (time) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    ScrollTrigger.refresh()

    return () => {
      lenis.off('scroll', onScroll)
      gsap.ticker.remove(tick)
    }
  }, [lenis])

  return null
}

const LENIS_OPTIONS = {
  autoRaf: false,
  smoothWheel: true,
  // Native touch scrolling — avoids fighting iOS + pin scrub
  syncTouch: false,
  touchMultiplier: 1.4,
  wheelMultiplier: 0.95,
  lerp: 0.12,
  duration: 1.15,
}

export default function SmoothScroll({ children }) {
  return (
    <ReactLenis root options={LENIS_OPTIONS}>
      <LenisGsapBridge />
      {children}
    </ReactLenis>
  )
}

export { useLenis }
