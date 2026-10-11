/**
 * A product's own discount: percent strings / whole-rupee strings in the admin form,
 * `{ type, percentOff, salePricePaise }` on the API. The server re-validates and does the pricing.
 */

/** Mirrors the backend PRODUCT_DISCOUNT_PERCENT_MIN / MAX. */
export const DISCOUNT_PERCENT_MIN = 1
export const DISCOUNT_PERCENT_MAX = 90
const WHOLE_NUMBER = /^\d+$/

export const EMPTY_DISCOUNT_FORM = { type: 'NONE', percent: '', price: '' }

export function discountToForm(discount) {
  const d = discount || {}
  return {
    type: d.type === 'PERCENT' || d.type === 'PRICE' ? d.type : 'NONE',
    percent: d.percentOff ? String(d.percentOff) : '',
    price: d.salePricePaise ? String(Math.round(d.salePricePaise / 100)) : '',
  }
}

/** Sale price in rupees for a percent off, rounded to a whole rupee the same way the server does. */
function percentPrice(priceRupees, percentOff) {
  return Math.round((Math.round(priceRupees * 100) * (100 - percentOff)) / 10000)
}

/**
 * What a customer pays with this discount, or null when the form is incomplete.
 * @returns {{ price: number, percentOff: number, saving: number } | null}
 */
export function discountPreview(form, priceRupees) {
  const price = Number(priceRupees)
  if (!Number.isFinite(price) || price <= 0) return null
  if (form.type === 'PERCENT') {
    const pct = Number(form.percent)
    if (!WHOLE_NUMBER.test(String(form.percent).trim())) return null
    if (pct < DISCOUNT_PERCENT_MIN || pct > DISCOUNT_PERCENT_MAX) return null
    const sale = percentPrice(price, pct)
    return sale < price ? { price: sale, percentOff: pct, saving: price - sale } : null
  }
  if (form.type === 'PRICE') {
    const text = String(form.price).trim()
    if (!WHOLE_NUMBER.test(text)) return null
    const sale = Number(text)
    if (sale < 1 || sale >= price) return null
    const pct = Math.max(1, Math.round(((price - sale) / price) * 100))
    return { price: sale, percentOff: pct, saving: price - sale }
  }
  return null
}

/** @returns {{ discount: object|null, error: string }} */
export function parseDiscountForm(form, priceRupees) {
  if (form.type === 'NONE') {
    return { discount: { type: 'NONE', percentOff: null, salePricePaise: null }, error: '' }
  }
  const price = Number(priceRupees)

  if (form.type === 'PERCENT') {
    const text = String(form.percent).trim()
    const pct = Number(text)
    if (!WHOLE_NUMBER.test(text) || pct < DISCOUNT_PERCENT_MIN || pct > DISCOUNT_PERCENT_MAX) {
      return {
        discount: null,
        error: `Percent off must be a whole number from ${DISCOUNT_PERCENT_MIN} to ${DISCOUNT_PERCENT_MAX}.`,
      }
    }
    if (percentPrice(price, pct) >= price) {
      return { discount: null, error: 'This percentage is too small to lower the price.' }
    }
    return { discount: { type: 'PERCENT', percentOff: pct, salePricePaise: null }, error: '' }
  }

  const text = String(form.price).trim()
  if (!WHOLE_NUMBER.test(text) || Number(text) < 1) {
    return { discount: null, error: 'Enter the discounted price in whole rupees (at least ₹1).' }
  }
  if (Number(text) >= price) {
    return { discount: null, error: 'The discounted price must be lower than the regular price.' }
  }
  return {
    discount: { type: 'PRICE', percentOff: null, salePricePaise: Number(text) * 100 },
    error: '',
  }
}
