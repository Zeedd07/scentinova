/**
 * Admin offers - messages for the cream announcement bar above the store navbar.
 */
import { useCallback, useEffect, useState } from 'react'
import AdminModal from '../../components/admin/AdminModal'
import {
  adminCreateOffer,
  adminDeleteOffer,
  adminFetchOffers,
  adminReorderOffers,
  adminUpdateOffer,
} from '../../services/adminOfferApi'
import { ApiClientError } from '../../services/apiClient'

const TEXT_MAX = 120
const MAX_OFFERS = 10

function errorText(err, fallback) {
  return err instanceof ApiClientError ? err.message : fallback
}

function BarPreview({ text }) {
  return (
    <div className="flex h-8 items-center justify-center border border-black/10 bg-cream px-3 text-center text-[11px] leading-[1.25] tracking-[0.2em] text-black uppercase">
      <span className="line-clamp-2">{text || 'Your offer appears here'}</span>
    </div>
  )
}

function Counter({ value }) {
  const left = TEXT_MAX - value.length
  return (
    <span className={`text-[13px] tabular-nums ${left < 0 ? 'text-[#6e1118]' : 'admin-muted'}`}>
      {value.length}/{TEXT_MAX}
    </span>
  )
}

export default function AdminOffers() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [resultModal, setResultModal] = useState(null)

  const fail = (title, err, fallback) =>
    setResultModal({ tone: 'danger', title, message: errorText(err, fallback) })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setOffers(await adminFetchOffers())
    } catch (err) {
      setResultModal({ tone: 'danger', title: 'Load failed', message: errorText(err, 'Could not load offers.') })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const run = async (task, title, fallback) => {
    if (busy) return false
    setBusy(true)
    try {
      await task()
      return true
    } catch (err) {
      fail(title, err, fallback)
      await load()
      return false
    } finally {
      setBusy(false)
    }
  }

  const draftText = draft.trim()
  const atLimit = offers.length >= MAX_OFFERS
  const canAdd = draftText.length > 0 && draftText.length <= TEXT_MAX && !atLimit && !busy

  const addOffer = async (e) => {
    e.preventDefault()
    if (!canAdd) return
    const ok = await run(
      async () => {
        const offer = await adminCreateOffer({ text: draftText })
        setOffers((list) => [...list, offer])
      },
      'Could not add offer',
      'Could not add this offer.',
    )
    if (ok) setDraft('')
  }

  const saveEdit = async () => {
    if (!editing) return
    const text = editing.text.trim()
    if (!text || text.length > TEXT_MAX) return
    const ok = await run(
      async () => {
        const offer = await adminUpdateOffer(editing.id, { text })
        setOffers((list) => list.map((o) => (o.id === offer.id ? offer : o)))
      },
      'Could not save offer',
      'Could not save this offer.',
    )
    if (ok) setEditing(null)
  }

  const toggleActive = (offer) =>
    run(
      async () => {
        const updated = await adminUpdateOffer(offer.id, { active: !offer.active })
        setOffers((list) => list.map((o) => (o.id === updated.id ? updated : o)))
      },
      'Could not update offer',
      'Could not change whether this offer is shown.',
    )

  const move = (index, step) => {
    const target = index + step
    if (target < 0 || target >= offers.length) return
    const next = [...offers]
    ;[next[index], next[target]] = [next[target], next[index]]
    setOffers(next)
    run(
      async () => setOffers(await adminReorderOffers(next.map((o) => o.id))),
      'Could not reorder',
      'Could not save the new order.',
    )
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const { id } = pendingDelete
    try {
      await adminDeleteOffer(id)
      setOffers((list) => list.filter((o) => o.id !== id))
      setPendingDelete(null)
    } catch (err) {
      setPendingDelete(null)
      fail('Delete failed', err, 'Could not delete this offer.')
      await load()
    }
  }

  const visibleCount = offers.filter((o) => o.active).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="admin-title">Offers</h2>
        <p className="mt-1 admin-muted text-[15px]">
          Short messages shown in the cream bar above the store menu. Visible offers rotate in the
          order below; with none visible, the bar is hidden.
        </p>
      </div>

      <form onSubmit={addOffer} className="admin-surface space-y-3 p-5">
        <label className="block">
          <span className="admin-label">New offer</span>
          <input
            type="text"
            className="admin-input mt-1 w-full"
            value={draft}
            maxLength={TEXT_MAX}
            placeholder="e.g. Free shipping on all prepaid orders"
            onChange={(e) => setDraft(e.target.value)}
            disabled={atLimit}
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-wrap items-baseline gap-x-3">
            <Counter value={draft} />
            <span className="text-[13px] admin-muted">
              About 40 characters fit on one line on phones.
            </span>
          </span>
          <button type="submit" className="admin-btn admin-btn-primary disabled:opacity-50" disabled={!canAdd}>
            Add offer
          </button>
        </div>
        {atLimit && (
          <p className="text-[14px] text-[#6e1118]">
            You can have up to {MAX_OFFERS} offers. Delete one to add another.
          </p>
        )}
        <div>
          <p className="admin-label mb-1.5">Preview</p>
          <BarPreview text={draftText} />
        </div>
      </form>

      {loading ? (
        <p className="admin-muted">Loading offers…</p>
      ) : offers.length === 0 ? (
        <p className="border border-dashed border-stone px-4 py-10 text-center text-[14px] admin-muted">
          No offers yet. Add one above to show the bar on the store.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-[14px] admin-muted">
            {visibleCount} of {offers.length} shown on the store
          </p>
          <ul className="admin-surface divide-y divide-[#ebe4d6]">
            {offers.map((offer, index) => {
              const isEditing = editing?.id === offer.id
              return (
                <li
                  key={offer.id}
                  className={`flex flex-wrap items-center gap-3 px-4 py-3 ${offer.active ? '' : 'bg-[#f3eee4]/60'}`}
                >
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      className="admin-link px-1 leading-none disabled:opacity-30"
                      onClick={() => move(index, -1)}
                      disabled={busy || index === 0}
                      aria-label={`Move "${offer.text}" up`}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="admin-link px-1 leading-none disabled:opacity-30"
                      onClick={() => move(index, 1)}
                      disabled={busy || index === offers.length - 1}
                      aria-label={`Move "${offer.text}" down`}
                    >
                      ▼
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="min-w-[14rem] flex-1 space-y-1.5">
                      <input
                        type="text"
                        className="admin-input w-full"
                        value={editing.text}
                        maxLength={TEXT_MAX}
                        autoFocus
                        aria-label="Offer text"
                        onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            saveEdit()
                          } else if (e.key === 'Escape') {
                            setEditing(null)
                          }
                        }}
                      />
                      <Counter value={editing.text} />
                    </div>
                  ) : (
                    <p className="min-w-[14rem] flex-1 text-[15px] text-[#1b1917]">{offer.text}</p>
                  )}

                  <span
                    className={`inline-block border px-2 py-0.5 text-[12px] tracking-wide uppercase ${
                      offer.active ? 'border-[#3f6b3a]/40 text-[#3f6b3a]' : 'border-[#c9bdaa] text-[#6b5f4f]'
                    }`}
                  >
                    {offer.active ? 'Shown' : 'Hidden'}
                  </span>

                  <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="admin-link disabled:opacity-50"
                          onClick={saveEdit}
                          disabled={busy || !editing.text.trim()}
                        >
                          Save
                        </button>
                        <button type="button" className="admin-link" onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="admin-link disabled:opacity-50"
                          onClick={() => setEditing({ id: offer.id, text: offer.text })}
                          disabled={busy}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-link disabled:opacity-50"
                          onClick={() => toggleActive(offer)}
                          disabled={busy}
                        >
                          {offer.active ? 'Hide' : 'Show'}
                        </button>
                        <button
                          type="button"
                          className="admin-link text-[#6e1118] disabled:opacity-50"
                          onClick={() => setPendingDelete(offer)}
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <AdminModal
        open={Boolean(pendingDelete)}
        title="Delete offer?"
        message={pendingDelete ? `"${pendingDelete.text}" will be removed from the offer bar.` : ''}
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
    </div>
  )
}
