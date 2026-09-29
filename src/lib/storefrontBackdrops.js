/**
 * Backdrops that the transparent product photos sit on in the store. The storefront
 * renders them as CSS; the admin media page paints the same layers into a PNG so
 * AI-generated product shots can match the site exactly.
 */

const pct = (n) => `${Number((n * 100).toFixed(2))}%`
const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`

const SIGNATURE_STAGE = {
  base: [
    ['#fbf7ef', 0],
    ['#f7f0e4', 0.42],
    ['#f4ebdc', 0.78],
    ['#faf6ee', 1],
  ],
  glows: [
    { rx: 0.85, ry: 0.55, cx: 0.5, cy: -0.08, rgb: [212, 175, 90], alpha: 0.12, fade: 0.58 },
    { rx: 0.55, ry: 0.45, cx: 0.12, cy: 0.7, rgb: [201, 162, 74], alpha: 0.06, fade: 0.55 },
    { rx: 0.5, ry: 0.4, cx: 0.88, cy: 0.55, rgb: [201, 162, 74], alpha: 0.08, fade: 0.5 },
  ],
}

function baseCss({ base }) {
  if (base.length === 1) return base[0][0]
  return `linear-gradient(180deg, ${base.map(([c, s]) => `${c} ${pct(s)}`).join(', ')})`
}

function glowCss({ glows }) {
  return glows
    .map(
      (g) =>
        `radial-gradient(ellipse ${pct(g.rx)} ${pct(g.ry)} at ${pct(g.cx)} ${pct(g.cy)}, ${rgba(g.rgb, g.alpha)}, transparent ${pct(g.fade)})`,
    )
    .join(', ')
}

/** The one product backdrop: base gradient plus the golden light overlay. */
export const signatureStageCss = {
  base: baseCss(SIGNATURE_STAGE),
  glows: glowCss(SIGNATURE_STAGE),
}

/** Both layers in a single `background` value, for panels that don't split them. */
export const signatureStageBackground = `${signatureStageCss.glows}, ${signatureStageCss.base}`

function paint(ctx, w, h, { base, glows }) {
  if (base.length === 1) {
    ctx.fillStyle = base[0][0]
  } else {
    const linear = ctx.createLinearGradient(0, 0, 0, h)
    for (const [color, stop] of base) linear.addColorStop(stop, color)
    ctx.fillStyle = linear
  }
  ctx.fillRect(0, 0, w, h)

  for (const g of glows) {
    const rx = g.rx * w
    const sy = (g.ry * h) / rx
    const radial = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
    radial.addColorStop(0, rgba(g.rgb, g.alpha))
    radial.addColorStop(g.fade, rgba(g.rgb, 0))
    ctx.save()
    ctx.translate(g.cx * w, g.cy * h)
    ctx.scale(1, sy)
    ctx.fillStyle = radial
    ctx.fillRect(-g.cx * w, (-g.cy * h) / sy, w, h / sy)
    ctx.restore()
  }
}

export const BACKDROPS = [
  {
    id: 'signature-stage',
    name: 'Signature stage',
    description: 'Warm ivory gradient with golden light, behind the bottles on the home page and product pages.',
    layers: SIGNATURE_STAGE,
    previewCss: signatureStageBackground,
  },
]

export const BACKDROP_SIZES = [
  { id: 'portrait', label: 'Portrait 3:4', width: 2400, height: 3200 },
  { id: 'square', label: 'Square 1:1', width: 2400, height: 2400 },
]

/** Paints the backdrop at full size and saves it as a PNG. */
export async function downloadBackdrop(backdrop, size) {
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available')
  paint(ctx, size.width, size.height, backdrop.layers)

  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode PNG'))), 'image/png'),
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `scentinova-${backdrop.id}-${size.width}x${size.height}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
