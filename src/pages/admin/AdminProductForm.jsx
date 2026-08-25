/**
 * Create / edit perfume — fields match storefront mock schema.
 * CRUD persists to localStorage via CatalogContext.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import { CATEGORIES } from '../../data/products'
import AdminModal from '../../components/admin/AdminModal'

const emptyForm = {
  name: '',
  slug: '',
  tagline: '',
  price: 220,
  size: '50 ml',
  concentration: 'Eau de Parfum',
  category: 'Floral',
  featured: false,
  active: true,
  badge: '',
  stock: 48,
  image: '',
  galleryText: '',
  description: '',
  story: '',
  notesTop: '',
  notesHeart: '',
  notesBase: '',
}

function productToForm(p) {
  return {
    name: p.name ?? '',
    slug: p.slug ?? '',
    tagline: p.tagline ?? '',
    price: p.price ?? 0,
    size: p.size ?? '50 ml',
    concentration: p.concentration ?? 'Eau de Parfum',
    category: p.category ?? 'Floral',
    featured: Boolean(p.featured),
    active: p.active !== false,
    badge: p.badge ?? '',
    stock: p.stock ?? 0,
    image: p.image ?? '',
    galleryText: (p.gallery ?? []).join(', '),
    description: p.description ?? '',
    story: p.story ?? '',
    notesTop: (p.notes?.top ?? []).join(', '),
    notesHeart: (p.notes?.heart ?? []).join(', '),
    notesBase: (p.notes?.base ?? []).join(', '),
  }
}

/** Compress uploads so localStorage CRUD does not hit quota. */
function fileToCompressedDataUrl(file, maxW = 720, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }
    img.src = url
  })
}

const fieldClass =
  'mt-1.5 w-full border border-gold/25 bg-ink px-3 py-2.5 text-sm text-cream outline-none placeholder:text-bronze/60 focus:border-gold'

const labelClass =
  'block text-[10px] tracking-[0.28em] text-bronze uppercase'

