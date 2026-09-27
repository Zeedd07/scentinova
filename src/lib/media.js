export const MEDIA_CATEGORIES = [
  'FLORAL',
  'CITRUS',
  'WOODY',
  'AMBER',
  'MUSK',
  'SPICY',
  'FRESH',
  'GOURMAND',
  'LEATHER',
  'FRUITY',
  'GREEN',
  'OTHER',
]

export const MEDIA_TYPE_LABELS = {
  NOTE: 'Note image',
  PRODUCT_BACKGROUND: 'Product background',
  PRODUCT_IMAGE: 'Product image',
  OTHER: 'Other',
}

export const NOTE_TIERS = [
  { tier: 'TOP', key: 'top', label: 'Top' },
  { tier: 'HEART', key: 'heart', label: 'Heart' },
  { tier: 'BASE', key: 'base', label: 'Base' },
]

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/** Must match the backend slugify() so overrides line up with notes. */
export function normalizeNoteKey(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
}

export function defaultAltText(type, name) {
  const clean = String(name || '').trim()
  if (!clean) return ''
  if (type === 'NOTE') return `${clean} fragrance note`
  if (type === 'PRODUCT_BACKGROUND') return `${clean} product background`
  return clean
}

export function titleCase(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/(^|[\s_])\w/g, (m) => m.toUpperCase())
    .replace(/_/g, ' ')
}

/** Returns an error message, or '' when the file is acceptable. */
export function validateImageFile(file) {
  if (!file) return 'Please choose an image file.'
  if (!ALLOWED.includes(file.type)) return 'Only JPEG, PNG, and WebP images are allowed.'
  if (file.size > MAX_UPLOAD_BYTES) return 'Image must be 5 MB or smaller.'
  return ''
}
