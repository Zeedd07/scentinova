/**
 * Admin sales - percentage-off sales (Diwali, Eid...) for every product or a chosen few.
 * The server applies the discount at checkout; this only manages the sales.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import AdminModal from './AdminModal'
import {
  adminCreateSale,
  adminDeleteSale,
  adminFetchSales,
  adminUpdateSale,
} from '../../services/adminSaleApi'
import { adminFetchProducts } from '../../services/productApi'
import { ApiClientError } from '../../services/apiClient'
import { formatPrice } from '../../data/products'

const NAME_MAX = 60
const PERCENT_MIN = 1
const PERCENT_MAX = 90
const MAX_SALES = 20

const EMPTY_FORM = {
  name: '',
  percentOff: '',
  appliesTo: 'ALL',
  productIds: [],
  startsAt: '',
  endsAt: '',
  active: true,
}

const STATUS = {
  LIVE: { label: 'Live', className: 'border-[#3f6b3a]/40 text-[#3f6b3a]' },
  SCHEDULED: { label: 'Scheduled', className: 'border-[#a8842f]/50 text-[#7d5e22]' },
  ENDED: { label: 'Ended', className: 'border-[#c9bdaa] text-[#6b5f4f]' },
  OFF: { label: 'Off', className: 'border-[#c9bdaa] text-[#6b5f4f]' },
}

function errorText(err, fallback) {
  return err instanceof ApiClientError ? err.message : fallback
}

/** ISO date -> value for a datetime-local input, in the admin's own time zone. */
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(value) {
  return value ? new Date(value).toISOString() : null
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function scheduleText(sale) {
  if (sale.startsAt && sale.endsAt) return `${formatDate(sale.startsAt)} to ${formatDate(sale.endsAt)}`
  if (sale.startsAt) return `From ${formatDate(sale.startsAt)}, no end date`
  if (sale.endsAt) return `Until ${formatDate(sale.endsAt)}`
  return 'No dates - runs while switched on'
}

/** Same rounding as the server: nearest whole rupee. */
function salePrice(price, percent) {
  return Math.round((price * (100 - percent)) / 100)
}

function formFromSale(sale) {
  return {
    name: sale.name,
    percentOff: String(sale.percentOff),
    appliesTo: sale.appliesTo,
    productIds: sale.productIds || [],
    startsAt: toLocalInput(sale.startsAt),
    endsAt: toLocalInput(sale.endsAt),
    active: sale.active,
  }
}

function formProblem(form) {
  const percent = Number(form.percentOff)
  if (!form.name.trim()) return 'Give the sale a name.'
  if (!Number.isInteger(percent) || percent < PERCENT_MIN || percent > PERCENT_MAX) {
    return `Percent off must be a whole number from ${PERCENT_MIN} to ${PERCENT_MAX}.`
  }
  if (form.appliesTo === 'PRODUCTS' && !form.productIds.length) return 'Choose at least one product.'
  if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
    return 'The end must be after the start.'
  }
  return null
}

