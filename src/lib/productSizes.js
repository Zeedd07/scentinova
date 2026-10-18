/**
 * Bottle sizes on a storefront product. Each has its own price and, when a
 * percent-off is live, its own sale price. Older products are one size.
 */

function sizeMedia(size) {
  const gallery = Array.isArray(size?.gallery) ? size.gallery.filter(Boolean) : []
  const videos = Array.isArray(size?.videos) ? size.videos.filter((v) => v?.url) : []
  const media = {}
  if (gallery.length) {
    media.gallery = gallery
    media.galleryScales = gallery.map((_, i) => {
      const n = Number(size.galleryScales?.[i])
      return Number.isFinite(n) ? n : 1
    })
  }
  if (videos.length) media.videos = videos
  return media
}

export function productSizes(product) {
  const stored = Array.isArray(product?.sizes)
    ? product.sizes.filter((s) => s && s.ml != null && s.price != null)
    : []
  if (stored.length) {
    return stored.map((s) => ({
      ml: Number(s.ml),
      label: s.label || `${s.ml}ml`,
      price: Number(s.price),
      pricePaise:
        s.pricePaise != null ? Number(s.pricePaise) : Math.round(Number(s.price) * 100),
      sale: s.sale && Number(s.sale.price) < Number(s.price) ? s.sale : null,
      ...sizeMedia(s),
    }))
  }
  const ml = Number(String(product?.size || '').replace(/\D/g, '')) || 50
  const price = Number(product?.price)
  return [
    {
      ml,
      label: `${ml}ml`,
      price,
      pricePaise:
        product?.pricePaise != null ? Number(product.pricePaise) : Math.round(price * 100),
      sale:
        product?.sale && Number(product.sale.price) < price ? product.sale : null,
    },
  ]
}

/**
 * Gallery for the size the shopper picked. Photos and videos fall back on their own:
 * a size with photos but no video shows those photos and the main bottle videos.
 */
export function mediaForSize(product, size) {
  const sizeImages = size?.gallery?.filter(Boolean) || []
  const sizeVideos = size?.videos?.filter((v) => v?.url) || []
  const mainImages = (product?.gallery?.length ? product.gallery : [product?.image]).filter(Boolean)
  return {
    ...product,
    image: sizeImages[0] || mainImages[0] || product?.image || '',
    gallery: sizeImages.length ? sizeImages : mainImages,
    galleryScales: sizeImages.length ? size.galleryScales || [] : product?.galleryScales,
    videos: sizeVideos.length ? sizeVideos : product?.videos || [],
  }
}
