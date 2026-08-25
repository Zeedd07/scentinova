/**
 * Admin product list — delete with confirmation modal.
 */
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCatalog } from '../../context/CatalogContext'
import { formatPrice } from '../../data/products'
import AdminModal from '../../components/admin/AdminModal'

export default function AdminProducts() {
  const { products, deleteProduct, stats } = useCatalog()
  const location = useLocation()
  const navigate = useNavigate()
  const byId = Object.fromEntries(stats.rows.map((r) => [r.product.id, r]))

  const [pendingDelete, setPendingDelete] = useState(null)
  const [resultModal, setResultModal] = useState(null)

  useEffect(() => {
    const flash = location.state?.flash
    if (!flash) return
    setResultModal(flash)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate])

  const confirmDelete = () => {
    if (!pendingDelete) return
    const name = pendingDelete.name
    const result = deleteProduct(pendingDelete.id)
    setPendingDelete(null)
    if (!result.ok) {
      setResultModal({
        tone: 'danger',
        title: 'Delete failed',
        message: result.error || 'Could not delete this perfume.',
      })
      return
    }
    setResultModal({
      tone: 'success',
      title: 'Deleted',
      message: `${name} has been removed from the catalog and shop.`,
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.32em] text-bronze uppercase">
            Catalog
          </p>
          <h2 className="mt-1 font-display text-3xl text-cream">
            All <span className="gold-text italic">perfumes</span>
          </h2>
        </div>
        <Link
          to="/admin/products/new"
          className="btn-luxury border border-gold/40 px-5 py-2.5 text-cream hover:border-gold"
        >
          Add perfume
        </Link>
      </div>

      <div className="overflow-x-auto border border-gold/15">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gold/15 bg-ink-soft text-[10px] tracking-[0.22em] text-bronze uppercase">
            <tr>
              <th className="px-4 py-3 font-normal">Product</th>
              <th className="px-4 py-3 font-normal">Category</th>
              <th className="px-4 py-3 font-normal">Price</th>
              <th className="px-4 py-3 font-normal">Stock</th>
              <th className="px-4 py-3 font-normal">Sold</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const a = byId[p.id]
              return (
                <tr key={p.id} className="border-b border-gold/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt=""
                        className="h-12 w-10 object-contain"
                      />
                      <div>
                        <p className="font-display text-lg text-cream">{p.name}</p>
                        <p className="text-[11px] text-bronze">{p.badge || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-bronze">{p.category}</td>
                  <td className="px-4 py-3 text-cream">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-bronze">{p.stock}</td>
                  <td className="px-4 py-3 text-bronze">{a?.purchases ?? 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.active !== false ? 'text-gold-light' : 'text-bronze'
                      }
                    >
                      {p.active !== false ? 'Live' : 'Hidden'}
                      {p.featured ? ' · Featured' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/products/${p.id}`}
                      className="mr-3 text-[11px] tracking-[0.2em] text-gold uppercase"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(p)}
                      className="text-[11px] tracking-[0.2em] text-bronze uppercase hover:text-cream"
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

      <AdminModal
        open={Boolean(pendingDelete)}
        tone="danger"
        title="Delete perfume?"
        message={
          pendingDelete
            ? `Remove “${pendingDelete.name}” from the catalog? This cannot be undone (unless you reset mock data).`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <AdminModal
        open={Boolean(resultModal)}
        tone={resultModal?.tone || 'success'}
        title={resultModal?.title || ''}
        message={resultModal?.message || ''}
        confirmLabel="OK"
        hideCancel
        onConfirm={() => setResultModal(null)}
        onCancel={() => setResultModal(null)}
      />
    </div>
  )
}
