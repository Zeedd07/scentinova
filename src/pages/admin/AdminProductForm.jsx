/**
 * Create / edit perfume - MongoDB + Cloudinary image uploads.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CATEGORIES } from '../../data/products'
import AdminModal from '../../components/admin/AdminModal'
import {
  adminCreateProduct,
  adminFetchProduct,
  adminUpdateProduct,
} from '../../services/productApi'
import { uploadAdminImage, uploadAdminVideo } from '../../services/uploadApi'
import { useCatalog } from '../../context/CatalogContext'
import { ApiClientError } from '../../services/apiClient'
import NoteImageEditor from '../../components/admin/NoteImageEditor'
import ProductFeesEditor from '../../components/admin/ProductFeesEditor'
import { EMPTY_FEES_FORM, feesToForm, parseFeesForm } from '../../lib/productFees'
import {
  IMAGE_SCALE_MAX,
  IMAGE_SCALE_MIN,
  IMAGE_SCALE_STEP,
  clampImageScale,
  imageScaleStyle,
} from '../../lib/imageScale'

function ImageSizeControl({ index, scale, onChange }) {
  const pct = Math.round(scale * 100)
  const stepBtn =
    'flex h-7 w-7 shrink-0 items-center justify-center border border-[#e0d6c4] bg-[#fffcf7] text-[15px] leading-none text-[#1b1917] transition hover:bg-[#f0e9dc] disabled:opacity-40'
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[12px]">
        <span className="admin-muted">Size on website</span>
        <span className="flex items-center gap-2">
          <span className="tabular-nums text-[#1b1917]">{pct}%</span>
          {scale !== 1 && (
            <button type="button" className="admin-link text-[12px]" onClick={() => onChange(1)}>
              Reset
            </button>
          )}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          className={stepBtn}
          onClick={() => onChange(scale - IMAGE_SCALE_STEP)}
          disabled={scale <= IMAGE_SCALE_MIN}
          aria-label={`Make image ${index + 1} smaller`}
        >
          −
        </button>
        <input
          type="range"
          min={IMAGE_SCALE_MIN}
          max={IMAGE_SCALE_MAX}
          step={IMAGE_SCALE_STEP}
          value={scale}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`Size of image ${index + 1} on the website`}
          aria-valuetext={`${pct}%`}
          className="min-w-0 flex-1 accent-[#1b1917]"
        />
        <button
          type="button"
          className={stepBtn}
          onClick={() => onChange(scale + IMAGE_SCALE_STEP)}
          disabled={scale >= IMAGE_SCALE_MAX}
          aria-label={`Make image ${index + 1} bigger`}
        >
          +
        </button>
      </div>
    </div>
  )
}

const MAX_VIDEOS = 6
const MAX_VIDEO_MB = 100
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return ''
  const s = Math.round(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

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
  galleryScales: [],
  videos: [],
  description: '',
  story: '',
  notesTop: '',
  notesHeart: '',
  notesBase: '',
  noteImages: [],
  fees: EMPTY_FEES_FORM,
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
  const galleryScales = gallery.map((_, i) => clampImageScale(p.galleryScales?.[i] ?? 1))

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
    galleryScales,
    videos: (p.videos || []).filter((v) => v?.publicId && v?.url),
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
    noteImages: (p.noteImages || []).map((n) => ({
      tier: n.tier,
      noteKey: n.noteKey,
      assetId: n.assetId ? String(n.assetId) : null,
      alt: n.alt || null,
      hideImage: Boolean(n.hideImage),
    })),
    fees: feesToForm(p.fees),
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
  const [feeErrors, setFeeErrors] = useState({})
  const [pendingRemove, setPendingRemove] = useState(null)
  const [videoProgress, setVideoProgress] = useState(null)
  const [videoError, setVideoError] = useState('')
  const [pendingVideoRemove, setPendingVideoRemove] = useState(null)

  const parsedNotes = useMemo(
    () => ({
      top: parseNotes(form.notesTop),
      heart: parseNotes(form.notesHeart),
      base: parseNotes(form.notesBase),
    }),
    [form.notesTop, form.notesHeart, form.notesBase],
  )

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

  const syncPrimary = (gallery, galleryPublicIds, galleryScales) => ({
    gallery,
    galleryPublicIds,
    galleryScales: gallery.map((_, i) => galleryScales?.[i] ?? 1),
    image: gallery[0] || '',
    imagePublicId: galleryPublicIds[0] || null,
  })

  const setScaleAt = (index, value) => {
    setForm((f) => {
      const galleryScales = f.gallery.map((_, i) => f.galleryScales[i] ?? 1)
      galleryScales[index] = Math.round(clampImageScale(value) * 100) / 100
      return { ...f, galleryScales }
    })
  }

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
        return { ...f, ...syncPrimary(gallery, galleryPublicIds, f.galleryScales) }
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

  const onVideosUpload = async (e) => {
    const picked = [...(e.target.files || [])]
    e.target.value = ''
    if (!picked.length) return
    setVideoError('')
    const room = MAX_VIDEOS - form.videos.length
    if (room <= 0) {
      setVideoError(`Up to ${MAX_VIDEOS} videos per perfume.`)
      return
    }
    const bad = picked.find(
      (f) => !VIDEO_TYPES.includes(f.type) || f.size > MAX_VIDEO_MB * 1024 * 1024,
    )
    if (bad) {
      setVideoError(
        VIDEO_TYPES.includes(bad.type)
          ? `“${bad.name}” is larger than ${MAX_VIDEO_MB} MB.`
          : `“${bad.name}” is not an MP4, MOV or WebM video.`,
      )
      return
    }
    const files = picked.slice(0, room)
    const slug = form.slug || form.name || 'product'
    setVideoProgress(0)
    try {
      for (let i = 0; i < files.length; i++) {
        const video = await uploadAdminVideo(files[i], {
          slug,
          onProgress: (pct) => {
            setVideoProgress(Math.round(((i + pct / 100) / files.length) * 100))
          },
        })
        setForm((f) => ({ ...f, videos: [...f.videos, video] }))
      }
      setStatus({
        type: 'ok',
        text:
          picked.length > files.length
            ? `${files.length} uploaded - only ${MAX_VIDEOS} videos are allowed.`
            : files.length === 1
              ? 'Video uploaded to Cloudinary. Save to publish it.'
              : `${files.length} videos uploaded to Cloudinary. Save to publish them.`,
      })
    } catch (err) {
      setVideoError(
        err instanceof ApiClientError ? err.message : 'Video upload failed. Please try again.',
      )
    } finally {
      setVideoProgress(null)
    }
  }

  const moveVideo = (index, dir) => {
    setForm((f) => {
      const next = index + dir
      if (next < 0 || next >= f.videos.length) return f
      const videos = [...f.videos]
      ;[videos[index], videos[next]] = [videos[next], videos[index]]
      return { ...f, videos }
    })
  }

  const removeGalleryAt = (index) => {
    setForm((f) => {
      const gallery = f.gallery.filter((_, i) => i !== index)
      const galleryPublicIds = f.galleryPublicIds.filter((_, i) => i !== index)
      const galleryScales = f.galleryScales.filter((_, i) => i !== index)
      return { ...f, ...syncPrimary(gallery, galleryPublicIds, galleryScales) }
    })
  }

  const setPrimaryAt = (index) => {
    if (index <= 0) return
    setForm((f) => {
      const gallery = [...f.gallery]
      const galleryPublicIds = [...f.galleryPublicIds]
      while (galleryPublicIds.length < gallery.length) galleryPublicIds.push(null)
      const galleryScales = f.gallery.map((_, i) => f.galleryScales[i] ?? 1)
      const [url] = gallery.splice(index, 1)
      const [pid] = galleryPublicIds.splice(index, 1)
      const [scale] = galleryScales.splice(index, 1)
      gallery.unshift(url)
      galleryPublicIds.unshift(pid)
      galleryScales.unshift(scale)
      return { ...f, ...syncPrimary(gallery, galleryPublicIds, galleryScales) }
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
      const galleryScales = f.gallery.map((_, i) => f.galleryScales[i] ?? 1)
      ;[galleryScales[index], galleryScales[next]] = [galleryScales[next], galleryScales[index]]
      return { ...f, ...syncPrimary(gallery, galleryPublicIds, galleryScales) }
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

    const { fees, errors: nextFeeErrors } = parseFeesForm(form.fees)
    setFeeErrors(nextFeeErrors)
    if (!fees) {
      setStatus({ type: 'error', text: 'Fix the fee amounts before saving.' })
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
      galleryScales: gallery.map((_, i) => clampImageScale(form.galleryScales[i] ?? 1)),
      videos: form.videos.map(({ publicId, url, posterUrl, width, height, duration }) => ({
        publicId,
        url,
        posterUrl: posterUrl ?? null,
        width: width ?? null,
        height: height ?? null,
        duration: duration ?? null,
      })),
      description: form.description,
      story: form.story,
      notes: parsedNotes,
      noteImages: form.noteImages,
      fees,
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
  const videoUploading = videoProgress != null
  const uploading = uploadProgress != null || videoUploading
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
          <div>
            <label className="flex items-center gap-2 text-[15px] text-[#1b1917]">
              <input
                type="checkbox"
                checked={form.featured}
                aria-describedby="featured-hint"
                onChange={(e) => set('featured', e.target.checked)}
              />
              Featured on homepage
            </label>
            <p id="featured-hint" className="mt-1 pl-6 text-[12px] admin-muted">
              Shown in the homepage signatures section (up to 4 live products).
            </p>
          </div>
          <label className="flex items-center gap-2 text-[15px] text-[#1b1917]">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set('active', e.target.checked)}
            />
            Live in shop
          </label>
        </section>

        <section className="border-t border-stone pt-6">
          <ProductFeesEditor
            value={form.fees}
            errors={feeErrors}
            onChange={(next) => {
              set('fees', next)
              setFeeErrors({})
            }}
          />
        </section>

        <section className="space-y-4">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <span className={labelClass}>Product images</span>
                <p className="mt-1 text-[13px] admin-muted">
                  Upload multiple photos per perfume (bottle, packaging, etc.).
                  First image is the shop cover. All go to Cloudinary. Use
                  &ldquo;Size on website&rdquo; to make a bottle look bigger or smaller.
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
                  className="h-full rounded-sm bg-gold transition-all"
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
                  <div className="flex h-40 items-center justify-center overflow-hidden bg-[#f3eee4]">
                    <img
                      src={url}
                      alt={`Product image ${index + 1}`}
                      className="max-h-full max-w-full object-contain transition-transform duration-150"
                      style={imageScaleStyle(form.galleryScales[index] ?? 1)}
                    />
                  </div>
                  <ImageSizeControl
                    index={index}
                    scale={form.galleryScales[index] ?? 1}
                    onChange={(value) => setScaleAt(index, value)}
                  />
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
                      onClick={() => setPendingRemove({ url, index })}
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
              No images yet - add at least one for the shop.
            </p>
          )}

          {uploadError && (
            <p className="border border-[#6e1118]/30 bg-[#6e1118]/5 px-3 py-2 text-sm text-[#6e1118]">
              {uploadError}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <span className={labelClass}>Product videos</span>
                <p className="mt-1 text-[13px] admin-muted">
                  Short clips shown after the photos on the product page. They play
                  muted and loop. All go to Cloudinary.
                </p>
              </div>
              <span className="text-[13px] tabular-nums admin-muted">
                {form.videos.length} / {MAX_VIDEOS}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label
                className={`admin-btn admin-btn-quiet ${
                  uploading || form.videos.length >= MAX_VIDEOS
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                }`}
              >
                {videoUploading
                  ? videoProgress >= 100
                    ? 'Processing…'
                    : `Uploading ${videoProgress}%`
                  : 'Add videos'}
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  multiple
                  disabled={uploading || form.videos.length >= MAX_VIDEOS}
                  onChange={onVideosUpload}
                />
              </label>
              <span className="text-[13px] admin-muted">
                MP4 / MOV / WebM · max {MAX_VIDEO_MB} MB each
              </span>
            </div>
            {videoUploading && (
              <div className="mt-2 h-1.5 w-full max-w-xs rounded-sm bg-[#ebe4d6]">
                <div
                  className="h-full rounded-sm bg-gold transition-all"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            )}
          </div>

          {form.videos.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {form.videos.map((video, index) => (
                <li
                  key={video.publicId}
                  className="border border-[#e0d6c4] bg-[#fffcf7] p-3"
                >
                  <div className="flex h-40 items-center justify-center overflow-hidden bg-[#f3eee4]">
                    <video
                      src={video.url}
                      poster={video.posterUrl || undefined}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="max-h-full max-w-full"
                      aria-label={`Product video ${index + 1}`}
                    />
                  </div>
                  <p className="mt-2 truncate text-[11px] admin-muted">
                    {video.publicId}
                    {video.duration ? ` · ${formatDuration(video.duration)}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="text-[12px] admin-link"
                      disabled={index === 0}
                      onClick={() => moveVideo(index, -1)}
                      aria-label={`Move video ${index + 1} earlier`}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="text-[12px] admin-link"
                      disabled={index === form.videos.length - 1}
                      onClick={() => moveVideo(index, 1)}
                      aria-label={`Move video ${index + 1} later`}
                    >
                      →
                    </button>
                    <button
                      type="button"
                      className="text-[12px] text-[#6e1118]"
                      onClick={() => setPendingVideoRemove(video.publicId)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {videoError && (
            <p className="border border-[#6e1118]/30 bg-[#6e1118]/5 px-3 py-2 text-sm text-[#6e1118]">
              {videoError}
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

        <section className="border-t border-stone pt-6">
          <NoteImageEditor
            key={existing?.updatedAt || existing?.id || 'new'}
            notes={parsedNotes}
            noteImages={form.noteImages}
            initialMedia={existing?.media}
            onChange={(next) => set('noteImages', next)}
          />
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
        open={Boolean(pendingRemove)}
        tone="danger"
        title="Remove this image?"
        message={
          pendingRemove?.index === 0 && form.gallery.length > 1
            ? 'This is the cover image, so the next image becomes the cover. The change is applied when you save the perfume.'
            : 'It will be taken off this perfume when you save.'
        }
        confirmLabel="Remove image"
        cancelLabel="Keep image"
        onConfirm={() => {
          const at = form.gallery.indexOf(pendingRemove.url)
          if (at !== -1) removeGalleryAt(at)
          setPendingRemove(null)
        }}
        onCancel={() => setPendingRemove(null)}
      />

      <AdminModal
        open={Boolean(pendingVideoRemove)}
        tone="danger"
        title="Remove this video?"
        message="It will be taken off this perfume and deleted from Cloudinary when you save."
        confirmLabel="Remove video"
        cancelLabel="Keep video"
        onConfirm={() => {
          setForm((f) => ({
            ...f,
            videos: f.videos.filter((v) => v.publicId !== pendingVideoRemove),
          }))
          setPendingVideoRemove(null)
        }}
        onCancel={() => setPendingVideoRemove(null)}
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
