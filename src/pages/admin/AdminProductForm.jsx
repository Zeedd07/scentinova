/**
 * Create / edit perfume — MongoDB + Cloudinary image uploads.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CATEGORIES } from '../../data/products'
import AdminModal from '../../components/admin/AdminModal'
import {
  adminCreateProduct,
  adminFetchProduct,
  adminUpdateProduct,
} from '../../services/productApi'
import { uploadAdminImage } from '../../services/uploadApi'
import { useCatalog } from '../../context/CatalogContext'
import { ApiClientError } from '../../services/apiClient'

const emptyForm = {
  name: '',
  slug: '',
  tagline: '',
  price: '',
  size: '50ML',
  concentration: 'Parfum',
  category: 'Floral',
  featured: false,
  active: true,
  badge: '',
  stock: 48,
  image: '',
  imagePublicId: null,
  gallery: [],
  galleryPublicIds: [],
  description: '',
  story: '',
  notesTop: '',
  notesHeart: '',
  notesBase: '',
}

function productToForm(p) {
  let gallery = Array.isArray(p.gallery) ? [...p.gallery] : []
  let galleryPublicIds = Array.isArray(p.galleryPublicIds)
    ? [...p.galleryPublicIds]
    : []
  if (!gallery.length && p.image) {
    gallery = [p.image]
    if (p.imagePublicId) galleryPublicIds = [p.imagePublicId]
  }
  while (galleryPublicIds.length < gallery.length) galleryPublicIds.push(null)

  return {
    name: p.name ?? '',
    slug: p.slug ?? '',
    tagline: p.tagline ?? '',
    price: p.price == null ? '' : p.price,
    size: p.size ?? '50ML',
    concentration: p.concentration ?? 'Parfum',
    category: p.category ?? 'Floral',
    featured: Boolean(p.featured),
    active: p.active !== false,
    badge: p.badge ?? '',
    stock: p.stock ?? 0,
    image: p.image ?? gallery[0] ?? '',
    imagePublicId: p.imagePublicId ?? galleryPublicIds[0] ?? null,
    gallery,
    galleryPublicIds,
    description: p.description ?? '',
    story: p.story ?? '',
    notesTop: Array.isArray(p.notes?.top)
      ? p.notes.top.join(', ')
      : String(p.notes?.top || ''),
    notesHeart: Array.isArray(p.notes?.heart)
      ? p.notes.heart.join(', ')
      : String(p.notes?.heart || ''),
    notesBase: Array.isArray(p.notes?.base)
      ? p.notes.base.join(', ')
      : String(p.notes?.base || ''),
  }
}

function parseNotes(value) {
  return String(value || '')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
}

const fieldClass = 'admin-input'
const labelClass = 'admin-label'

export default function AdminProductForm() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { refreshProducts } = useCatalog()

  const [existing, setExisting] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [confirmSave, setConfirmSave] = useState(false)
  const [resultModal, setResultModal] = useState(null)
  const [pendingPayload, setPendingPayload] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    if (isNew) {
      setForm(emptyForm)
      setExisting(null)
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const product = await adminFetchProduct(id)
        if (cancelled) return
        setExisting(product)
        setForm(productToForm(product))
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiClientError
              ? err.message
              : 'Product not found.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const syncPrimary = (gallery, galleryPublicIds) => ({
    gallery,
    galleryPublicIds,
    image: gallery[0] || '',
    imagePublicId: galleryPublicIds[0] || null,
  })

  const onImagesUpload = async (e) => {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    if (!files.length) return
    setUploadError('')
    setUploadProgress(0)
    const slug = form.slug || form.name || 'product'
    try {
      const uploaded = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const role = form.gallery.length === 0 && i === 0 ? 'primary' : 'gallery'
        const asset = await uploadAdminImage(file, {
          slug,
          role,
          onProgress: (pct) => {
            const overall = Math.round(((i + pct / 100) / files.length) * 100)
            setUploadProgress(overall)
          },
        })
        uploaded.push({
          url: asset.url || asset.delivery_url || asset.secure_url,
          publicId: asset.public_id || null,
        })
      }
      setForm((f) => {
        const gallery = [...f.gallery, ...uploaded.map((u) => u.url)]
        const galleryPublicIds = [
          ...f.galleryPublicIds,
          ...uploaded.map((u) => u.publicId).filter(Boolean),
        ]
        // Keep public ids aligned with gallery length when some lacked ids
        while (galleryPublicIds.length < gallery.length) galleryPublicIds.push(null)
        return { ...f, ...syncPrimary(gallery, galleryPublicIds) }
      })
      setStatus({
        type: 'ok',
        text:
          files.length === 1
            ? 'Image uploaded to Cloudinary.'
            : `${files.length} images uploaded to Cloudinary.`,
      })
    } catch (err) {
      setUploadError(
        err instanceof ApiClientError
          ? err.message
          : 'Upload failed. Please try again.',
      )
    } finally {
      setUploadProgress(null)
    }
  }

  const removeGalleryAt = (index) => {
    setForm((f) => {
      const gallery = f.gallery.filter((_, i) => i !== index)
      const galleryPublicIds = f.galleryPublicIds.filter((_, i) => i !== index)
      return { ...f, ...syncPrimary(gallery, galleryPublicIds) }
    })
  }

  const setPrimaryAt = (index) => {
    if (index <= 0) return
    setForm((f) => {
      const gallery = [...f.gallery]
      const galleryPublicIds = [...f.galleryPublicIds]
      while (galleryPublicIds.length < gallery.length) galleryPublicIds.push(null)
      const [url] = gallery.splice(index, 1)
      const [pid] = galleryPublicIds.splice(index, 1)
      gallery.unshift(url)
      galleryPublicIds.unshift(pid)
      return { ...f, ...syncPrimary(gallery, galleryPublicIds) }
    })
  }

  const moveGallery = (index, dir) => {
    setForm((f) => {
      const next = index + dir
      if (next < 0 || next >= f.gallery.length) return f
      const gallery = [...f.gallery]
      const galleryPublicIds = [...f.galleryPublicIds]
      while (galleryPublicIds.length < gallery.length) galleryPublicIds.push(null)
      ;[gallery[index], gallery[next]] = [gallery[next], gallery[index]]
      ;[galleryPublicIds[index], galleryPublicIds[next]] = [
        galleryPublicIds[next],
        galleryPublicIds[index],
      ]
      return { ...f, ...syncPrimary(gallery, galleryPublicIds) }
    })
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setStatus({ type: '', text: '' })

    const gallery = form.gallery.length
      ? form.gallery
      : form.image
        ? [form.image]
        : []
    const image = gallery[0] || '/products/lunar-leather.png'
    const galleryPublicIds = (form.galleryPublicIds || []).slice(0, gallery.length)
    while (galleryPublicIds.length < gallery.length) galleryPublicIds.push(null)

    const priceRaw = form.price
    if (priceRaw === '' || priceRaw == null) {
      setStatus({ type: 'error', text: 'Price is required.' })
      return
    }
    const price = Number(priceRaw)
    if (!Number.isFinite(price) || price < 0) {
      setStatus({ type: 'error', text: 'Enter a valid price in INR.' })
      return
    }

    setPendingPayload({
      name: form.name,
      slug: form.slug || undefined,
      tagline: form.tagline,
      price,
      currency: 'INR',
      size: form.size,
      concentration: form.concentration,
      category: form.category,
      featured: form.featured,
      active: form.active,
      badge: form.badge || null,
      stock: Number(form.stock) || 0,
      image,
      imagePublicId: galleryPublicIds[0] || form.imagePublicId || null,
      gallery,
      galleryPublicIds: galleryPublicIds.filter(Boolean).length
        ? galleryPublicIds.map((id) => id || '')
        : [],
      description: form.description,
      story: form.story,
      notes: {
        top: parseNotes(form.notesTop),
        heart: parseNotes(form.notesHeart),
        base: parseNotes(form.notesBase),
      },
    })
    setConfirmSave(true)
  }

  const performSave = async () => {
    if (!pendingPayload) return
    setConfirmSave(false)
    setSaving(true)

    try {
      const product = isNew
        ? await adminCreateProduct(pendingPayload)
        : await adminUpdateProduct(existing.id, pendingPayload)

      await refreshProducts()
      setPendingPayload(null)
      setSaving(false)

      if (isNew) {
        navigate('/admin/products', {
          replace: true,
          state: {
            flash: {
              tone: 'success',
              title: 'Perfume created',
              message: `“${product.name}” was added to the catalog.`,
            },
          },
        })
        return
      }

      setExisting(product)
      setForm(productToForm(product))
      setResultModal({
        tone: 'success',
        title: 'Changes saved',
        message: `“${product.name}” was updated in Scentinova.`,
      })
      setStatus({ type: 'ok', text: 'Updated successfully.' })
    } catch (err) {
      setSaving(false)
      setPendingPayload(null)
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Could not save this perfume.'
      setResultModal({
        tone: 'danger',
        title: 'Save failed',
        message,
      })
      setStatus({ type: 'error', text: message })
    }
  }

  if (loading) {
    return <p className="admin-muted">Loading perfume…</p>
  }

  if (!isNew && (loadError || !existing)) {
    return (
      <div>
        <p className="admin-muted">{loadError || 'Product not found.'}</p>
        <Link
          to="/admin/products"
          className="admin-link mt-3 inline-block no-underline hover:underline"
        >
          Back to products
        </Link>
      </div>
    )
  }

  const cats = CATEGORIES.filter((c) => c !== 'All')
  const shopSlug = existing?.slug || form.slug
  const uploading = uploadProgress != null
  const imageCount = form.gallery.length || (form.image ? 1 : 0)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            to="/admin/products"
            className="admin-link no-underline hover:underline"
          >
            ← Products
          </Link>
          <h2 className="admin-title mt-2">
            {isNew ? 'New perfume' : `Edit ${existing.name}`}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {status.text && (
            <span
              className={`text-[14px] ${
                status.type === 'error' ? 'text-[#6e1118]' : 'text-[#4a7c3f]'
              }`}
            >
              {status.text}
            </span>
          )}
          {!isNew && shopSlug && form.active && (
            <Link
              to={`/product/${shopSlug}`}
              className="admin-link no-underline hover:underline"
            >
              View on shop →
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} className="admin-surface space-y-6 p-4 sm:p-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={labelClass}>Name</span>
            <input
              required
              className={fieldClass}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Slug</span>
            <input
              className={fieldClass}
              placeholder="auto from name"
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Tagline</span>
            <input
              className={fieldClass}
              value={form.tagline}
              onChange={(e) => set('tagline', e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Price (INR)</span>
            <input
              required
              type="number"
              min="0"
              step="1"
              className={fieldClass}
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Stock</span>
            <input
              type="number"
              min="0"
              className={fieldClass}
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Size</span>
            <input
              className={fieldClass}
              value={form.size}
              onChange={(e) => set('size', e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Concentration</span>
            <input
              className={fieldClass}
              value={form.concentration}
              onChange={(e) => set('concentration', e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Category</span>
            <select
              className={fieldClass}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {cats.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Badge</span>
            <input
              className={fieldClass}
              placeholder="New / Best Seller / Limited"
              value={form.badge}
              onChange={(e) => set('badge', e.target.value)}
            />
          </label>
        </section>

        <section className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-[15px] text-[#1b1917]">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set('featured', e.target.checked)}
            />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-[15px] text-[#1b1917]">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set('active', e.target.checked)}
            />
            Live in shop
          </label>
        </section>

        <section className="space-y-4">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <span className={labelClass}>Product images</span>
                <p className="mt-1 text-[13px] admin-muted">
                  Upload multiple photos per perfume (bottle, packaging, etc.).
                  First image is the shop cover. All go to Cloudinary.
                </p>
              </div>
              <span className="text-[13px] tabular-nums admin-muted">
                {imageCount} {imageCount === 1 ? 'image' : 'images'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="admin-btn admin-btn-quiet cursor-pointer">
                {uploadProgress != null
                  ? `Uploading ${uploadProgress}%`
                  : 'Add images'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  multiple
                  disabled={uploading}
                  onChange={onImagesUpload}
                />
              </label>
              <span className="text-[13px] admin-muted">
                JPEG / PNG / WebP · max 5 MB each · select several at once
              </span>
            </div>
            {uploadProgress != null && (
              <div className="mt-2 h-1.5 w-full max-w-xs rounded-sm bg-[#ebe4d6]">
                <div
                  className="h-full rounded-sm bg-[#b4975a] transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {form.gallery.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {form.gallery.map((url, index) => (
                <li
                  key={`${url}-${index}`}
                  className="relative border border-[#e0d6c4] bg-[#fffcf7] p-3"
                >
                  {index === 0 && (
                    <span className="absolute top-2 left-2 bg-[#1b1917] px-2 py-0.5 text-[10px] tracking-wide text-[#fffcf7] uppercase">
                      Cover
                    </span>
                  )}
                  <div className="flex h-40 items-center justify-center bg-[#f3eee4]">
                    <img
                      src={url}
                      alt={`Product image ${index + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="mt-2 truncate text-[11px] admin-muted">
                    {form.galleryPublicIds[index] ||
                      (url.includes('res.cloudinary.com')
                        ? 'Cloudinary'
                        : 'Local / URL')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {index > 0 && (
                      <button
                        type="button"
                        className="text-[12px] admin-link"
                        onClick={() => setPrimaryAt(index)}
                      >
                        Set as cover
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-[12px] admin-link"
                      disabled={index === 0}
                      onClick={() => moveGallery(index, -1)}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="text-[12px] admin-link"
                      disabled={index === form.gallery.length - 1}
                      onClick={() => moveGallery(index, 1)}
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className="text-[12px] text-[#6e1118]"
                      onClick={() => removeGalleryAt(index)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : form.image ? (
            <div className="border border-[#e0d6c4] bg-[#fffcf7] p-3">
              <img
                src={form.image}
                alt="Primary preview"
                className="h-40 w-auto object-contain"
              />
            </div>
          ) : (
            <p className="border border-dashed border-[#e0d6c4] px-4 py-8 text-center text-[14px] admin-muted">
              No images yet — add at least one for the shop.
            </p>
          )}

          {uploadError && (
            <p className="border border-[#6e1118]/30 bg-[#6e1118]/5 px-3 py-2 text-sm text-[#6e1118]">
              {uploadError}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea
              rows={3}
              className={fieldClass}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Story</span>
            <textarea
              rows={2}
              className={fieldClass}
              value={form.story}
              onChange={(e) => set('story', e.target.value)}
            />
          </label>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <label>
            <span className={labelClass}>Top notes</span>
            <input
              className={fieldClass}
              placeholder="Bergamot, Saffron"
              value={form.notesTop}
              onChange={(e) => set('notesTop', e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Heart notes</span>
            <input
              className={fieldClass}
              placeholder="Rose, Amber"
              value={form.notesHeart}
              onChange={(e) => set('notesHeart', e.target.value)}
            />
          </label>
          <label>
            <span className={labelClass}>Base notes</span>
            <input
              className={fieldClass}
              placeholder="Oud, Musk"
              value={form.notesBase}
              onChange={(e) => set('notesBase', e.target.value)}
            />
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving || uploading}
            className="admin-btn admin-btn-primary disabled:opacity-50"
          >
            {saving ? 'Saving…' : isNew ? 'Create perfume' : 'Save changes'}
          </button>
          <Link to="/shop" className="admin-link no-underline hover:underline">
            Open shop →
          </Link>
        </div>
      </form>

      <AdminModal
        open={confirmSave}
        title={isNew ? 'Create this perfume?' : 'Save changes?'}
        message={
          isNew
            ? `Add “${form.name || 'Untitled'}” to the catalog.`
            : `Update “${form.name || existing?.name}” in Scentinova.`
        }
        confirmLabel={isNew ? 'Create' : 'Save'}
        cancelLabel="Cancel"
        onConfirm={performSave}
        onCancel={() => {
          setConfirmSave(false)
          setPendingPayload(null)
        }}
      />

      <AdminModal
        open={Boolean(resultModal)}
        tone={resultModal?.tone || 'success'}
        title={resultModal?.title || ''}
        message={resultModal?.message || ''}
        confirmLabel="OK"
        hideCancel
        onConfirm={() => setResultModal(null)}
        onCancel={() => setResultModal(null)}
      />
    </div>
  )
}
