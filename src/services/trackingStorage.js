/**
 * Per-order tracking secrets remembered on this device so the customer can
 * track by order number alone. Storage may be unavailable (private mode).
 */
const keyFor = (orderNumber) => `scentinova-track-${String(orderNumber).trim().toUpperCase()}`

export function saveTrackingToken(orderNumber, token) {
  if (!orderNumber || !token) return
  try {
    localStorage.setItem(keyFor(orderNumber), token)
  } catch {
    /* storage unavailable */
  }
}

export function getSavedTrackingToken(orderNumber) {
  if (!orderNumber) return ''
  try {
    return (
      localStorage.getItem(keyFor(orderNumber)) ||
      // Orders placed before tracking moved to localStorage
      sessionStorage.getItem(`scentinova-track-${orderNumber}`) ||
      ''
    )
  } catch {
    return ''
  }
}
