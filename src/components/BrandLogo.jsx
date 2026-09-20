/**
 * SCENTINOVA brand lockup — official gold logo mark + wordmark.
 */
import { Link } from 'react-router-dom'

export default function BrandLogo({
  to = '/',
  onClick,
  size = 'nav',
  className = '',
  light = false,
}) {
  const compact = size === 'nav'

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`brand-logo group inline-flex items-center outline-none ring-0 transition duration-500 ${
        compact ? 'gap-0' : 'gap-0'
      } ${className}`}
      aria-label="SCENTINOVA — Heavenly Crafted Perfume"
    >
      <img
        src="/brand/logo.png"
        alt="Scentinova"
        className={`w-auto object-contain transition duration-500 group-hover:opacity-90 ${
          compact
            ? 'h-[3.15rem] max-h-[calc(var(--nav-h)-0.15rem)] sm:h-[3.5rem] lg:h-[4.1rem]'
            : 'h-12 sm:h-14'
        } ${light ? '' : 'brightness-[0.85]'}`}
        draggable={false}
      />
    </Link>
  )
}
