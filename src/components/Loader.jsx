/**
 * Full-screen maison loader — soft gold glow, wordmark, scent progress.
 */
import { motion, AnimatePresence } from 'framer-motion'

export default function Loader({ progress, priorityReady, visible }) {
  const pct = Math.min(100, Math.round(progress * 100))

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } }}
          aria-live="polite"
          aria-busy={!priorityReady}
        >
          {/* Soft vertical gold bloom — matches cinematic UI */}
          <div
            className="pointer-events-none absolute left-1/2 top-[28%] h-[42vh] w-[min(28vw,11rem)] -translate-x-1/2 -translate-y-1/2 opacity-90"
            style={{
              background:
                'radial-gradient(ellipse 55% 70% at 50% 45%, rgba(224,197,106,0.28) 0%, rgba(201,180,138,0.12) 38%, transparent 72%)',
              filter: 'blur(28px)',
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(20,16,12,0.9), transparent 55%)',
            }}
            aria-hidden
          />

          <motion.div
            className="relative z-10 flex flex-col items-center px-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-display text-[1.65rem] tracking-[0.42em] text-cream uppercase sm:text-3xl md:text-[2.15rem]">
              Aurum
            </p>
            <p className="mt-3 text-[10px] tracking-[0.38em] text-bronze uppercase sm:text-[11px]">
              Preparing the scent
            </p>

            <div className="mt-12 h-px w-52 overflow-hidden bg-gold/15 sm:w-64">
              <motion.div
                className="loader-bar h-full origin-left"
                initial={false}
                animate={{ width: `${Math.max(6, pct)}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>
            <span className="mt-4 text-[11px] tracking-[0.28em] text-bronze tabular-nums">
              {pct}%
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
