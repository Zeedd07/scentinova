/**
 * Compact theme switcher — swatches in the navbar.
 */
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeSwitcher() {
  const { theme, setTheme, themes, current } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 border-0 bg-transparent text-bronze outline-none ring-0 transition hover:text-cream"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${current.label}`}
        title="Change theme"
      >
        <span className="flex -space-x-1" aria-hidden>
          {current.swatch.map((c) => (
            <span
              key={c}
              className="h-3.5 w-3.5 rounded-full border border-cream/20"
              style={{ background: c }}
            />
          ))}
        </span>
        <span className="hidden text-[11px] tracking-[0.28em] uppercase sm:inline">
          Theme
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Colour themes"
          className="absolute right-0 top-full z-[80] mt-3 w-56 border border-gold/20 bg-ink-soft py-2 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
        >
          <p className="px-4 pb-2 pt-1 text-[10px] tracking-[0.32em] text-bronze uppercase">
            Maison themes
          </p>
          {themes.map((t) => {
            const active = t.id === theme
            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setTheme(t.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-3 border-0 bg-transparent px-4 py-2.5 text-left outline-none transition ${
                  active ? 'text-gold-light' : 'text-bronze hover:bg-panel hover:text-cream'
                }`}
              >
                <span className="flex -space-x-1" aria-hidden>
                  {t.swatch.map((c) => (
                    <span
                      key={c}
                      className="h-3.5 w-3.5 rounded-full border border-cream/15"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] tracking-[0.18em] uppercase">
                    {t.label}
                  </span>
                  <span className="block text-[11px] text-bronze/80 normal-case tracking-normal">
                    {t.hint}
                  </span>
                </span>
                {active && (
                  <span className="text-[10px] tracking-wider text-gold uppercase">
                    On
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
