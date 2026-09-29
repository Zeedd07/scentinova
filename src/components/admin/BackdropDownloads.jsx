/**
 * The storefront product backdrop as a downloadable PNG — generate a product shot on it,
 * then upload it from the product editor.
 */
import { useState } from 'react'
import { BACKDROPS, BACKDROP_SIZES, downloadBackdrop } from '../../lib/storefrontBackdrops'

export default function BackdropDownloads() {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const download = async (backdrop, size) => {
    setBusy(`${backdrop.id}-${size.id}`)
    setError('')
    try {
      await downloadBackdrop(backdrop, size)
    } catch {
      setError('Could not create the image. Please try again.')
    } finally {
      setBusy('')
    }
  }

  return (
    <section className="admin-surface space-y-3 p-4" aria-labelledby="backdrop-downloads-title">
      <div>
        <h3 id="backdrop-downloads-title" className="text-[15px] text-charcoal">
          Product backdrop
        </h3>
        <p className="mt-0.5 text-[13px] admin-muted">
          The background product photos sit on across the store. Download it, generate your product image on it, then
          upload the result from the product editor.
        </p>
      </div>

      {error && (
        <p className="border border-burgundy/30 bg-burgundy/5 px-3 py-2 text-sm text-burgundy" role="alert">
          {error}
        </p>
      )}

      <ul className="grid max-w-xl gap-3">
        {BACKDROPS.map((b) => (
          <li key={b.id} className="flex gap-3 border border-stone bg-white/60 p-2">
            <span
              aria-hidden
              className="aspect-[3/4] w-20 shrink-0 border border-stone/80 sm:w-24"
              style={{ background: b.previewCss }}
            />
            <div className="flex min-w-0 flex-col">
              <p className="text-[14px] text-charcoal">{b.name}</p>
              <p className="mt-0.5 text-[12px] admin-muted">{b.description}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {BACKDROP_SIZES.map((s) => {
                  const key = `${b.id}-${s.id}`
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className="admin-btn gap-1.5 disabled:opacity-50"
                      disabled={Boolean(busy)}
                      title={`${s.width}×${s.height} PNG`}
                      aria-label={`Download ${b.name}, ${s.label}, ${s.width} by ${s.height} PNG`}
                      onClick={() => download(b, s)}
                    >
                      <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M2.5 13.5h11" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {busy === key ? 'Preparing…' : s.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
