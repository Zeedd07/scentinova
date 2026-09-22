/**
 * Site footer — black maison bar.
 */
import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'

const EXPLORE = [
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'Our Story' },
  { to: '/cart', label: 'Cart' },
  { href: '#collection', label: 'Four Signatures' },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-6 pt-12 pb-8 text-warm-white sm:px-10 sm:pt-16 sm:pb-10 lg:px-16 lg:pt-16 lg:pb-12">
      <div className="mx-auto max-w-6xl">
        {/* Brand + nav */}
        <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
          <div className="max-w-sm">
            <BrandLogo
              size="footer"
              className="justify-center lg:justify-start"
            />
            <p className="mt-4 text-[13px] leading-relaxed text-white/50 sm:text-sm">
              Heavenly Crafted Perfume — four signatures composed for presence.
            </p>
          </div>

          <div className="mt-10 w-full lg:mt-0 lg:w-auto lg:max-w-md">
            <p className="text-[10px] tracking-[0.36em] text-champagne uppercase">
              Explore
            </p>
            <nav
              className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12px] tracking-[0.08em] text-white/55 sm:gap-x-8 lg:justify-end"
              aria-label="Footer"
            >
              {EXPLORE.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="transition hover:text-champagne"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="transition hover:text-champagne"
                  >
                    {item.label}
                  </a>
                ),
              )}
            </nav>
          </div>
        </div>

        {/* Legal bar */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/10 pt-7 text-center sm:mt-14 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-[10px] tracking-[0.14em] text-white/35 sm:text-[11px]">
            © {new Date().getFullYear()} SCENTINOVA. All rights reserved.
            <Link
              to="/admin"
              className="ml-1 opacity-25 transition hover:opacity-100 hover:text-champagne"
              title="Admin"
            >
              ·
            </Link>
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[9px] tracking-[0.28em] text-white/35 uppercase sm:gap-x-6 sm:text-[10px]">
            <span>Privacy</span>
            <span className="hidden text-white/15 sm:inline" aria-hidden>
              ·
            </span>
            <span>Shipping</span>
            <span className="hidden text-white/15 sm:inline" aria-hidden>
              ·
            </span>
            <span>Terms</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
