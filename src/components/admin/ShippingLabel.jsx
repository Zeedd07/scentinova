/**
 * Printable 4 × 6 inch parcel label (SVG, 1 unit = 0.01 inch).
 * The same element is shown as the preview and exported to PDF / print.
 */
import { useMemo } from 'react'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { SHIPPER, shipperAddressReady } from '../../config/shipper'
import {
  LABEL_FONT,
  LABEL_HEIGHT,
  LABEL_PX_PER_UNIT,
  LABEL_WIDTH,
  ellipsize,
  fitSize,
  labelFromOrder,
  measure,
  shipperCityLine,
  wrapText,
} from '../../lib/shippingLabel'

const SERIF = 'Georgia, "Times New Roman", serif'
const px = (units) => Math.round(units * LABEL_PX_PER_UNIT) / LABEL_PX_PER_UNIT

function Tag({ x, y, children }) {
  const size = 10
  const spacing = 0.6
  const width = measure(children, size, 700) + children.length * spacing + 14
  return (
    <g>
      <rect x={x} y={y} width={width} height={17} />
      <text x={x + 7} y={y + 12.3} fill="#fff" fontSize={size} fontWeight={700} letterSpacing={spacing}>
        {children}
      </text>
    </g>
  )
}

function Lines({ x, y, lines, gap, size, weight, anchor }) {
  return lines.map((line, i) => (
    <text key={i} x={x} y={y + i * gap} fontSize={size} fontWeight={weight} textAnchor={anchor}>
      {line}
    </text>
  ))
}

function Field({ x, y, label, value, valueWidth, colon = 56, bold = true }) {
  const size = 10.5
  const weight = bold ? 700 : 400
  const fitted = fitSize(value, valueWidth, { size, min: 8.5, weight })
  return (
    <g>
      <text x={x} y={y} fontSize={10}>
        {label}
      </text>
      <text x={x + colon} y={y} fontSize={10}>
        :
      </text>
      <text x={x + colon + 8} y={y} fontSize={fitted} fontWeight={weight}>
        {ellipsize(value, valueWidth, { size: fitted, weight })}
      </text>
    </g>
  )
}

/* ── Handling icons, drawn in a 36 × 36 box ── */
function FragileIcon() {
  return (
    <g>
      <path d="M11 7h14v7a7 7 0 0 1-14 0z" />
      <path d="M18 21v8M13 29.5h10" fill="none" stroke="#000" strokeWidth={2} strokeLinecap="round" />
    </g>
  )
}

function ThisSideUpIcon() {
  return (
    <g>
      <path d="M13 29V13M23 29V13M7 31h22" fill="none" stroke="#000" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M8 15l5-7 5 7zM18 15l5-7 5 7z" />
    </g>
  )
}

function KeepDryIcon() {
  return (
    <g>
      <path d="M6 20a12 12 0 0 1 24 0z" />
      <path d="M18 20v8a2.5 2.5 0 0 1-5 0" fill="none" stroke="#000" strokeWidth={2} strokeLinecap="round" />
      <path d="M9 5l-1.5 3M27 5l-1.5 3M31 10l-1.5 3" fill="none" stroke="#000" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  )
}

function BottleIcon() {
  return (
    <g>
      <rect x={11} y={0} width={14} height={9} rx={1.5} />
      <rect x={14} y={9} width={8} height={5} />
      <rect x={2} y={14} width={32} height={40} rx={5} fill="none" stroke="#000" strokeWidth={3} />
      <rect x={9} y={23} width={18} height={22} rx={1.5} fill="none" stroke="#000" strokeWidth={1.5} />
    </g>
  )
}

const HANDLING = [
  ['FRAGILE', FragileIcon],
  ['THIS SIDE UP', ThisSideUpIcon],
  ['KEEP DRY', KeepDryIcon],
]

function QrCode({ value, x, y, box }) {
  const qr = useMemo(() => {
    try {
      const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' })
      let d = ''
      for (let r = 0; r < modules.size; r++) {
        for (let c = 0; c < modules.size; c++) {
          if (modules.get(r, c)) d += `M${c} ${r}h1v1h-1z`
        }
      }
      return { size: modules.size, d }
    } catch {
      return null
    }
  }, [value])
  if (!qr) return null
  const module = Math.floor((box * LABEL_PX_PER_UNIT) / qr.size) / LABEL_PX_PER_UNIT
  const side = module * qr.size
  return (
    <svg
      x={px(x + (box - side) / 2)}
      y={px(y + (box - side) / 2)}
      width={side}
      height={side}
      viewBox={`0 0 ${qr.size} ${qr.size}`}
      shapeRendering="crispEdges"
    >
      <path d={qr.d} />
    </svg>
  )
}

