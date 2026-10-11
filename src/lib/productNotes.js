/**
 * Fragrance notes in the admin form: one `{ id, text }` row per input, string arrays on the API.
 */

export const MAX_NOTES_PER_TIER = 30

let nextId = 0
export function noteRow(text = '') {
  nextId += 1
  return { id: `note-${nextId}`, text }
}

/** Rows for the form from stored notes; always at least one (empty) input. */
export function notesToRows(notes) {
  const list = Array.isArray(notes)
    ? notes
    : String(notes || '')
        .split(',')
        .map((n) => n.trim())
  const rows = list.filter(Boolean).map((n) => noteRow(String(n)))
  return rows.length ? rows : [noteRow()]
}

/** Trimmed, non-empty notes without case-insensitive duplicates. */
export function rowsToNotes(rows) {
  const seen = new Set()
  const out = []
  for (const row of rows || []) {
    const text = row.text.trim().replace(/\s+/g, ' ')
    const key = text.toLowerCase()
    if (!text || seen.has(key)) continue
    seen.add(key)
    out.push(text)
  }
  return out
}
