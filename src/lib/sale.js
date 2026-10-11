/**
 * Storefront sale helpers. Sale prices come from the server (`product.sale`); checkout re-prices them.
 */

/** The live sale on a product, or null when it is sold at full price. */
export function activeSale(product) {
  const sale = product?.sale
  if (!sale || sale.price == null || product.price == null) return null
  return Number(sale.price) < Number(product.price) ? sale : null
}

/** Price a shopper pays now: the sale price when one is live. */
export function effectivePrice(product) {
  return activeSale(product)?.price ?? product?.price
}

/**
 * Headline for the storefront sale banner, or null with no live sale.
 * `upTo` is set when products carry different percentages; `everything` when every product is covered.
 */
export function saleSummary(products) {
  const sales = (products || []).map(activeSale).filter(Boolean)
  if (!sales.length) return null
  const top = sales.reduce((best, s) => (s.percentOff > best.percentOff ? s : best))
  const festivalNames = new Set(sales.filter((s) => s.kind !== 'PRODUCT').map((s) => s.name))
  let name = 'Festive Sale'
  if (festivalNames.size === 1) name = [...festivalNames][0]
  else if (!festivalNames.size) name = 'Special prices'
  return {
    name,
    percentOff: top.percentOff,
    upTo: sales.some((s) => s.percentOff !== top.percentOff),
    everything: sales.length === products.length,
    endsAt: top.endsAt || null,
  }
}
