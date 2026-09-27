/**
 * Per-product checkout fees: rupee strings in the admin form, integer paise on the API.
 * The server validates again and is the only authority for real checkout totals.
 */

/** Mirrors the backend MAX_PRODUCT_FEE_PAISE (₹10,000). */
export const MAX_FEE_RUPEES = 10000
const RUPEE_PATTERN = /^\d+(\.\d{1,2})?$/

export const EMPTY_FEES_FORM = {
  convenience: { enabled: false, amount: '', applyToPrepaid: true, applyToCod: true },
  cod: { enabled: false, amount: '' },
  shipping: { enabled: false, amount: '' },
  codAllowed: true,
}

function paiseToInput(paise) {
  if (!paise) return ''
  const rupees = paise / 100
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2)
}

export function feesToForm(fees) {
  const f = fees || {}
  return {
    convenience: {
      enabled: f.convenience?.enabled === true,
      amount: paiseToInput(f.convenience?.amountPaise),
      applyToPrepaid: f.convenience?.applyToPrepaid !== false,
      applyToCod: f.convenience?.applyToCod !== false,
    },
    cod: { enabled: f.cod?.enabled === true, amount: paiseToInput(f.cod?.amountPaise) },
    shipping: {
      enabled: f.shipping?.enabled === true,
      amount: paiseToInput(f.shipping?.amountPaise),
    },
    codAllowed: f.codAllowed !== false,
  }
}

function parseAmount(section, label, errors, key) {
  const text = String(section.amount ?? '').trim()
  if (!section.enabled) {
    return RUPEE_PATTERN.test(text) && Number(text) <= MAX_FEE_RUPEES
      ? Math.round(Number(text) * 100)
      : 0
  }
  if (!text) {
    errors[key] = `Enter the ${label} amount, or turn it off.`
    return 0
  }
  if (!RUPEE_PATTERN.test(text) || Number(text) > MAX_FEE_RUPEES) {
    errors[key] = `${label} must be between ₹0 and ₹${MAX_FEE_RUPEES.toLocaleString('en-IN')} with at most 2 decimals.`
    return 0
  }
  return Math.round(Number(text) * 100)
}

/** @returns {{ fees: object|null, errors: Record<string, string> }} */
export function parseFeesForm(form) {
  const errors = {}
  const fees = {
    convenience: {
      enabled: form.convenience.enabled,
      amountPaise: parseAmount(form.convenience, 'Convenience fee', errors, 'convenience'),
      applyToPrepaid: form.convenience.applyToPrepaid,
      applyToCod: form.convenience.applyToCod,
    },
    cod: {
      enabled: form.cod.enabled,
      amountPaise: parseAmount(
        { ...form.cod, enabled: form.cod.enabled && form.codAllowed },
        'COD fee',
        errors,
        'cod',
      ),
    },
    shipping: {
      enabled: form.shipping.enabled,
      amountPaise: parseAmount(form.shipping, 'Shipping fee', errors, 'shipping'),
    },
    codAllowed: form.codAllowed,
  }
  return { fees: Object.keys(errors).length ? null : fees, errors }
}
