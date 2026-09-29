export const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAYMENT_PROCESSING: 'Payment processing',
  PAYMENT_FAILED: 'Payment failed',
  PAYMENT_EXPIRED: 'Payment expired',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUND_PENDING: 'Refund pending',
  REFUNDED: 'Refunded',
}

export function orderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || String(status || '-').replaceAll('_', ' ')
}

const TONES = {
  neutral: 'border-[#d8cfc2] bg-[#f4efe7] text-[#4a4136]',
  info: 'border-[#c9d6e8] bg-[#eef3fa] text-[#23446e]',
  progress: 'border-[#e5d3a8] bg-[#fbf4e2] text-[#6b4d0f]',
  success: 'border-[#bcd9c3] bg-[#edf7ef] text-[#1f5a2e]',
  danger: 'border-[#e6c2c5] bg-[#fbeeef] text-[#6e1118]',
}

const TONE_OF_STATUS = {
  CONFIRMED: 'info',
  PROCESSING: 'progress',
  PACKED: 'progress',
  SHIPPED: 'progress',
  OUT_FOR_DELIVERY: 'progress',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  PAYMENT_FAILED: 'danger',
  PAYMENT_EXPIRED: 'danger',
  REFUND_PENDING: 'danger',
  REFUNDED: 'neutral',
}

export function orderStatusBadgeClass(status) {
  return `inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium whitespace-nowrap ${
    TONES[TONE_OF_STATUS[status] || 'neutral']
  }`
}

const SHIPPED_STAGE = ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']

/** Moving to `target` passes through "Shipped" and no courier/tracking number is on file yet. */
export function needsTracking(order, target) {
  if (!SHIPPED_STAGE.includes(target) || SHIPPED_STAGE.includes(order?.status)) return false
  return !(order?.fulfillment?.carrier && order?.fulfillment?.trackingNumber)
}

export function isCodOrder(order) {
  return order?.paymentMethod === 'COD' || order?.payment?.provider === 'cod'
}

/** Plain-language payment state for admins. */
export function paymentStatusText(order) {
  const cod = isCodOrder(order)
  const s = String(order?.payment?.status || order?.paymentStatus || '').toUpperCase()
  if (s === 'PAID' || s === 'CAPTURED') return cod ? 'Cash received' : 'Paid online'
  if (s === 'REFUNDED') return 'Refunded'
  if (s === 'PARTIALLY_REFUNDED') return 'Partly refunded'
  if (s === 'FAILED') return 'Payment failed'
  return cod ? 'To collect on delivery' : 'Not paid yet'
}

const DATE_TIME = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : DATE_TIME.format(d)
}
