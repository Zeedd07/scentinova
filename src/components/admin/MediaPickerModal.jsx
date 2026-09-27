/**
 * "Select from library" — searchable, paginated picker over the admin media library.
 */
import { useEffect, useState } from 'react'
import AdminDialog from './AdminDialog'
import { listMedia } from '../../services/mediaApi'
import { ApiClientError } from '../../services/apiClient'
import { MEDIA_CATEGORIES, titleCase } from '../../lib/media'

const PAGE_SIZE = 24

export default function MediaPickerModal({
  open,
  type = 'NOTE',
  title = 'Select note image',
  initialSearch = '',
  selectedId = null,
  onSelect,
  onClose,
}) {
  const [search, setSearch] = useState(initialSearch)
  const [query, setQuery] = useState(initialSearch)
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ assets: [], meta: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    if (!open) return
    setSearch(initialSearch)
    setQuery(initialSearch)
    setCategory('')
    setPage(1)
    setPicked(null)
  }, [open, initialSearch])

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!open) return undefined
    const controller = new AbortController()
    setLoading(true)
    setError('')
    listMedia({ page, limit: PAGE_SIZE, search: query, type, category, signal: controller.signal })
      .then((r) => setResult(r))
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof ApiClientError ? err.message : 'Could not load the media library.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [open, page, query, type, category])

  const pages = result.meta?.pages || 1
  const showCategories = type === 'NOTE'

  return (
    <AdminDialog
      open={open}
      wide
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="admin-btn admin-btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary disabled:opacity-50"
            disabled={!picked}
            onClick={() => picked && onSelect(picked)}
          >
            Select
          </button>
        </>
      }
    >
      <label className="block">
        <span className="admin-label">Search</span>
        <input
          type="search"
          className="admin-input"
          placeholder="jasmine, amber, oud…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {showCategories && (
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Category">
          {['', ...MEDIA_CATEGORIES].map((c) => (
            <button
              key={c || 'all'}
              type="button"
              aria-pressed={category === c}
              onClick={() => {
                setCategory(c)
                setPage(1)
              }}
              className={`rounded-sm border px-2.5 py-1 text-[12px] transition ${
                category === c
                  ? 'border-charcoal bg-charcoal text-warm-white'
                  : 'border-stone text-charcoal hover:border-charcoal'
              }`}
            >
              {c ? titleCase(c) : 'All'}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-4 border border-burgundy/30 bg-burgundy/5 px-3 py-2 text-sm text-burgundy">{error}</p>
      )}

      <div className="mt-4 min-h-[220px]" aria-busy={loading}>
        {!loading && !error && result.assets.length === 0 && (
          <p className="py-10 text-center text-[14px] admin-muted">
            No images found{query ? ` for “${query}”` : ''}. Upload one instead.
          </p>
        )}
        <ul className={`grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 ${loading ? 'opacity-50' : ''}`}>
          {result.assets.map((asset) => {
            const isPicked = picked?.id === asset.id
            const isCurrent = selectedId === asset.id
            return (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => setPicked(asset)}
                  onDoubleClick={() => onSelect(asset)}
                  aria-pressed={isPicked}
                  className={`group block w-full border p-1.5 text-left transition ${
                    isPicked ? 'border-scent-red ring-2 ring-scent-red/20' : 'border-stone hover:border-charcoal'
                  }`}
                >
                  <span className="block aspect-square overflow-hidden bg-cream">
                    <img
                      src={asset.thumbUrl}
                      alt={asset.altText || asset.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="mt-1.5 block truncate text-[12px] text-charcoal">{asset.name}</span>
                  <span className="block truncate text-[10px] tracking-wide text-muted uppercase">
                    {isCurrent ? 'Current' : asset.isDefault ? 'Default' : titleCase(asset.category)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-[13px]">
          <button
            type="button"
            className="admin-link disabled:opacity-40"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </button>
          <span className="admin-muted tabular-nums">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            className="admin-link disabled:opacity-40"
            disabled={page >= pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </AdminDialog>
  )
}
