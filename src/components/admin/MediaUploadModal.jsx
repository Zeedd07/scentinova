/**
 * Upload a new library asset (validated client-side, stored via the backend on Cloudinary).
 */
import { useEffect, useState } from 'react'
import AdminDialog from './AdminDialog'
import { uploadMedia } from '../../services/mediaApi'
import { ApiClientError } from '../../services/apiClient'
import {
  MEDIA_CATEGORIES,
  MEDIA_TYPE_LABELS,
  defaultAltText,
  titleCase,
  validateImageFile,
} from '../../lib/media'

export default function MediaUploadModal({
  open,
  type: fixedType = null,
  defaultName = '',
  defaultCategory = 'OTHER',
  onUploaded,
  onClose,
}) {
  const [type, setType] = useState(fixedType || 'NOTE')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [name, setName] = useState(defaultName)
  const [category, setCategory] = useState(defaultCategory)
  const [altText, setAltText] = useState('')
  const [altTouched, setAltTouched] = useState(false)
  const [tags, setTags] = useState('')
  const [makeDefault, setMakeDefault] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setType(fixedType || 'NOTE')
    setFile(null)
    setName(defaultName)
    setCategory(defaultCategory)
    setAltText(defaultAltText(fixedType || 'NOTE', defaultName))
    setAltTouched(false)
    setTags('')
    setMakeDefault(false)
    setProgress(null)
    setError('')
  }, [open, fixedType, defaultName, defaultCategory])

  useEffect(() => {
    if (!altTouched) setAltText(defaultAltText(type, name))
  }, [type, name, altTouched])

  useEffect(() => {
    if (!file) {
      setPreview('')
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const uploading = progress != null

  const onFile = (e) => {
    const next = e.target.files?.[0] || null
    e.target.value = ''
    if (!next) return
    const problem = validateImageFile(next)
    setError(problem)
    setFile(problem ? null : next)
  }

  const submit = async () => {
    const problem = validateImageFile(file)
    if (problem) return setError(problem)
    if (!name.trim()) return setError('Please enter a name.')
    setError('')
    setProgress(0)
    try {
      const asset = await uploadMedia(file, {
        type,
        name: name.trim(),
        category,
        altText: altText.trim(),
        tags,
        makeDefault: type === 'NOTE' && makeDefault,
        onProgress: setProgress,
      })
      setProgress(null)
      onUploaded(asset)
    } catch (err) {
      setProgress(null)
      setError(err instanceof ApiClientError ? err.message : 'Upload failed. Please try again.')
    }
  }

  return (
    <AdminDialog
      open={open}
      title={fixedType ? `Upload ${MEDIA_TYPE_LABELS[fixedType].toLowerCase()}` : 'Upload image'}
      onClose={uploading ? undefined : onClose}
      footer={
        <>
          <button type="button" className="admin-btn admin-btn-quiet" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-primary disabled:opacity-50"
            disabled={!file || uploading}
            onClick={submit}
          >
            {uploading ? `Uploading ${progress}%` : 'Upload'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden border border-stone bg-cream">
            {preview ? (
              <img src={preview} alt="Selected file preview" className="h-full w-full object-cover" />
            ) : (
              <span className="px-2 text-center text-[11px] admin-muted">No file</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <label className="admin-btn admin-btn-quiet inline-block cursor-pointer">
              {file ? 'Choose another' : 'Choose image'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onFile}
                disabled={uploading}
              />
            </label>
            <p className="mt-2 text-[12px] admin-muted">JPEG / PNG / WebP · max 5 MB</p>
            {file && <p className="mt-1 truncate text-[12px] text-charcoal">{file.name}</p>}
          </div>
        </div>

        {progress != null && (
          <div className="h-1.5 w-full rounded-sm bg-stone/60" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-sm bg-scent-red transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        {!fixedType && (
          <label className="block">
            <span className="admin-label">Type</span>
            <select className="admin-input" value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(MEDIA_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="admin-label">Name</span>
            <input
              className="admin-input"
              value={name}
              maxLength={120}
              placeholder="Jasmine Sambac"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="admin-label">Category</span>
            <select className="admin-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {MEDIA_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {titleCase(c)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="admin-label">Alt text</span>
          <input
            className="admin-input"
            value={altText}
            maxLength={200}
            onChange={(e) => {
              setAltTouched(true)
              setAltText(e.target.value)
            }}
          />
        </label>

        <label className="block">
          <span className="admin-label">Tags</span>
          <input
            className="admin-input"
            value={tags}
            placeholder="jasmine, floral, white floral"
            onChange={(e) => setTags(e.target.value)}
          />
        </label>

        {type === 'NOTE' && (
          <label className="flex items-center gap-2 text-[14px] text-charcoal">
            <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} />
            Make this the global default image for “{name.trim() || 'this note'}”
          </label>
        )}

        {error && (
          <p className="border border-burgundy/30 bg-burgundy/5 px-3 py-2 text-sm text-burgundy">{error}</p>
        )}
      </div>
    </AdminDialog>
  )
}
