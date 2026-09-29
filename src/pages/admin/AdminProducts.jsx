/**
 * Admin product list - MongoDB catalog.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import AdminModal from '../../components/admin/AdminModal'
import {
  adminDeleteProduct,
  adminDeleteProductPermanently,
  adminFetchProducts,
  adminRestoreProduct,
} from '../../services/productApi'
import { adminAnalyticsProducts } from '../../services/analyticsApi'
import { useCatalog } from '../../context/CatalogContext'
import { ApiClientError } from '../../services/apiClient'

const VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

const isArchived = (p) => p.active === false

function errorText(err, fallback) {
  return err instanceof ApiClientError ? err.message : fallback
}

export default function AdminProducts() {
  const { refreshProducts } = useCatalog()
  const location = useLocation()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [salesById, setSalesById] = useState({})
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('all')
  const [pendingArchive, setPendingArchive] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [restoringId, setRestoringId] = useState(null)
  const [resultModal, setResultModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, analytics] = await Promise.all([
        adminFetchProducts(),
        adminAnalyticsProducts().catch(() => ({ products: [] })),
      ])
      setProducts(list)
      const map = {}
      for (const row of analytics.products || []) {
        map[row.id] = row
      }
      setSalesById(map)
    } catch (err) {
      setResultModal({
        tone: 'danger',
        title: 'Load failed',
        message:
          err instanceof ApiClientError
            ? err.message
            : 'Could not load products.',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const flash = location.state?.flash
    if (!flash) return
    setResultModal(flash)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate])

  const confirmArchive = async () => {
    if (!pendingArchive) return
    const name = pendingArchive.name
    try {
      await adminDeleteProduct(pendingArchive.id)
      setPendingArchive(null)
      await load()
      await refreshProducts()
      setResultModal({
        tone: 'success',
        title: 'Archived',
        message: `${name} is hidden from the shop. You can restore it any time from the Archived tab.`,
      })
    } catch (err) {
      setPendingArchive(null)
      setResultModal({
        tone: 'danger',
        title: 'Archive failed',
        message: errorText(err, 'Could not archive this perfume.'),
      })
    }
  }

  const restore = async (product) => {
    if (restoringId) return
    setRestoringId(product.id)
    try {
      await adminRestoreProduct(product.id)
      await load()
      await refreshProducts()
      setResultModal({
        tone: 'success',
        title: 'Restored',
        message: `${product.name} is live in the shop again.`,
      })
    } catch (err) {
      setResultModal({
        tone: 'danger',
        title: 'Restore failed',
        message: errorText(err, 'Could not restore this perfume.'),
      })
    } finally {
      setRestoringId(null)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const name = pendingDelete.name
    try {
      await adminDeleteProductPermanently(pendingDelete.id)
      setPendingDelete(null)
      await load()
      await refreshProducts()
      setResultModal({
        tone: 'success',
        title: 'Deleted',
        message: `${name} has been permanently deleted. Past orders still show it.`,
      })
    } catch (err) {
      setPendingDelete(null)
      setResultModal({
        tone: 'danger',
        title: 'Delete failed',
        message: errorText(err, 'Could not delete this perfume.'),
      })
    }
  }

  const counts = {
    all: products.length,
    active: products.filter((p) => !isArchived(p)).length,
    archived: products.filter(isArchived).length,
  }
  const visible = products.filter((p) =>
    view === 'all' ? true : view === 'archived' ? isArchived(p) : !isArchived(p),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="admin-title">Products</h2>
          <p className="mt-1 admin-muted text-[15px]">
            Edit, archive, restore or delete items in the Scentinova catalog.
          </p>
        </div>
        <Link to="/admin/products/new" className="admin-btn admin-btn-primary">
          Add perfume
        </Link>
      </div>

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Product status">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            role="tab"
            aria-selected={view === v.value}
            onClick={() => setView(v.value)}
            className={`rounded-sm px-3 py-1.5 text-[14px] transition ${
              view === v.value ? 'bg-charcoal text-warm-white' : 'text-charcoal hover:bg-cream'
            }`}
          >
            {v.label}
            <span className="ml-1.5 tabular-nums opacity-70">{counts[v.value]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="admin-muted">Loading products…</p>
      ) : visible.length === 0 ? (
        <p className="border border-dashed border-stone px-4 py-10 text-center text-[14px] admin-muted">
          {view === 'archived' ? 'No archived perfumes.' : view === 'active' ? 'No active perfumes.' : 'No perfumes yet.'}
        </p>
      ) : (
        <div className="admin-surface overflow-x-auto">
          <table className="admin-table w-full min-w-[720px] text-left">
            <thead className="border-b border-[#e0d6c4]">
              <tr>
                <th className="px-3 py-2.5">Product</th>
                <th className="px-3 py-2.5">Images</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Price</th>
                <th className="px-3 py-2.5">Stock</th>
                <th className="px-3 py-2.5">Sold</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const a = salesById[p.id]
                const archived = isArchived(p)
                const gallery = (
                  p.gallery?.length ? p.gallery : p.image ? [p.image] : []
                ).filter(Boolean)
                return (
                  <tr key={p.id} className={`border-b border-[#ebe4d6] ${archived ? 'bg-[#f3eee4]/60' : ''}`}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt=""
                          className="h-10 w-10 object-contain"
                        />
                        <div>
                          <p className="font-medium text-[#1b1917]">{p.name}</p>
                          <p className="text-[13px] admin-muted">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        {gallery.slice(0, 3).map((src, i) => (
                          <img
                            key={`${p.id}-img-${i}`}
                            src={src}
                            alt=""
                            className="h-9 w-9 border border-[#ebe4d6] bg-[#f3eee4] object-contain"
                          />
                        ))}
                        <span className="ml-1 text-[13px] tabular-nums admin-muted">
                          {gallery.length}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 admin-muted">{p.category}</td>
                    <td className="px-3 py-3">{formatPrice(p.price)}</td>
                    <td className="px-3 py-3">{p.stock ?? 0}</td>
                    <td className="px-3 py-3">{a?.purchases ?? 0}</td>
                    <td className="px-3 py-3">
                      {archived ? (
                        <span className="inline-block border border-[#c9bdaa] px-2 py-0.5 text-[12px] tracking-wide text-[#6b5f4f] uppercase">
                          Archived
                        </span>
                      ) : (
                        'Active'
                      )}
                    </td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <Link
                        to={`/admin/products/${p.id}`}
                        className="admin-link mr-3"
                      >
                        Edit
                      </Link>
                      {archived ? (
                        <button
                          type="button"
                          className="admin-link mr-3 disabled:opacity-50"
                          disabled={Boolean(restoringId)}
                          onClick={() => restore(p)}
                        >
                          {restoringId === p.id ? 'Restoring…' : 'Restore'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-link mr-3 text-[#6e1118]"
                          onClick={() => setPendingArchive(p)}
                        >
                          Archive
                        </button>
                      )}
                      <button
                        type="button"
                        className="admin-link text-[#6e1118]"
                        onClick={() => setPendingDelete(p)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminModal
        open={Boolean(pendingArchive)}
        title="Archive perfume?"
        message={
          pendingArchive
            ? `${pendingArchive.name} will be hidden from the shop. You can restore it later from the Archived tab.`
            : ''
        }
        confirmLabel="Archive"
        tone="danger"
        onConfirm={confirmArchive}
        onCancel={() => setPendingArchive(null)}
      />

      <AdminModal
        open={Boolean(pendingDelete)}
        title="Delete perfume permanently?"
        message={
          pendingDelete
            ? `${pendingDelete.name} will be removed from the catalog for good. This cannot be undone. Past orders keep their details. If you might sell it again, archive it instead.`
            : ''
        }
        confirmLabel="Delete permanently"
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
    </div>
  )
}
