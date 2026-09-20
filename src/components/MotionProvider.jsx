/**
 * Motion provider — global transition + reduced-motion policy.
 */
import { MotionConfig } from 'framer-motion'
import { defaultTransition } from '../lib/motion'

export default function MotionProvider({ children }) {
  return (
    <MotionConfig reducedMotion="user" transition={defaultTransition}>
      {children}
    </MotionConfig>
  )
}