export default function AdminProductForm() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { getById, saveProduct } = useCatalog()
  const existing = useMemo(
    () => (isNew ? null : getById(id)),
    [getById, id, isNew],
  )

  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)
  const [resultModal, setResultModal] = useState(null)
  const [pendingPayload, setPendingPayload] = useState(null)

  useEffect(() => {
    if (existing) setForm(productToForm(existing))
    else if (isNew) setForm(emptyForm)
  }, [existing, isNew])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const onUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setStatus({ type: '', text: '' })
      const dataUrl = await fileToCompressedDataUrl(file)
      setForm((f) => ({
        ...f,
        image: dataUrl,
        galleryText: f.galleryText.trim() ? f.galleryText : dataUrl,
      }))
    } catch {
      setStatus({ type: 'error', text: 'Could not read that image.' })
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setStatus({ type: '', text: '' })

    const gallery = form.galleryText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !s.startsWith('(uploaded'))

    const image = form.image || gallery[0] || '/products/aurum.png'

    setPendingPayload({
      name: form.name,
      slug: form.slug,
      tagline: form.tagline,
      price: Number(form.price),
      size: form.size,
      concentration: form.concentration,
      category: form.category,
      featured: form.featured,
      active: form.active,
      badge: form.badge || null,
      stock: Number(form.stock),
      image,
      gallery: gallery.length ? gallery : [image],
      description: form.description,
      story: form.story,
      notes: {
        top: form.notesTop,
        heart: form.notesHeart,
        base: form.notesBase,
      },
    })
    setConfirmSave(true)
  }

  const performSave = () => {
    if (!pendingPayload) return
    setConfirmSave(false)
    setSaving(true)

    const creating = isNew
    const result = saveProduct(pendingPayload, creating ? null : existing?.id)
    setSaving(false)
    setPendingPayload(null)

    if (!result.ok) {
      setResultModal({
        tone: 'danger',
        title: 'Save failed',
        message: result.error || 'Could not save this perfume.',
      })
      setStatus({ type: 'error', text: result.error || 'Save failed.' })
      return
    }

    if (creating) {
      navigate('/admin/products', {
        replace: true,
        state: {
          flash: {
            tone: 'success',
            title: 'Perfume created',
            message: `“${result.product?.name || pendingPayload.name}” was added to the catalog${
              pendingPayload.active ? ' and is live in the shop' : ''
            }.`,
          },
        },
      })
      return
    }

    setResultModal({
      tone: 'success',
      title: 'Changes saved',
      message: `“${result.product?.name || pendingPayload.name}” was updated. The shop will show the new details.`,
    })

    setStatus({ type: 'ok', text: 'Updated successfully.' })

    if (result.product) {
      setForm(productToForm(result.product))
    }
  }

  if (!isNew && !existing) {
    return (
      <div>
        <p className="text-bronze">Product not found.</p>
        <Link to="/admin/products" className="mt-4 inline-block text-gold">
          Back to products
        </Link>
      </div>
    )
  }

  const cats = CATEGORIES.filter((c) => c !== 'All')
  const shopSlug = existing?.slug || form.slug

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/admin/products"
            className="text-[11px] tracking-[0.28em] text-bronze uppercase hover:text-cream"
          >
            ← Products
          </Link>
          <h2 className="mt-2 font-display text-3xl text-cream">
            {isNew ? 'New perfume' : `Edit ${existing.name}`}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {status.text && (
            <span
              className={`text-[11px] tracking-[0.2em] uppercase ${
                status.type === 'error' ? 'text-champagne' : 'text-gold'
              }`}
            >
              {status.text}
            </span>
          )}
          {!isNew && shopSlug && form.active && (
            <Link
              to={`/product/${shopSlug}`}
              className="text-[11px] tracking-[0.22em] text-bronze uppercase hover:text-gold-light"
            >
              View on shop →
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
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
            <span className={labelClass}>Price (USD)</span>
            <input
              required
              type="number"
              min="0"
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
          <label className="flex items-center gap-2 text-sm text-bronze">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set('featured', e.target.checked)}
            />
            Featured on homepage
          </label>
          <label className="flex items-center gap-2 text-sm text-bronze">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set('active', e.target.checked)}
            />
            Live in shop
          </label>
        </section>

        <section className="space-y-4">
          <label className="block">
            <span className={labelClass}>Bottle image upload</span>
            <input
              type="file"
              accept="image/*"
              className="mt-2 block w-full text-sm text-bronze file:mr-4 file:border file:border-gold/30 file:bg-ink file:px-3 file:py-2 file:text-cream"
              onChange={onUpload}
            />
            <p className="mt-1 text-[11px] text-bronze/80">
              Images are compressed for mock storage. Prefer paths like
              /products/name.png for reliability.
            </p>
          </label>
          <label className="block">
            <span className={labelClass}>Image URL / path</span>
            <input
              className={fieldClass}
              placeholder="/products/name.png"
              value={form.image.startsWith('data:') ? '' : form.image}
              onChange={(e) => {
                const v = e.target.value
                setForm((f) => ({
                  ...f,
                  image: v,
                  galleryText:
                    f.galleryText.startsWith('data:') || !f.galleryText.trim()
                      ? v
                      : f.galleryText,
                }))
              }}
            />
          </label>
          {form.image && (
            <img
              src={form.image}
              alt="Preview"
              className="h-40 w-auto object-contain"
            />
          )}
          <label className="block">
            <span className={labelClass}>Gallery (comma-separated URLs)</span>
            <textarea
              rows={2}
              className={fieldClass}
              value={
                form.galleryText.includes('data:')
                  ? '(uploaded image stored)'
                  : form.galleryText
              }
              onChange={(e) => set('galleryText', e.target.value)}
              disabled={form.galleryText.includes('data:')}
            />
          </label>
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

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-luxury gold-border px-8 py-3.5 text-cream disabled:opacity-50"
          >
            {saving
              ? 'Saving…'
              : isNew
                ? 'Create perfume'
                : 'Save changes'}
          </button>
          <Link
            to="/shop"
            className="text-[11px] tracking-[0.22em] text-bronze uppercase hover:text-cream"
          >
            Open shop →
          </Link>
        </div>
      </form>

      <AdminModal
        open={confirmSave}
        title={isNew ? 'Create this perfume?' : 'Save changes?'}
        message={
          isNew
            ? `Add “${form.name || 'Untitled'}” to the catalog${
                form.active ? ' and publish it to the shop' : ' (hidden from shop)'
              }.`
            : `Update “${form.name || existing?.name}” in the catalog and shop.`
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
