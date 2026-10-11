/**
 * Admin product form - one input per note for a tier (top / heart / base).
 * Enter adds a note below, Backspace on an empty note removes it, and pasting
 * "Rose, Amber" splits into separate notes.
 */
import { useEffect, useRef } from 'react'
import { MAX_NOTES_PER_TIER, noteRow } from '../../lib/productNotes'

function RemoveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function NoteListEditor({ id, label, noun, placeholder, rows, onChange }) {
  const inputs = useRef(new Map())
  const focusId = useRef(null)

  useEffect(() => {
    if (!focusId.current) return
    inputs.current.get(focusId.current)?.focus()
    focusId.current = null
  }, [rows])

  const full = rows.length >= MAX_NOTES_PER_TIER

  const update = (rowId, text) =>
    onChange(rows.map((r) => (r.id === rowId ? { ...r, text } : r)))

  const insertAfter = (index, texts = ['']) => {
    const room = MAX_NOTES_PER_TIER - rows.length
    if (room <= 0) return
    const added = texts.slice(0, room).map((t) => noteRow(t))
    focusId.current = added[added.length - 1].id
    onChange([...rows.slice(0, index + 1), ...added, ...rows.slice(index + 1)])
  }

  const remove = (index) => {
    const next = rows.filter((_, i) => i !== index)
    const neighbour = next[Math.max(0, index - 1)]
    if (!next.length) {
      const blank = noteRow()
      focusId.current = blank.id
      onChange([blank])
      return
    }
    focusId.current = neighbour.id
    onChange(next)
  }

  const onKeyDown = (e, index, row) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (row.text.trim()) insertAfter(index)
    } else if (e.key === 'Backspace' && !row.text && rows.length > 1) {
      e.preventDefault()
      remove(index)
    }
  }

  const onPaste = (e, index, row) => {
    const pasted = e.clipboardData.getData('text')
    if (!/[,\n]/.test(pasted)) return
    const parts = pasted
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean)
    if (!parts.length) return
    e.preventDefault()
    const [first, ...rest] = parts
    const merged = row.text.trim() ? `${row.text.trim()} ${first}` : first
    const next = rows.map((r) => (r.id === row.id ? { ...r, text: merged } : r))
    const room = MAX_NOTES_PER_TIER - next.length
    const added = rest.slice(0, Math.max(room, 0)).map((t) => noteRow(t))
    if (added.length) focusId.current = added[added.length - 1].id
    onChange([...next.slice(0, index + 1), ...added, ...next.slice(index + 1)])
  }

  return (
    <fieldset className="min-w-0">
      <legend className="admin-label">{label}</legend>
      <ul className="mt-1.5 space-y-2">
        {rows.map((row, index) => (
          <li key={row.id} className="flex items-stretch gap-2">
            <input
              ref={(el) => {
                if (el) inputs.current.set(row.id, el)
                else inputs.current.delete(row.id)
              }}
              id={index === 0 ? id : undefined}
              className="admin-input"
              style={{ marginTop: 0 }}
              placeholder={index === 0 ? placeholder : `${noun} ${index + 1}`}
              aria-label={`${label}: note ${index + 1} of ${rows.length}`}
              value={row.text}
              maxLength={60}
              onChange={(e) => update(row.id, e.target.value)}
              onKeyDown={(e) => onKeyDown(e, index, row)}
              onPaste={(e) => onPaste(e, index, row)}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              disabled={rows.length === 1 && !row.text}
              className="flex w-11 shrink-0 items-center justify-center border border-[#e0d6c4] bg-[#fffcf7] text-[#4a4136] transition-colors hover:border-[#6e1118] hover:text-[#6e1118] disabled:opacity-30 disabled:hover:border-[#e0d6c4] disabled:hover:text-[#4a4136]"
              aria-label={`Remove ${row.text.trim() || `${noun.toLowerCase()} ${index + 1}`}`}
            >
              <RemoveIcon />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="admin-link mt-2 text-[14px]"
        onClick={() => insertAfter(rows.length - 1)}
        disabled={full}
      >
        + Add {noun.toLowerCase()}
      </button>
      {full && (
        <p className="mt-1 text-[12px] admin-muted">Up to {MAX_NOTES_PER_TIER} notes.</p>
      )}
    </fieldset>
  )
}
