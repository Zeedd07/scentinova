/**
 * Admin product list — MongoDB catalog.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import AdminModal from '../../components/admin/AdminModal'
import {
  adminDeleteProduct,
  adminFetchProducts,
} from '../../services/productApi'
import { adminAnalyticsProducts } from '../../services/analyticsApi'
import { useCatalog } from '../../context/CatalogContext'
import { ApiClientError } from '../../services/apiClient'

export default function AdminProducts() {
  const { refreshProducts } = useCatalog()
  const location = useLocation()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [salesById, setSalesById] = useState({})
  const [loading, setLoading] = useState(true)
  const [pendingDelete, setPendingDelete] = useState(null)
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

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const name = pendingDelete.name
    try {
      await adminDeleteProduct(pendingDelete.id)
      setPendingDelete(null)
      await load()
      await refreshProducts()
      setResultModal({
        tone: 'success',
        title: 'Archived',
        message: `${name} has been archived (soft-deleted) in the catalog.`,
      })
    } catch (err) {
      setPendingDelete(null)
      setResultModal({
        tone: 'danger',
        title: 'Delete failed',
        message:
          err instanceof ApiClientError
            ? err.message
            : 'Could not archive this perfume.',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="admin-title">Products</h2>
          <p className="mt-1 admin-muted text-[15px]">
            Edit or archive items in the Scentinova catalog.
          </p>
        </div>
        <Link to="/admin/products/new" className="admin-btn admin-btn-primary">
          Add perfume
        </Link>
      </div>

      {loading ? (
        <p className="admin-muted">Loading products…</p>
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
              {products.map((p) => {
                const a = salesById[p.id]
                const gallery = (
                  p.gallery?.length ? p.gallery : p.image ? [p.image] : []
                ).filter(Boolean)
                return (
                  <tr key={p.id} className="border-b border-[#ebe4d6]">
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
                      {p.active !== false ? 'Active' : 'Archived'}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        to={`/admin/products/${p.id}`}
                        className="admin-link mr-3"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="admin-link text-[#6e1118]"
                        onClick={() => setPendingDelete(p)}
                      >
                        Archive
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
        open={Boolean(pendingDelete)}
        title="Archive perfume?"
        message={
          pendingDelete
            ? `${pendingDelete.name} will be soft-deleted (active = false).`
            : ''
        }
        confirmLabel="Archive"
        tone="danger"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
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
