/**
 * Detect coarse pointer / narrow viewport → mobile layout tweaks
 * (lighter particles, leaner frame preload). Hero scroll-scrub runs on all devices.
 */
import { useEffect, useState } from 'react'

const MQ = '(max-width: 768px), (hover: none) and (pointer: coarse)'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(MQ).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(MQ)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
