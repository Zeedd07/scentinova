/**
 * Festive sale banner for the storefront - renders only while a sale is live.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { easeOutExpo, fadeUp, viewportOnce } from '../lib/motion'
import { saleSummary } from '../lib/sale'

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE
/** Beyond this, a countdown reads as noise - show the end date instead. */
const COUNTDOWN_WINDOW = 14 * DAY

function useNow(enabled) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return undefined
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [enabled])
  return now
}

function countdownParts(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / MINUTE))
  return [
    { value: Math.floor(totalMinutes / 1440), label: 'Days' },
    { value: Math.floor((totalMinutes % 1440) / 60), label: 'Hrs' },
    { value: totalMinutes % 60, label: 'Min' },
  ]
}

function headline({ percentOff, upTo, everything }) {
  return `${upTo ? 'Up to ' : ''}${percentOff}% off ${everything ? 'every signature' : 'selected signatures'}`
}

export default function SaleAnnouncement({ products }) {
  const sale = saleSummary(products)
  const endsAtMs = sale?.endsAt ? new Date(sale.endsAt).getTime() : null
  const now = useNow(endsAtMs != null)

  if (!sale) return null
  const remaining = endsAtMs == null ? null : endsAtMs - now
  if (remaining != null && remaining <= 0) return null
  const showCountdown = remaining != null && remaining <= COUNTDOWN_WINDOW
  const endLabel =
    endsAtMs == null
      ? 'For a limited time'
      : `Ends ${new Date(endsAtMs).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`

  return (
    <motion.div
      initial={fadeUp.initial}
      whileInView={fadeUp.animate}
      viewport={viewportOnce}
      transition={{ duration: 0.85, delay: 0.12, ease: easeOutExpo }}
      className="relative z-10 mx-auto mb-10 max-w-6xl px-6 sm:mb-12 sm:px-10 lg:px-0"
    >
      <Link
        to="/shop"
        aria-label={`${sale.name}: ${headline(sale)}. Shop the sale`}
        className="group relative block overflow-hidden border border-gold/60 bg-[linear-gradient(110deg,#fbf6ea_0%,#f4ead3_48%,#fbf6ea_100%)] p-1.5 shadow-[0_18px_40px_-28px_rgba(90,70,30,0.45)] transition hover:border-gold"
      >
        <span
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 transition-[left,opacity] duration-[1400ms] ease-out group-hover:left-[110%] group-hover:opacity-100 motion-reduce:hidden"
          aria-hidden
        />

        <div className="relative flex flex-col gap-5 border border-gold/30 px-4 py-5 sm:px-8 sm:py-7 md:flex-row md:items-center md:gap-8 md:py-6 lg:px-10">
          <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6 md:gap-8">
            <div className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border border-gold/70 bg-warm-white shadow-[inset_0_0_0_4px_#fbf6ea,inset_0_0_0_5px_rgba(201,162,74,0.45)] sm:h-28 sm:w-28">
              {sale.upTo && (
                <span className="text-[8px] font-medium tracking-[0.3em] text-bronze uppercase">Up to</span>
              )}
              <span className="font-display text-[1.7rem] leading-none text-scent-red sm:text-[2.35rem]">
                {sale.percentOff}
                <span className="text-[0.55em] align-top">%</span>
              </span>
              <span className="mt-1 text-[9px] font-medium tracking-[0.42em] text-bronze uppercase">Off</span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[9px] font-medium tracking-[0.36em] text-scent-red uppercase sm:gap-2.5 sm:text-[11px] sm:tracking-[0.42em]">
                <span className="text-gold" aria-hidden>✦</span>
                {sale.name}
                <span className="text-gold" aria-hidden>✦</span>
              </p>
              <p className="mt-1.5 font-display text-xl leading-tight text-charcoal sm:mt-2 sm:text-[1.9rem]">
                {headline(sale)}
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted sm:mt-2 sm:text-sm">
                Applied automatically at checkout - no code needed.{showCountdown ? '' : ` ${endLabel}.`}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between md:flex-col md:items-end md:gap-4">
            {showCountdown && (
              <div className="flex items-start justify-center gap-2" role="timer" aria-label={endLabel}>
                {countdownParts(remaining).map((part) => (
                  <div
                    key={part.label}
                    className="flex min-w-[3.25rem] flex-col items-center border border-gold/45 bg-warm-white/80 px-2 py-1.5"
                  >
                    <span className="font-display text-xl leading-none text-charcoal tabular-nums">
                      {String(part.value).padStart(2, '0')}
                    </span>
                    <span className="mt-1 text-[8px] font-medium tracking-[0.28em] text-bronze uppercase">
                      {part.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <span className="inline-flex items-center justify-center gap-2 bg-charcoal px-6 py-3 text-[10px] font-medium tracking-[0.32em] text-ivory uppercase transition group-hover:bg-scent-red sm:text-[11px]">
              Shop the sale <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
