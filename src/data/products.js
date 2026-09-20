/**
 * SCENTINOVA — four house signatures.
 * Imagery: transparent PNGs under /products/
 */

export const PRODUCTS = [
  {
    id: 'lunar-leather',
    slug: 'lunar-leather',
    name: 'Lunar Leather',
    tagline: 'Dark. Warm. Magnetic.',
    price: null,
    size: '50ML',
    concentration: 'Parfum',
    category: 'Oriental',
    featured: true,
    badge: 'House Signature',
    image: '/products/lunar-leather.png',
    gallery: [
      '/products/lunar-leather.png',
      '/products/lunar-leather-pack.png',
    ],
    notes: {
      top: ['Pink Pepper', 'Raspberry'],
      heart: ['Amber', 'Leather', 'Saffron'],
      base: ['Agarwood', 'Bakhoor'],
    },
    descriptors: ['Pink Pepper', 'Leather', 'Agarwood', 'Bakhoor'],
    description:
      'Pink pepper and raspberry open into amber, leather, and saffron — grounded in agarwood and bakhoor.',
    story: 'The night, bottled.',
    accent: 'lunar',
  },
  {
    id: 'oud-on-the-petals',
    slug: 'oud-on-the-petals',
    name: 'Oud on the Petals',
    tagline: 'Floral elegance wrapped in precious oud.',
    price: null,
    size: '50ML',
    concentration: 'Pure Parfum',
    category: 'Floral',
    featured: true,
    badge: null,
    image: '/products/oud-on-the-petals.png',
    gallery: [
      '/products/oud-on-the-petals.png',
      '/products/oud-on-the-petals-pack.png',
    ],
    notes: {
      top: ['White Florals', 'Orange Blossom'],
      heart: ['Jasmine Sambac', 'Amber'],
      base: ['Indian Agarwood', 'Incense'],
    },
    descriptors: ['White Florals', 'Jasmine Sambac', 'Indian Agarwood', 'Incense'],
    description:
      'White florals and orange blossom into jasmine sambac and amber — finished with Indian agarwood and incense.',
    story: 'A bloom held in resin.',
    accent: 'petals',
  },
  {
    id: 'masai-mara',
    slug: 'masai-mara',
    name: 'Masai-Mara',
    tagline: 'Wild. Smoldering. Unrestrained.',
    price: null,
    size: '50ML',
    concentration: 'Pure Parfum',
    category: 'Woody',
    featured: true,
    badge: null,
    image: '/products/masai-mara.png',
    gallery: [
      '/products/masai-mara.png',
      '/products/masai-mara-pack.png',
    ],
    notes: {
      top: ['Saffron', 'Leather', 'Wild Berries'],
      heart: ['Nutmeg', 'Taif Rose', 'Frankincense'],
      base: ['Sandalwood', 'Amber', 'Leather', 'Olibanum'],
    },
    descriptors: ['Saffron', 'Taif Rose', 'Sandalwood', 'Leather'],
    description:
      'Saffron, leather, and wild berries open into nutmeg, Taif rose, and frankincense — settling into sandalwood, amber, leather, and olibanum.',
    story: 'Open land. Ember air.',
    accent: 'mara',
  },
  {
    id: 'seaweed',
    slug: 'seaweed',
    name: 'Seaweed',
    tagline: 'Marine clarity with a darker skin of musk.',
    price: null,
    size: '50ML',
    concentration: 'Pure Parfum',
    category: 'Fresh',
    featured: true,
    badge: null,
    image: '/products/seaweed.png',
    gallery: [
      '/products/seaweed.png',
      '/products/seaweed-pack.png',
    ],
    notes: {
      top: ['Calabrian Bergamot'],
      heart: ['Calone', 'Hedione', 'Sea Water'],
      base: ['Musk', 'Cedarwood'],
    },
    descriptors: ['Calabrian Bergamot', 'Sea Water', 'Musk', 'Cedarwood'],
    description:
      'Calabrian bergamot into calone, hedione, and sea water — drying down to musk and cedarwood.',
    story: 'Tide, then silence.',
    accent: 'marine',
  },
]

export const CATEGORIES = ['All', 'Oriental', 'Floral', 'Woody', 'Fresh']

export function getProductBySlug(slug) {
  return PRODUCTS.find((p) => p.slug === slug) ?? null
}

export function getFeaturedProducts() {
  return PRODUCTS.filter((p) => p.featured)
}

/** Format price — null shows elegant fallback (no invented prices). */
export function formatPrice(n) {
  if (n == null || n === '' || Number.isNaN(Number(n))) {
    return 'Price on request'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(n))
}
