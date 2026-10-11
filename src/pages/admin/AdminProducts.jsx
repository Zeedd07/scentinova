/**
 * Admin product list - MongoDB catalog.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '../../data/products'
import AdminModal from '../../components/admin/AdminModal'
import FilterTabs from '../../components/admin/ui/FilterTabs'
import ResponsiveTable from '../../components/admin/ui/ResponsiveTable'
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

  const galleryOf = (p) => (p.gallery?.length ? p.gallery : p.image ? [p.image] : []).filter(Boolean)

  const actions = (p) => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 md:justify-end">
      <Button asChild variant="link" className="min-h-10 md:min-h-0">
        <Link to={`/admin/products/${p.id}`}>Edit</Link>
      </Button>
      {isArchived(p) ? (
        <Button
          type="button"
          variant="link"
          className="min-h-10 md:min-h-0"
          disabled={Boolean(restoringId)}
          onClick={() => restore(p)}
        >
          {restoringId === p.id ? 'Restoring…' : 'Restore'}
        </Button>
      ) : (
        <Button
          type="button"
          variant="link"
          className="min-h-10 text-[#6e1118] md:min-h-0"
          onClick={() => setPendingArchive(p)}
        >
          Archive
        </Button>
      )}
      <Button
        type="button"
        variant="link"
        className="min-h-10 text-[#6e1118] md:min-h-0"
        onClick={() => setPendingDelete(p)}
      >
        Delete
      </Button>
    </div>
  )

  const status = (p) =>
    isArchived(p) ? <Badge variant="tag">Archived</Badge> : <span>Active</span>

  const columns = [
    {
      key: 'product',
      header: 'Product',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <img src={p.image} alt="" className="h-10 w-10 object-contain" />
          <div className="min-w-0">
            <p className="font-medium text-[#1b1917]">{p.name}</p>
            <p className="text-[13px] admin-muted">{p.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'images',
      header: 'Images',
      cell: (p) => {
        const gallery = galleryOf(p)
        return (
          <div className="flex items-center gap-1.5">
            {gallery.slice(0, 3).map((src, i) => (
              <img
                key={`${p.id}-img-${i}`}
                src={src}
                alt=""
                className="h-9 w-9 border border-[#ebe4d6] bg-[#f3eee4] object-contain"
              />
            ))}
            <span className="ml-1 text-[13px] tabular-nums admin-muted">{gallery.length}</span>
          </div>
        )
      },
    },
    { key: 'category', header: 'Category', className: 'admin-muted', cell: (p) => p.category },
    { key: 'price', header: 'Price', cell: (p) => formatPrice(p.price) },
    { key: 'stock', header: 'Stock', cell: (p) => p.stock ?? 0 },
    { key: 'sold', header: 'Sold', cell: (p) => salesById[p.id]?.purchases ?? 0 },
    { key: 'status', header: 'Status', cell: status },
    { key: 'actions', header: <span className="sr-only">Actions</span>, className: 'whitespace-nowrap', cell: actions },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h2 className="admin-title">Products</h2>
          <p className="mt-1 admin-muted text-[15px]">
            Edit, archive, restore or delete items in the Scentinova catalog.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/admin/products/new">Add perfume</Link>
        </Button>
      </div>

      <FilterTabs
        label="Product status"
        value={view}
        onValueChange={setView}
        options={VIEWS.map((v) => ({ ...v, count: counts[v.value] }))}
      />

      {loading ? (
        <p className="admin-muted">Loading products…</p>
      ) : visible.length === 0 ? (
        <p className="border border-dashed border-stone px-4 py-10 text-center text-[14px] admin-muted">
          {view === 'archived' ? 'No archived perfumes.' : view === 'active' ? 'No active perfumes.' : 'No perfumes yet.'}
        </p>
      ) : (
        <ResponsiveTable
          caption="Products"
          columns={columns}
          rows={visible}
          rowKey={(p) => p.id}
          rowClassName={(p) => (isArchived(p) ? 'bg-[#f3eee4]/60' : '')}
          renderCard={(p) => (
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <img
                  src={p.image}
                  alt=""
                  className="h-14 w-14 shrink-0 border border-[#ebe4d6] bg-[#f3eee4] object-contain"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-[#1b1917]">{p.name}</p>
                    {isArchived(p) && <Badge variant="tag">Archived</Badge>}
                  </div>
                  <p className="text-[13px] admin-muted">
                    {[p.category, `${galleryOf(p).length} images`].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-[13px]">
                <div>
                  <dt className="admin-muted">Price</dt>
                  <dd className="text-[15px] text-[#1b1917]">{formatPrice(p.price)}</dd>
                </div>
                <div>
                  <dt className="admin-muted">Stock</dt>
                  <dd className="text-[15px] text-[#1b1917] tabular-nums">{p.stock ?? 0}</dd>
                </div>
                <div>
                  <dt className="admin-muted">Sold</dt>
                  <dd className="text-[15px] text-[#1b1917] tabular-nums">{salesById[p.id]?.purchases ?? 0}</dd>
                </div>
              </dl>
              {actions(p)}
            </div>
          )}
        />
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