function Barcode({ value, x, y, width, height }) {
  const bars = useMemo(() => {
    try {
      const out = {}
      JsBarcode(out, value, { format: 'CODE128', displayValue: false })
      return out.encodings.map((e) => e.data).join('')
    } catch {
      return ''
    }
  }, [value])
  if (!bars) return null
  const quiet = 10
  const module =
    Math.floor((width * LABEL_PX_PER_UNIT) / (bars.length + quiet * 2)) / LABEL_PX_PER_UNIT
  const start = px(x + (width - bars.length * module) / 2)
  let d = ''
  for (let i = 0; i < bars.length; ) {
    if (bars[i] !== '1') {
      i++
      continue
    }
    let run = 0
    while (bars[i + run] === '1') run++
    d += `M${start + i * module} ${y}h${run * module}v${height}h${-run * module}z`
    i += run
  }
  return <path d={d} shapeRendering="crispEdges" />
}

function shipToLines(to) {
  const size = 13.5
  const width = 360
  const phone = to.phone ? `Phone: ${to.phone}` : ''
  const extras = [to.landmark, to.cityLine, to.country, phone].filter(Boolean)
  let street = wrapText(to.street, width, { size, maxLines: 3 })
  const countryAt = extras.indexOf(to.country)
  if (street.length + extras.length > 6 && countryAt !== -1) extras.splice(countryAt, 1)
  if (street.length + extras.length > 6) street = street.slice(0, 6 - extras.length)
  return [...street, ...extras].map((line) => ellipsize(line, width, { size }))
}

function ProductBlock({ items, x, y }) {
  const valueX = x + 58
  const valueWidth = 380 - valueX
  if (items.length === 1) {
    const [item] = items
    const nameLines = wrapText(item.name, valueWidth, { size: 10.5, weight: 700, maxLines: 2 })
    let cursor = y
    const rows = []
    rows.push(
      <text key="pl" x={x} y={cursor} fontSize={10}>
        Product
      </text>,
      <text key="pc" x={x + 50} y={cursor} fontSize={10}>
        :
      </text>,
      <Lines key="pn" x={valueX} y={cursor} lines={nameLines} gap={12} size={10.5} weight={700} />,
    )
    cursor += nameLines.length * 12
    if (item.variant) {
      rows.push(
        <text key="pv" x={valueX} y={cursor - 1} fontSize={9}>
          {ellipsize(item.variant, valueWidth, { size: 9 })}
        </text>,
      )
      cursor += 12
    }
    cursor += 5
    rows.push(
      <Field key="q" x={x} y={cursor} label="Quantity" value={String(item.quantity)} valueWidth={valueWidth} colon={50} bold={false} />,
    )
    if (item.sku) {
      cursor += 17
      rows.push(<Field key="s" x={x} y={cursor} label="SKU" value={item.sku} valueWidth={valueWidth} colon={50} bold={false} />)
    }
    return <g>{rows}</g>
  }

  const pieces = items.reduce((n, i) => n + i.quantity, 0)
  const shown = items.length > 3 ? items.slice(0, 2) : items
  const lines = shown.map((i) =>
    ellipsize(`${i.quantity} × ${i.name}${i.variant ? ` · ${i.variant}` : ''}`, 380 - x, { size: 9.5 }),
  )
  if (items.length > 3) lines.push(`+ ${items.length - 2} more products`)
  return (
    <g>
      <Field x={x} y={y} label="Items" value={`${pieces} pcs`} valueWidth={valueWidth} colon={50} />
      <Lines x={x} y={y + 17} lines={lines} gap={14} size={9.5} />
    </g>
  )
}

