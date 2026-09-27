import { useEffect } from 'react'
import { useLenis } from '../components/SmoothScroll'

// Shared across callers so stacked overlays (dialog + confirm) only unlock when the last one closes
let lockCount = 0
let saved = null

/**
 * Freeze page scroll while `active` (native + Lenis). Pads for the removed
 * scrollbar via --scroll-lock-gap so fixed bars don't jump sideways.
 */
export function useScrollLock(active) {
  const lenis = useLenis()

  useEffect(() => {
    if (!active) return undefined

    const html = document.documentElement
    const body = document.body

    if (lockCount === 0) {
      const gap = Math.max(0, window.innerWidth - html.clientWidth)
      saved = {
        htmlOverflow: html.style.overflow,
        bodyOverflow: body.style.overflow,
        bodyPaddingRight: body.style.paddingRight,
      }
      html.style.setProperty('--scroll-lock-gap', `${gap}px`)
      html.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
      if (gap > 0) body.style.paddingRight = `${gap}px`
    }
    lockCount += 1
    lenis?.stop()

    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount > 0) return
      if (saved) {
        html.style.overflow = saved.htmlOverflow
        body.style.overflow = saved.bodyOverflow
        body.style.paddingRight = saved.bodyPaddingRight
        saved = null
      }
      html.style.removeProperty('--scroll-lock-gap')
      lenis?.start()
    }
  }, [active, lenis])
}