export default function AdminSalesSection() {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [showProblem, setShowProblem] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [resultModal, setResultModal] = useState(null)
  const formRef = useRef(null)

  const fail = (title, err, fallback) =>
    setResultModal({ tone: 'danger', title, message: errorText(err, fallback) })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [saleList, productList] = await Promise.all([adminFetchSales(), adminFetchProducts()])
      setSales(saleList)
      setProducts(productList)
    } catch (err) {
      setResultModal({ tone: 'danger', title: 'Load failed', message: errorText(err, 'Could not load sales.') })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const toggleProduct = (id) =>
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id) ? f.productIds.filter((p) => p !== id) : [...f.productIds, id],
    }))

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowProblem(false)
  }

  const problem = formProblem(form)
  const atLimit = !editingId && sales.length >= MAX_SALES
  const percent = Number(form.percentOff)
  const examplePrice = (() => {
    const pool =
      form.appliesTo === 'PRODUCTS' ? products.filter((p) => form.productIds.includes(p.id)) : products
    return pool.find((p) => Number(p.price) > 0) || null
  })()

  const submit = async (e) => {
    e.preventDefault()
    if (busy || atLimit) return
    if (problem) {
      setShowProblem(true)
      return
    }
    const body = {
      name: form.name.trim(),
      percentOff: percent,
      appliesTo: form.appliesTo,
      productIds: form.appliesTo === 'PRODUCTS' ? form.productIds : [],
      startsAt: fromLocalInput(form.startsAt),
      endsAt: fromLocalInput(form.endsAt),
      active: form.active,
    }
    setBusy(true)
    try {
      if (editingId) {
        const sale = await adminUpdateSale(editingId, body)
        setSales((list) => list.map((s) => (s.id === sale.id ? sale : s)))
      } else {
        const sale = await adminCreateSale(body)
        setSales((list) => [sale, ...list])
      }
      resetForm()
    } catch (err) {
      fail(editingId ? 'Could not save sale' : 'Could not add sale', err, 'Please check the details and try again.')
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (sale) => {
    setEditingId(sale.id)
    setForm(formFromSale(sale))
    setShowProblem(false)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleActive = async (sale) => {
    if (busy) return
    setBusy(true)
    try {
      const updated = await adminUpdateSale(sale.id, { active: !sale.active })
      setSales((list) => list.map((s) => (s.id === updated.id ? updated : s)))
    } catch (err) {
      fail('Could not update sale', err, 'Could not switch this sale on or off.')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const { id } = pendingDelete
    try {
      await adminDeleteSale(id)
      setSales((list) => list.filter((s) => s.id !== id))
      if (editingId === id) resetForm()
      setPendingDelete(null)
    } catch (err) {
      setPendingDelete(null)
      fail('Delete failed', err, 'Could not delete this sale.')
      await load()
    }
  }

  const productName = (id) => products.find((p) => p.id === id)?.name || 'Removed product'
  const scopeText = (sale) =>
    sale.appliesTo === 'ALL'
      ? 'All products'
      : sale.productIds.map(productName).join(', ')

  return (
    <section className="space-y-4" aria-labelledby="sales-heading">
      <div>
        <h3 id="sales-heading" className="font-display text-[1.35rem] text-[#1b1917]">
          Sales
        </h3>
        <p className="mt-1 admin-muted text-[15px]">
          Festival sales like Diwali or Eid. The store shows the reduced price and checkout charges it.
          When sales overlap, a product gets the highest percentage (they never add up).
        </p>
      </div>

      <form ref={formRef} onSubmit={submit} className="admin-surface space-y-4 p-5" noValidate>
        <p className="admin-label text-[14px]">{editingId ? 'Edit sale' : 'New sale'}</p>
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <label className="block">
            <span className="admin-label">Sale name</span>
            <input
              type="text"
              className="admin-input"
              value={form.name}
              maxLength={NAME_MAX}
              placeholder="e.g. Diwali Sale"
              onChange={(e) => set('name', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="admin-label">Percent off</span>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={PERCENT_MIN}
                max={PERCENT_MAX}
                step={1}
                className="admin-input pr-8"
                value={form.percentOff}
                placeholder="20"
                onChange={(e) => set('percentOff', e.target.value)}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 mt-[0.175rem] -translate-y-1/2 text-[15px] admin-muted">
                %
              </span>
            </div>
          </label>
        </div>

        <fieldset className="space-y-2">
          <legend className="admin-label mb-1">Applies to</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-[#1b1917]">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sale-scope"
                checked={form.appliesTo === 'ALL'}
                onChange={() => set('appliesTo', 'ALL')}
              />
              All products
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sale-scope"
                checked={form.appliesTo === 'PRODUCTS'}
                onChange={() => set('appliesTo', 'PRODUCTS')}
              />
              Selected products
            </label>
          </div>
          {form.appliesTo === 'PRODUCTS' && (
            <div className="max-h-56 overflow-y-auto border border-[#e0d6c4] bg-white p-3">
              {products.length === 0 ? (
                <p className="text-[14px] admin-muted">No products yet.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {products.map((p) => (
                    <li key={p.id}>
                      <label className="flex items-center gap-2 text-[15px] text-[#1b1917]">
                        <input
                          type="checkbox"
                          checked={form.productIds.includes(p.id)}
                          onChange={() => toggleProduct(p.id)}
                        />
                        <span className="min-w-0 truncate">{p.name}</span>
                        <span className="shrink-0 text-[13px] admin-muted">
                          {formatPrice(p.price)}
                          {!p.active && ' · not live'}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="admin-label">Starts (optional)</span>
            <input
              type="datetime-local"
              className="admin-input"
              value={form.startsAt}
              onChange={(e) => set('startsAt', e.target.value)}
            />
          </label>
          <label className="block">
            <span className="admin-label">Ends (optional)</span>
            <input
              type="datetime-local"
              className="admin-input"
              value={form.endsAt}
              onChange={(e) => set('endsAt', e.target.value)}
            />
          </label>
        </div>
        <p className="-mt-2 text-[13px] admin-muted">
          Leave the dates empty to run the sale for as long as it is switched on.
        </p>

        <label className="flex items-center gap-2 text-[15px] text-[#1b1917]">
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
          Switched on
        </label>

        {examplePrice && Number.isInteger(percent) && percent >= PERCENT_MIN && percent <= PERCENT_MAX && (
          <p className="border border-[#e0d6c4] bg-white px-3 py-2 text-[14px] text-[#1b1917]">
            Example: {examplePrice.name}{' '}
            <span className="admin-muted line-through">{formatPrice(examplePrice.price)}</span>{' '}
            becomes <strong>{formatPrice(salePrice(Number(examplePrice.price), percent))}</strong>
          </p>
        )}

        {showProblem && problem && <p className="text-[14px] text-[#6e1118]">{problem}</p>}
        {atLimit && (
          <p className="text-[14px] text-[#6e1118]">
            You can have up to {MAX_SALES} sales. Delete an old one to add another.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="admin-btn admin-btn-primary disabled:opacity-50"
            disabled={busy || atLimit}
          >
            {editingId ? 'Save sale' : 'Add sale'}
          </button>
          {editingId && (
            <button type="button" className="admin-btn admin-btn-quiet" onClick={resetForm} disabled={busy}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="admin-muted">Loading sales…</p>
      ) : sales.length === 0 ? (
        <p className="border border-dashed border-stone px-4 py-8 text-center text-[14px] admin-muted">
          No sales yet. Add one above, e.g. &ldquo;Diwali Sale&rdquo; at 20% off.
        </p>
      ) : (
        <ul className="admin-surface divide-y divide-[#ebe4d6]">
          {sales.map((sale) => {
            const status = STATUS[sale.status] || STATUS.OFF
            return (
              <li
                key={sale.id}
                className={`flex flex-wrap items-start gap-3 px-4 py-3 ${sale.status === 'LIVE' ? '' : 'bg-[#f3eee4]/60'}`}
              >
                <div className="min-w-[14rem] flex-1 space-y-0.5">
                  <p className="text-[15px] text-[#1b1917]">
                    <span className="font-medium">{sale.name}</span>
                    <span className="ml-2 text-[#7d5e22]">{sale.percentOff}% off</span>
                  </p>
                  <p className="text-[13px] admin-muted">{scopeText(sale)}</p>
                  <p className="text-[13px] admin-muted">{scheduleText(sale)}</p>
                </div>

                <span
                  className={`inline-block border px-2 py-0.5 text-[12px] tracking-wide uppercase ${status.className}`}
                >
                  {status.label}
                </span>

                <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
                  <button
                    type="button"
                    className="admin-link disabled:opacity-50"
                    onClick={() => startEdit(sale)}
                    disabled={busy}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="admin-link disabled:opacity-50"
                    onClick={() => toggleActive(sale)}
                    disabled={busy}
                  >
                    {sale.active ? 'Turn off' : 'Turn on'}
                  </button>
                  <button
                    type="button"
                    className="admin-link text-[#6e1118] disabled:opacity-50"
                    onClick={() => setPendingDelete(sale)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AdminModal
        open={Boolean(pendingDelete)}
        title="Delete sale?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be removed. Prices go back to normal straight away if it is live.`
            : ''
        }
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <AdminModal
        open={Boolean(resultModal)}
        title={resultModal?.title}
        message={resultModal?.message}
        tone={resultModal?.tone}
        onClose={() => setResultModal(null)}
      />
    </section>
  )
}
