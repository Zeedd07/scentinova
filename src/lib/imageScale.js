/**
 * Per-image storefront display size set in admin (product.galleryScales,
 * aligned with product.gallery; index 0 is the cover). 1 = 100%.
 */
export const IMAGE_SCALE_MIN = 0.5
export const IMAGE_SCALE_MAX = 2
export const IMAGE_SCALE_STEP = 0.05

export function clampImageScale(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.min(IMAGE_SCALE_MAX, Math.max(IMAGE_SCALE_MIN, n))
}

export function productImageScale(product, index = 0) {
  return clampImageScale(product?.galleryScales?.[index] ?? 1)
}

/** Inline style for an <img>; composes with Tailwind's translate/scale utilities. */
export function imageScaleStyle(scale) {
  return scale === 1 ? undefined : { transform: `scale(${scale})` }
}
