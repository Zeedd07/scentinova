/**
 * SCENTINOVA brand lockup — monogram seal + wordmark.
 */
import { Link } from 'react-router-dom'

export default function BrandLogo({
  to = '/',
  onClick,
  size = 'nav',
  className = '',
}) {
  const compact = size === 'nav'

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`brand-logo group inline-flex items-center outline-none ring-0 ${
        compact ? 'gap-3' : 'gap-4'
      } ${className}`}
      aria-label="SCENTINOVA Parfums — home"
    >
      <span
        className={`brand-monogram relative flex shrink-0 items-center justify-center rounded-full ${
          compact ? 'h-9 w-9' : 'h-12 w-12'
        }`}
        aria-hidden
      >
        <span
          className={`font-display leading-none text-gold-light ${
            compact ? 'text-lg' : 'text-2xl'
          }`}
        >
          A
        </span>
      </span>

      <span className="flex min-w-0 flex-col">
        <span
          className={`font-display uppercase leading-none tracking-[0.34em] text-cream transition duration-500 group-hover:text-gold-light ${
            compact ? 'text-[13px] sm:text-sm' : 'text-xl sm:text-2xl'
          }`}
        >
          SCENTINOVA
        </span>
        <span
          className={`mt-1.5 flex items-center gap-2 text-bronze uppercase ${
            compact ? 'text-[10px] tracking-[0.36em]' : 'text-[11px] tracking-[0.4em]'
          }`}
        >
          <span className="h-px w-4 bg-gradient-to-r from-transparent to-gold/50" />
          Parfums
          <span className="h-px w-4 bg-gradient-to-l from-transparent to-gold/50" />
        </span>
      </span>
    </Link>
  )
}
