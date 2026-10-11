/**
 * Admin offers - festival sales, plus messages for the cream announcement bar above the store navbar.
 */
import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import AdminModal from '../../components/admin/AdminModal'
import Field from '../../components/admin/ui/Field'
import AdminSalesSection from '../../components/admin/AdminSalesSection'
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
      <h2 className="admin-title">Offers &amp; sales</h2>

      <AdminSalesSection />

      <div className="border-t border-[#e0d6c4] pt-6">
        <h3 className="font-display text-[1.35rem] text-[#1b1917]">Offer bar</h3>
        <p className="mt-1 admin-muted text-[15px]">
          Short messages shown in the cream bar above the store menu. Visible offers rotate in the
          order below; with none visible, the bar is hidden. Announce a sale here too, e.g.
          &ldquo;Diwali Sale: 20% off everything&rdquo;.
        </p>
      </div>

      <form onSubmit={addOffer} className="admin-surface space-y-3 p-4 sm:p-5">
        <Field label="New offer">
          <Input
            type="text"
            value={draft}
            maxLength={TEXT_MAX}
            placeholder="e.g. Free shipping on all prepaid orders"
            onChange={(e) => setDraft(e.target.value)}
            disabled={atLimit}
          />
        </Field>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex flex-wrap items-baseline gap-x-3">
            <Counter value={draft} />
            <span className="text-[13px] admin-muted">
              About 40 characters fit on one line on phones.
            </span>
          </span>
          <Button type="submit" disabled={!canAdd}>
            Add offer
          </Button>
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
                  className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 sm:px-4 ${offer.active ? '' : 'bg-[#f3eee4]/60'}`}
                >
                  <div className="flex shrink-0 flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="inline"
                      className="h-9 w-11 sm:h-7 sm:w-9"
                      onClick={() => move(index, -1)}
                      disabled={busy || index === 0}
                      aria-label={`Move "${offer.text}" up`}
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="inline"
                      className="h-9 w-11 sm:h-7 sm:w-9"
                      onClick={() => move(index, 1)}
                      disabled={busy || index === offers.length - 1}
                      aria-label={`Move "${offer.text}" down`}
                    >
                      <ChevronDown />
                    </Button>
                  </div>

                  {isEditing ? (
                    <div className="min-w-0 flex-1 space-y-1.5 sm:min-w-[14rem]">
                      <Input
                        type="text"
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
                    <p className="min-w-0 flex-1 text-[15px] break-words text-[#1b1917] sm:min-w-[14rem]">
                      {offer.text}
                    </p>
                  )}

                  <div className="flex w-full items-center justify-between gap-3 pl-12 sm:w-auto sm:justify-end sm:pl-0">
                    <Label className="min-h-10 cursor-pointer font-normal">
                      <Switch
                        checked={offer.active}
                        disabled={busy}
                        onCheckedChange={() => toggleActive(offer)}
                        aria-label={`Show "${offer.text}" on the store`}
                      />
                      {offer.active ? 'Shown' : 'Hidden'}
                    </Label>

                    <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            variant="link"
                            className="min-h-10"
                            onClick={saveEdit}
                            disabled={busy || !editing.text.trim()}
                          >
                            Save
                          </Button>
                          <Button type="button" variant="link" className="min-h-10" onClick={() => setEditing(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="link"
                            className="min-h-10"
                            onClick={() => setEditing({ id: offer.id, text: offer.text })}
                            disabled={busy}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="link"
                            className="min-h-10 text-destructive"
                            onClick={() => setPendingDelete(offer)}
                            disabled={busy}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
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
