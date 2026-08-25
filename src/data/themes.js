/**
 * SCENTINOVA theme palettes.
 * Semantic tokens: ink=bg, cream=primary text, bronze=muted, gold=accent.
 */
export const THEMES = [
  {
    id: 'aurum',
    label: 'Aurum',
    blurb: 'Champagne on espresso',
    swatch: ['#0A0806', '#C9A962', '#F3EDE3'],
  },
  {
    id: 'noir',
    label: 'Noir',
    blurb: 'Platinum charcoal',
    swatch: ['#0E0E10', '#C5C0B8', '#F2F0EC'],
  },
  {
    id: 'velvet',
    label: 'Velvet',
    blurb: 'Rose-gold night',
    swatch: ['#0C0709', '#C4A484', '#F4E8E2'],
  },
  {
    id: 'atelier',
    label: 'Atelier',
    blurb: 'Porcelain light',
    swatch: ['#F6F1E8', '#9A7B3C', '#1A1612'],
  },
]

export const DEFAULT_THEME = 'aurum'
export const THEME_STORAGE_KEY = 'aurum-theme-v1'
