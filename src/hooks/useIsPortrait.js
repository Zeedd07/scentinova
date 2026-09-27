import { useEffect, useState } from 'react'

const MQ = '(orientation: portrait)'

export function useIsPortrait() {
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(MQ).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(MQ)
    const onChange = () => setIsPortrait(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isPortrait
}
