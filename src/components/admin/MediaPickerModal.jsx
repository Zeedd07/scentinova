/**
 * "Select from library" — searchable, paginated picker over the admin media library.
 */
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AdminDialog from './AdminDialog'
import Field from './ui/Field'
import FilterTabs from './ui/FilterTabs'
import { listMedia } from '../../services/mediaApi'
import { ApiClientError } from '../../services/apiClient'
import { MEDIA_CATEGORIES, titleCase } from '../../lib/media'

const PAGE_SIZE = 24
const ALL = 'ALL'
const CATEGORY_TABS = [
  { value: ALL, label: 'All' },
  ...MEDIA_CATEGORIES.map((c) => ({ value: c, label: titleCase(c) })),
]

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
  const [noMatch, setNoMatch] = useState('')

  useEffect(() => {
    if (!open) return
    setSearch(initialSearch)
    setQuery(initialSearch)
    setCategory('')
    setPage(1)
    setPicked(null)
    setNoMatch('')
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
    let fellBack = false
    setLoading(true)
    setError('')
    listMedia({ page, limit: PAGE_SIZE, search: query, type, category, signal: controller.signal })
      .then((r) => {
        // The prefilled note name matched nothing: show the whole library instead of a dead end.
        if (!r.assets.length && query && query === initialSearch && page === 1 && !category) {
          fellBack = true
          setNoMatch(query)
          setSearch('')
          setQuery('')
          return
        }
        setResult(r)
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        setError(err instanceof ApiClientError ? err.message : 'Could not load the media library.')
      })
      .finally(() => {
        if (!controller.signal.aborted && !fellBack) setLoading(false)
      })
    return () => controller.abort()
  }, [open, page, query, type, category, initialSearch])

  const pages = result.meta?.pages || 1
  const showCategories = type === 'NOTE'

  return (
    <AdminDialog
      open={open}
      wide
      tall
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={!picked} onClick={() => picked && onSelect(picked)}>
            Select
          </Button>
        </>
      }
    >
      <Field label="Search">
        <Input
          type="search"
          placeholder="jasmine, amber, oud…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setNoMatch('')
          }}
        />
      </Field>

      {noMatch && (
        <p className="mt-3 border border-stone bg-cream/60 px-3 py-2 text-[13px] text-charcoal" role="status">
          No library images match “{noMatch}”, so all note images are shown. Pick one, or upload a new image for
          this note.
        </p>
      )}

      {showCategories && (
        <FilterTabs
          className="mt-3"
          label="Category"
          options={CATEGORY_TABS}
          value={category || ALL}
          onValueChange={(v) => {
            setCategory(v === ALL ? '' : v)
            setPage(1)
          }}
        />
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
          <Button
            type="button"
            variant="quiet"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </Button>
          <span className="admin-muted tabular-nums">
            Page {page} of {pages}
          </span>
          <Button
            type="button"
            variant="quiet"
            size="sm"
            disabled={page >= pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </Button>
        </div>
      )}
    </AdminDialog>
  )
}
