/**
 * SCENTINOVA brand lockup — always navigates to home and scrolls to top.
 */
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLenis } from './SmoothScroll'

export default function BrandLogo({
  to = '/',
  onClick,
  size = 'nav',
  className = '',
  light = false,
}) {
  const compact = size === 'nav'
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const lenis = useLenis()

  const goHome = (e) => {
    onClick?.(e)
    if (e.defaultPrevented) return

    e.preventDefault()

    const scrollTop = () => {
      if (lenis) lenis.scrollTo(0, { immediate: false, duration: 1 })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (pathname !== '/') {
      navigate(to || '/')
      // Scroll after route paints
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollTop)
      })
      return
    }

    // Already on home — clear hash and return to hero top
    if (window.location.hash) {
      window.history.replaceState(null, '', '/')
    }
    scrollTop()
  }

  return (
    <Link
      to={to || '/'}
      onClick={goHome}
      className={`brand-logo group inline-flex items-center outline-none ring-0 transition duration-500 ${
        compact ? 'gap-0' : 'gap-0'
      } ${className}`}
      aria-label="SCENTINOVA — go to home"
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