export default function ShippingLabel({ order, ref, className }) {
  const label = labelFromOrder(order)
  const storeUrl = SHIPPER.storeUrl || window.location.origin
  const shipperReady = shipperAddressReady()

  const fromLines = shipperReady
    ? [
        ...SHIPPER.address.flatMap((l) => wrapText(l, 262, { size: 10.5 })),
        shipperCityLine(SHIPPER),
        SHIPPER.country,
      ]
        .filter(Boolean)
        .slice(0, 3)
    : [SHIPPER.tagline]
  const nameSize = fitSize(label.to.name, 360, { size: 22, min: 15, weight: 700 })
  const toLines = shipToLines(label.to)
  const codeSize = fitSize(label.code.value, 250, { size: 15, min: 10, weight: 700 })

  return (
    <svg
      ref={ref}
      className={className}
      viewBox={`0 0 ${LABEL_WIDTH} ${LABEL_HEIGHT}`}
      role="img"
      aria-label={`Shipping label for ${label.orderNumber}`}
      fontFamily={LABEL_FONT}
      fill="#000"
    >
      <rect width={LABEL_WIDTH} height={LABEL_HEIGHT} fill="#fff" />
      <rect x={8} y={8} width={384} height={584} rx={5} fill="none" stroke="#000" strokeWidth={2} />
      <path
        d="M8 78h384M8 182h384M8 342h384M8 452h384M250 18v52M292 90v84M202 360v84M286 462v120"
        fill="none"
        stroke="#000"
        strokeWidth={1.4}
      />

      {/* Header */}
      <text x={22} y={50} fontFamily={SERIF} fontSize={30} textLength={212} lengthAdjust="spacingAndGlyphs">
        {SHIPPER.name.toUpperCase()}
      </text>
      <text x={22} y={67} fontSize={8} textLength={212} lengthAdjust="spacing">
        {SHIPPER.tagline.toUpperCase()}
      </text>
      {HANDLING.map(([name, Icon], i) => {
        const x = 260 + i * 44
        return (
          <g key={name}>
            <rect x={x} y={16} width={36} height={36} rx={3} fill="none" stroke="#000" strokeWidth={1.6} />
            <g transform={`translate(${x} 16)`}>
              <Icon />
            </g>
            <text
              x={x + 18}
              y={65}
              fontSize={fitSize(name, 42, { size: 6.5, min: 5, weight: 700 })}
              fontWeight={700}
              textAnchor="middle"
            >
              {name}
            </text>
          </g>
        )
      })}

      {/* From */}
      <Tag x={20} y={88}>
        FROM (SHIPPER)
      </Tag>
      <text x={20} y={123} fontSize={12.5} fontWeight={700}>
        {SHIPPER.name.toUpperCase()}
      </text>
      <Lines x={20} y={137} lines={fromLines} gap={12.5} size={10.5} />
      {shipperReady && (
        <text x={20} y={137 + fromLines.length * 12.5} fontSize={10.5}>
          Phone: {SHIPPER.phone}
        </text>
      )}
      <QrCode value={storeUrl} x={306} y={88} box={74} />
      <text x={343} y={174} fontSize={6.5} fontWeight={700} textAnchor="middle">
        VISIT OUR STORE
      </text>

      {/* Ship to */}
      <Tag x={20} y={192}>
        TO (SHIP TO)
      </Tag>
      <text x={20} y={229} fontSize={nameSize} fontWeight={700}>
        {ellipsize(label.to.name, 360, { size: nameSize, weight: 700 })}
      </text>
      <Lines x={20} y={252} lines={toLines} gap={16.5} size={13.5} />

      {/* Order + product */}
      <Tag x={20} y={352}>
        ORDER DETAILS
      </Tag>
      <Field x={20} y={388} label="Order No." value={label.orderNumber} valueWidth={110} colon={56} />
      <Field x={20} y={405} label="Order Date" value={label.orderDate} valueWidth={110} colon={56} bold={false} />
      <Field x={20} y={422} label="Payment" value={label.payment} valueWidth={110} colon={56} />
      {label.collect && (
        <Field x={20} y={439} label="Collect" value={`${label.collect} cash`} valueWidth={110} colon={56} />
      )}
      <Tag x={212} y={352}>
        PRODUCT DETAILS
      </Tag>
      <ProductBlock items={label.items} x={212} y={388} />

      {/* Barcode */}
      <Tag x={20} y={462}>
        {label.code.title}
      </Tag>
      <Barcode value={label.code.value} x={20} y={488} width={256} height={54} />
      <text
        x={148}
        y={562}
        fontSize={codeSize}
        fontWeight={700}
        textAnchor="middle"
        letterSpacing={0.8}
      >
        {label.code.value}
      </text>
      {label.code.courier && (
        <text x={148} y={578} fontSize={9} textAnchor="middle">
          {ellipsize(`Courier: ${label.code.courier}`, 250, { size: 9 })}
        </text>
      )}
      <g transform="translate(320 470)">
        <BottleIcon />
      </g>
      <Lines x={338} y={543} lines={['FRAGRANCE /', 'PERFUME']} gap={13} size={10.5} weight={700} anchor="middle" />
      <path d="M298 564h80" stroke="#000" strokeWidth={1} />
      <text x={338} y={577} fontSize={7} fontWeight={700} textAnchor="middle">
        HANDLE WITH CARE
      </text>
    </svg>
  )
}
