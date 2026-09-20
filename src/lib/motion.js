/**
 * Shared Motion config — site-wide easings, variants, and transitions.
 * Docs: https://motion.dev/docs/react-motion-config
 */
export const easeOutExpo = [0.22, 1, 0.36, 1]

export const defaultTransition = {
  duration: 0.75,
  ease: easeOutExpo,
}

export const softTransition = {
  duration: 0.9,
  ease: easeOutExpo,
}

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const viewportOnce = {
  once: true,
  amount: 0.2,
  margin: '0px 0px -8% 0px',
}

export const staggerChildren = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
}
