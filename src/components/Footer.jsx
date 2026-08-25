/**
 * Site footer — mock maison details.
 */
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-ink px-6 pt-14 pb-10 sm:px-10 lg:px-16 lg:pt-16 lg:pb-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              className="font-display text-lg tracking-[0.28em] text-cream uppercase transition hover:text-gold-light"
            >
              SCENTINOVA
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-bronze">
              Fragrances composed in small atelier batches — crystal, gold, and a
              private hour that stays.
            </p>
          </div>

          <div>
            <p className="text-[11px] tracking-[0.32em] text-gold uppercase">
              Explore
            </p>
            <nav className="mt-4 flex flex-col gap-3 text-sm text-bronze">
              <Link to="/shop" className="transition hover:text-cream">
                Shop
              </Link>
              <Link to="/about" className="transition hover:text-cream">
                Our Story
              </Link>
              <Link to="/cart" className="transition hover:text-cream">
                Cart
              </Link>
              <a href="#collection" className="transition hover:text-cream">
                Collection
              </a>
            </nav>
          </div>

          <div>
            <p className="text-[11px] tracking-[0.32em] text-gold uppercase">
              Visit
            </p>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-bronze">
              <p>
                12 Rue des Ateliers
                <br />
                75003 Paris, France
              </p>
              <p>
                <a
                  href="mailto:hello@maisonaurum.com"
                  className="transition hover:text-cream"
                >
                  hello@maisonaurum.com
                </a>
              </p>
              <p>+33 1 42 00 00 00</p>
              <p className="text-[12px] text-bronze/80">
                Mon–Sat · 11:00–19:00
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] tracking-[0.32em] text-gold uppercase">
              Newsletter
            </p>
            <p className="mt-4 text-sm leading-relaxed text-bronze">
              New compositions and private launches — no noise.
            </p>
            <form
              className="mt-5 flex flex-col gap-3"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                required
                placeholder="Email address"
                className="w-full border border-gold/25 bg-ink-soft px-3 py-2.5 text-sm text-cream outline-none placeholder:text-bronze/70 focus:border-gold"
              />
              <button
                type="submit"
                className="btn-luxury border border-gold/35 px-4 py-2.5 text-cream hover:border-gold"
              >
                Subscribe
              </button>
            </form>
            <div className="mt-6 flex gap-5 text-[11px] tracking-[0.28em] text-bronze uppercase">
              <a href="#" className="transition hover:text-cream">
                Instagram
              </a>
              <a href="#" className="transition hover:text-cream">
                Pinterest
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-gold/10 pt-6 text-[11px] tracking-wider text-bronze/70 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} SCENTINOVA. All rights reserved.
            <Link
              to="/admin"
              className="ml-2 opacity-30 transition hover:opacity-100 hover:text-gold-light"
              title="Admin"
            >
              ·
            </Link>
          </p>
          <p className="flex flex-wrap gap-4 uppercase tracking-[0.22em]">
            <span>Privacy</span>
            <span>Shipping</span>
            <span>Terms</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
