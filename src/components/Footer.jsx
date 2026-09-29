/**
 * Site footer - black maison bar.
 */
import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import { InstagramIcon, WhatsAppIcon } from './SocialIcons'
import { SOCIAL_LINKS, WHATSAPP } from '../config/site'

const INSTAGRAM = SOCIAL_LINKS.find((s) => s.id === 'instagram')

const CONTACT = [
  { href: WHATSAPP.href, label: WHATSAPP.label, hint: 'WhatsApp', Icon: WhatsAppIcon },
  ...(INSTAGRAM
    ? [{ href: INSTAGRAM.href, label: INSTAGRAM.handle, hint: 'Instagram', Icon: InstagramIcon }]
    : []),
]

const footerLink =
  'underline-offset-[6px] decoration-scent-red-light transition hover:text-champagne hover:underline'

const EXPLORE = [
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'Our Story' },
  { to: '/cart', label: 'Cart' },
  { href: '#collection', label: 'Signatures' },
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
              Heavenly Crafted Perfume - signatures composed for presence.
            </p>
          </div>

          <div className="mt-10 flex w-full flex-col items-center gap-10 lg:mt-0 lg:w-auto lg:flex-row lg:items-start lg:gap-16">
            <div className="lg:max-w-md">
              <p className="text-[10px] tracking-[0.36em] text-champagne uppercase">Explore</p>
              <nav
                className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[12px] tracking-[0.08em] text-white/55 sm:gap-x-8 lg:justify-start"
                aria-label="Footer"
              >
                {EXPLORE.map((item) =>
                  item.to ? (
                    <Link key={item.label} to={item.to} className={footerLink}>
                      {item.label}
                    </Link>
                  ) : (
                    <a key={item.label} href={item.href} className={footerLink}>
                      {item.label}
                    </a>
                  ),
                )}
              </nav>
            </div>

            <div>
              <p className="text-[10px] tracking-[0.36em] text-champagne uppercase">Contact us</p>
              <ul className="mt-5 flex flex-col items-center gap-3 text-[12px] tracking-[0.08em] text-white/55 lg:items-start">
                {CONTACT.map(({ href, label, hint, Icon }) => (
                  <li key={hint}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${hint}: ${label}`}
                      className={`inline-flex items-center gap-2.5 ${footerLink}`}
                    >
                      <span className="text-champagne/80">
                        <Icon size={16} />
                      </span>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
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
