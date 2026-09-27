/**
 * Media library — shared Cloudinary assets (note images, product backgrounds).
 * Deleting is blocked while any product still uses an asset.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminDialog from '../../components/admin/AdminDialog'
import AdminModal from '../../components/admin/AdminModal'
import MediaUploadModal from '../../components/admin/MediaUploadModal'
import { deleteMedia, getMedia, listMedia, updateMedia } from '../../services/mediaApi'
import { ApiClientError } from '../../services/apiClient'
import { MEDIA_CATEGORIES, MEDIA_TYPE_LABELS, titleCase } from '../../lib/media'

const PAGE_SIZE = 24
const TYPE_TABS = [
  { value: '', label: 'All' },
  { value: 'NOTE', label: 'Note images' },
  { value: 'PRODUCT_BACKGROUND', label: 'Backgrounds' },
  { value: 'OTHER', label: 'Other' },
]

function errorText(err, fallback) {
  return err instanceof ApiClientError ? err.message : fallback
}

function AssetDetail({ assetId, onClose, onChanged, onDeleted }) {
  const [data, setData] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!assetId) return undefined
    let cancelled = false
    setData(null)
    setError('')
    getMedia(assetId)
      .then((d) => {
        if (cancelled) return
        setData(d)
        setForm({
          name: d.asset.name,
          altText: d.asset.altText || '',
          category: d.asset.category,
          tags: (d.asset.tags || []).join(', '),
        })
      })
      .catch((err) => !cancelled && setError(errorText(err, 'Could not load this image.')))
    return () => {
      cancelled = true
    }
  }, [assetId])

  const asset = data?.asset
  const usage = data?.usage

  const save = async (patch) => {
    setSaving(true)
    setError('')
    try {
      const updated = await updateMedia(asset.id, patch)
      setData((d) => ({ ...d, asset: updated }))
      onChanged(updated)
    } catch (err) {
      setError(errorText(err, 'Could not save changes.'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setConfirmDelete(false)
    setSaving(true)
    setError('')
    try {
      await deleteMedia(asset.id)
      onDeleted(asset.id)
    } catch (err) {
      setError(errorText(err, 'Could not delete this image.'))
      if (err?.fields?.usage) setData((d) => ({ ...d, usage: err.fields.usage }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <AdminDialog
      open={Boolean(assetId)}
      wide
      title={asset ? asset.name : 'Image'}
      onClose={onClose}
      footer={
        asset && (
          <>
            <button
              type="button"
              className="admin-btn admin-btn-danger mr-auto disabled:opacity-50"
              disabled={saving}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
            <a href={asset.downloadUrl} className="admin-btn no-underline" rel="noopener noreferrer">
              Download original
            </a>
            <button
              type="button"
              className="admin-btn admin-btn-primary disabled:opacity-50"
              disabled={saving || !form?.name.trim()}
              onClick={() => save({ ...form, name: form.name.trim() })}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        )
      }
    >
      {!asset && !error && <p className="admin-muted">Loading…</p>}
      {error && (
        <p className="mb-4 border border-burgundy/30 bg-burgundy/5 px-3 py-2 text-sm text-burgundy">{error}</p>
      )}
      {asset && form && (
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <div className="flex aspect-square items-center justify-center overflow-hidden border border-stone bg-cream">
              <img src={asset.previewUrl} alt={asset.altText || asset.name} className="max-h-full max-w-full object-contain" />
            </div>
            <p className="mt-2 break-all text-[11px] admin-muted">{asset.publicId}</p>
            <p className="text-[11px] admin-muted tabular-nums">
              {asset.width}×{asset.height} · {asset.format?.toUpperCase()}
              {asset.bytes ? ` · ${Math.round(asset.bytes / 1024)} KB` : ''}
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-[12px] tracking-wide text-muted uppercase">{MEDIA_TYPE_LABELS[asset.type]}</p>
            <label className="block">
              <span className="admin-label">Name</span>
              <input
                className="admin-input"
                maxLength={120}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="admin-label">Alt text</span>
              <input
                className="admin-input"
                maxLength={200}
                value={form.altText}
                onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="admin-label">Category</span>
                <select
                  className="admin-input"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {MEDIA_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {titleCase(c)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="admin-label">Tags</span>
                <input
                  className="admin-input"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                />
              </label>
            </div>

            {asset.type === 'NOTE' && (
              <div className="border border-stone bg-white/60 p-3 text-[14px]">
                {asset.isDefault ? (
                  <p>
                    Global default for <strong>{asset.noteKey}</strong>. Perfumes with this note show it unless they
                    choose another image.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>Not the global default for “{asset.noteKey}”.</span>
                    <button
                      type="button"
                      className="admin-btn admin-btn-quiet px-3 py-1 text-[13px]"
                      disabled={saving}
                      onClick={() => save({ isDefault: true })}
                    >
                      Make global default
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="admin-label">
                Used by {usage?.count ?? 0} {usage?.count === 1 ? 'product' : 'products'}
              </p>
              {usage?.products?.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-[14px]">
                  {usage.products.map((p) => (
                    <li key={p.id}>
                      <Link to={`/admin/products/${p.id}`} className="admin-link">
                        {p.name}
                      </Link>
                      {!p.active && <span className="ml-2 text-[12px] admin-muted">(not live)</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminDialog>
    <AdminModal
      open={confirmDelete}
      tone="danger"
      title="Delete this image?"
      message="It will be removed from Cloudinary permanently. Images still used by products cannot be deleted."
      confirmLabel="Delete"
      onConfirm={remove}
      onCancel={() => setConfirmDelete(false)}
    />
    </>
  )
}

export default function AdminMediaLibrary() {
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ assets: [], meta: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(
    (signal) => {
      setLoading(true)
      setError('')
      return listMedia({ page, limit: PAGE_SIZE, search: query, type, category, signal })
        .then(setResult)
        .catch((err) => {
          if (!signal?.aborted) setError(errorText(err, 'Could not load the media library.'))
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false)
        })
    },
    [page, query, type, category],
  )

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const pages = result.meta?.pages || 1

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="admin-title">Media library</h2>
          <p className="mt-1 text-[14px] admin-muted">
            Shared note images and product backgrounds, stored on Cloudinary.
            {result.meta ? ` ${result.meta.total} ${result.meta.total === 1 ? 'image' : 'images'}.` : ''}
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => setUploadOpen(true)}>
          Upload image
        </button>
      </div>

      {flash && (
        <p className="border border-success/30 bg-success/5 px-3 py-2 text-sm text-success" role="status">
          {flash}
        </p>
      )}

      <div className="admin-surface space-y-3 p-4">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Asset type">
          {TYPE_TABS.map((t) => (
            <button
              key={t.value || 'all'}
              type="button"
              role="tab"
              aria-selected={type === t.value}
              onClick={() => {
                setType(t.value)
                setPage(1)
              }}
              className={`rounded-sm px-3 py-1.5 text-[14px] transition ${
                type === t.value ? 'bg-charcoal text-warm-white' : 'text-charcoal hover:bg-cream'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="admin-label">Search</span>
            <input
              type="search"
              className="admin-input"
              placeholder="Name or tag"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="admin-label">Category</span>
            <select
              className="admin-input"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All categories</option>
              {MEDIA_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {titleCase(c)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <p className="border border-burgundy/30 bg-burgundy/5 px-3 py-2 text-sm text-burgundy">{error}</p>
      )}

      {!loading && !error && result.assets.length === 0 ? (
        <p className="border border-dashed border-stone px-4 py-10 text-center text-[14px] admin-muted">
          No images yet{query ? ` for “${query}”` : ''}.
        </p>
      ) : (
        <ul
          className={`grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 ${loading ? 'opacity-50' : ''}`}
          aria-busy={loading}
        >
          {result.assets.map((asset) => (
            <li key={asset.id}>
              <button
                type="button"
                onClick={() => setDetailId(asset.id)}
                className="block w-full border border-stone bg-white/60 p-1.5 text-left transition hover:border-charcoal"
              >
                <span className="block aspect-square overflow-hidden bg-cream">
                  <img src={asset.thumbUrl} alt={asset.altText || asset.name} loading="lazy" className="h-full w-full object-cover" />
                </span>
                <span className="mt-1.5 block truncate text-[13px] text-charcoal">{asset.name}</span>
                <span className="block truncate text-[10px] tracking-wide text-muted uppercase">
                  {asset.type === 'NOTE' ? (asset.isDefault ? 'Default · ' : '') + titleCase(asset.category) : MEDIA_TYPE_LABELS[asset.type]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between text-[14px]">
          <button type="button" className="admin-link disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
            ← Previous
          </button>
          <span className="admin-muted tabular-nums">
            Page {page} of {pages}
          </span>
          <button type="button" className="admin-link disabled:opacity-40" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)}>
            Next →
          </button>
        </div>
      )}

      <MediaUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(asset) => {
          setUploadOpen(false)
          setFlash(`“${asset.name}” uploaded.`)
          load()
        }}
      />

      <AssetDetail
        assetId={detailId}
        onClose={() => setDetailId(null)}
        onChanged={(updated) =>
          setResult((r) => ({ ...r, assets: r.assets.map((a) => (a.id === updated.id ? updated : a)) }))
        }
        onDeleted={(id) => {
          setDetailId(null)
          setFlash('Image deleted.')
          setResult((r) => ({ ...r, assets: r.assets.filter((a) => a.id !== id) }))
          load()
        }}
      />
    </div>
  )
}
