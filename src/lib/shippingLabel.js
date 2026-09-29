/**
 * 4 × 6 inch parcel label: order → label fields, text fitting, PDF export and printing.
 * Label artwork uses a 400 × 600 viewBox, i.e. 1 unit = 0.01 inch.
 */
import { formatPrice } from '../data/products'
import { isCodOrder } from './orderStatus'

export const LABEL_WIDTH = 400
export const LABEL_HEIGHT = 600
export const LABEL_FONT = 'Arial, Helvetica, sans-serif'
/** Raster pixels per label unit for the PDF: 3 → 300 dpi. */
export const LABEL_PX_PER_UNIT = 3

const NO_LABEL_STATUSES = [
  'PENDING_PAYMENT',
  'PAYMENT_PROCESSING',
  'PAYMENT_FAILED',
  'PAYMENT_EXPIRED',
  'CANCELLED',
  'REFUND_PENDING',
  'REFUNDED',
]

export function canPrintLabel(order) {
  return Boolean(order) && !NO_LABEL_STATUSES.includes(order.status)
}

let measureCtx
export function measure(text, size, weight = 400) {
  measureCtx ??= document.createElement('canvas').getContext('2d')
  measureCtx.font = `${weight} ${size}px ${LABEL_FONT}`
  return measureCtx.measureText(text).width
}

/** Largest font size (down to `min`) at which `text` fits in `maxWidth`. */
export function fitSize(text, maxWidth, { size, min = size * 0.7, weight = 400 }) {
  let s = size
  while (s > min && measure(text, s, weight) > maxWidth) s -= 0.5
  return s
}

export function ellipsize(text, maxWidth, { size, weight = 400 }) {
  let t = String(text || '')
  if (measure(t, size, weight) <= maxWidth) return t
  while (t.length > 1 && measure(`${t}…`, size, weight) > maxWidth) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}

export function wrapText(text, maxWidth, { size, weight = 400, maxLines = Infinity }) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (!line || measure(next, size, weight) <= maxWidth) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    kept[maxLines - 1] = ellipsize(lines.slice(maxLines - 1).join(' '), maxWidth, { size, weight })
    return kept
  }
  return lines.map((l) => ellipsize(l, maxWidth, { size, weight }))
}

const LABEL_DATE = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

function cityLine({ city, state, postalCode }) {
  const place = [city, state].filter(Boolean).join(', ')
  return [place, postalCode].filter(Boolean).join(' – ')
}

/** Plain label fields for an order; no layout decisions. */
export function labelFromOrder(order) {
  const addr = order.shippingAddress || {}
  const customer = order.customerSnapshot || order.customer || {}
  const f = order.fulfillment || {}
  const payStatus = String(order.payment?.status || order.paymentStatus || '').toUpperCase()
  const paid = payStatus === 'PAID' || payStatus === 'CAPTURED'
  const cod = isCodOrder(order)
  const totalPaise = order.pricing?.totalPaise
  const total = totalPaise != null ? totalPaise / 100 : order.total || 0
  const created = new Date(order.createdAt)

  return {
    orderNumber: order.orderNumber || '',
    orderDate: Number.isNaN(created.getTime()) ? '' : LABEL_DATE.format(created),
    payment: cod && !paid ? 'COD' : cod ? 'PAID' : 'PREPAID',
    collect: cod && !paid ? formatPrice(total) : null,
    to: {
      name: addr.fullName || customer.name || '',
      street: [addr.addressLine1 || addr.line1, addr.addressLine2 || addr.line2].filter(Boolean).join(', '),
      landmark: addr.landmark || '',
      cityLine: cityLine(addr),
      country: addr.country || 'India',
      phone: addr.phone || customer.phone || '',
    },
    items: (order.items || []).map((i) => ({
      name: i.name || 'Item',
      variant: [i.concentration, i.size].filter(Boolean).join(' – '),
      quantity: i.quantity || 1,
      sku: i.sku || '',
    })),
    code: f.trackingNumber
      ? { title: 'AWB / TRACKING NO.', value: String(f.trackingNumber).trim(), courier: f.carrier || '' }
      : { title: 'ORDER NO.', value: order.orderNumber || '', courier: f.carrier || '' },
  }
}

export function shipperCityLine(shipper) {
  return cityLine(shipper)
}

export function labelFileName(order) {
  const safe = String(order?.orderNumber || 'order').replace(/[^A-Za-z0-9_-]/g, '')
  return `${safe}-shipping-label.pdf`
}

function serialize(svg) {
  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.removeAttribute('class')
  clone.removeAttribute('style')
  return new XMLSerializer().serializeToString(clone)
}

export async function renderLabelCanvas(svg) {
  const w = LABEL_WIDTH * LABEL_PX_PER_UNIT
  const h = LABEL_HEIGHT * LABEL_PX_PER_UNIT
  const clone = svg.cloneNode(true)
  clone.setAttribute('width', w)
  clone.setAttribute('height', h)
  const url = URL.createObjectURL(new Blob([serialize(clone)], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function downloadLabelPdf(svg, fileName) {
  const [{ jsPDF }, canvas] = await Promise.all([import('jspdf'), renderLabelCanvas(svg)])
  const pdf = new jsPDF({ unit: 'in', format: [4, 6], orientation: 'portrait', compress: true })
  pdf.addImage(canvas, 'PNG', 0, 0, 4, 6, undefined, 'FAST')
  pdf.save(fileName)
}

export function printLabel(svg) {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  doc.open()
  doc.write(
    `<!doctype html><html><head><style>@page{size:4in 6in;margin:0}html,body{margin:0}svg{display:block;width:4in;height:6in}</style></head><body>${serialize(svg)}</body></html>`,
  )
  doc.close()
  const win = frame.contentWindow
  win.addEventListener('afterprint', () => setTimeout(() => frame.remove(), 0), { once: true })
  setTimeout(() => frame.remove(), 60_000)
  setTimeout(() => {
    win.focus()
    win.print()
  }, 50)
}
