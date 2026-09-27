/**
 * Optional image per fragrance note. Notes stay plain strings; this edits the
 * product-level overrides (`noteImages`) on top of global library defaults.
 */
import { useEffect, useMemo, useState } from 'react'
import MediaPickerModal from './MediaPickerModal'
import MediaUploadModal from './MediaUploadModal'
import PromptPanel from './PromptPanel'
import { generateNotePrompt, getNoteDefaults } from '../../services/mediaApi'
import { NOTE_TIERS, defaultAltText, normalizeNoteKey } from '../../lib/media'

function Thumb({ asset, alt }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => setBroken(false), [asset?.id])
  if (!asset || broken) {
    return (
      <span
        aria-hidden="true"
        className="flex h-14 w-14 shrink-0 items-center justify-center border border-dashed border-stone bg-cream text-[10px] text-muted"
      >
        {broken ? 'Error' : 'None'}
      </span>
    )
  }
  return (
    <img
      src={asset.thumbUrl}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-14 w-14 shrink-0 border border-stone bg-cream object-cover"
    />
  )
}

export default function NoteImageEditor({ notes, noteImages, onChange, initialMedia }) {
  const [assets, setAssets] = useState(() => initialMedia?.noteAssets || {})
  const [defaults, setDefaults] = useState(() => initialMedia?.noteDefaults || {})
  const [checkedKeys, setCheckedKeys] = useState(() => new Set(Object.keys(initialMedia?.noteDefaults || {})))
  const [open, setOpen] = useState(null)
  const [picker, setPicker] = useState(null)
  const [uploader, setUploader] = useState(null)

  const rows = useMemo(
    () =>
      NOTE_TIERS.map(({ tier, key, label }) => ({
        tier,
        label,
        notes: (notes[key] || []).map((name) => ({ name, noteKey: normalizeNoteKey(name) })).filter((n) => n.noteKey),
      })),
    [notes],
  )

  const allKeys = useMemo(() => [...new Set(rows.flatMap((r) => r.notes.map((n) => n.noteKey)))], [rows])

  // Look up global defaults for notes typed since the product was loaded.
  useEffect(() => {
    const missing = allKeys.filter((k) => !checkedKeys.has(k))
    if (!missing.length) return undefined
    const controller = new AbortController()
    const t = setTimeout(() => {
      getNoteDefaults(missing, { signal: controller.signal })
        .then((found) => {
          setDefaults((d) => ({ ...d, ...found }))
          setCheckedKeys((s) => new Set([...s, ...missing]))
        })
        .catch(() => {})
    }, 500)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [allKeys, checkedKeys])

  const findEntry = (tier, noteKey) => noteImages.find((e) => e.tier === tier && e.noteKey === noteKey)

  const setEntry = (tier, noteKey, patch) => {
    const current = findEntry(tier, noteKey) || { tier, noteKey, assetId: null, alt: null, hideImage: false }
    const next = { ...current, ...patch }
    const rest = noteImages.filter((e) => !(e.tier === tier && e.noteKey === noteKey))
    const keep = next.assetId || next.hideImage || (next.alt && next.alt.trim())
    onChange(keep ? [...rest, next] : rest)
  }

  const applyAsset = (target, asset) => {
    setAssets((a) => ({ ...a, [asset.id]: asset }))
    if (asset.isDefault && asset.noteKey) setDefaults((d) => ({ ...d, [asset.noteKey]: asset }))
    setEntry(target.tier, target.noteKey, { assetId: asset.id, hideImage: false })
  }

  const totalNotes = rows.reduce((n, r) => n + r.notes.length, 0)

  return (
    <div className="space-y-5">
      <div>
        <span className="admin-label">Note images (optional)</span>
        <p className="mt-1 text-[13px] admin-muted">
          Notes without an image keep the text-only layout. Images come from the shared library, so one
          upload can serve every perfume that uses the note. Removing an image here never deletes it from
          Cloudinary.
        </p>
      </div>

      {totalNotes === 0 && (
        <p className="border border-dashed border-stone px-4 py-6 text-center text-[14px] admin-muted">
          Add top, heart or base notes above to attach images.
        </p>
      )}

      {rows.map(
        (row) =>
          row.notes.length > 0 && (
            <div key={row.tier}>
              <p className="text-[11px] font-medium tracking-[0.25em] text-scent-red uppercase">{row.label}</p>
              <ul className="mt-2 divide-y divide-stone border border-stone bg-white/60">
                {row.notes.map(({ name, noteKey }, i) => {
                  const entry = findEntry(row.tier, noteKey)
                  const override = entry?.assetId ? assets[entry.assetId] : null
                  const fallback = defaults[noteKey] || null
                  const shown = entry?.assetId ? override : entry?.hideImage ? null : fallback
                  const alt = entry?.alt || shown?.altText || defaultAltText('NOTE', name)
                  const rowId = `${row.tier}:${noteKey}:${i}`
                  const expanded = open === rowId

                  let status = 'No image · text only'
                  if (entry?.assetId) status = override ? `Custom image · ${override.name}` : 'Custom image'
                  else if (entry?.hideImage) status = 'Library default hidden on this perfume'
                  else if (fallback) status = `Library default · ${fallback.name}`

                  return (
                    <li key={rowId} className="p-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Thumb asset={shown} alt={alt} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] text-charcoal">{name}</p>
                          <p className="truncate text-[12px] admin-muted">{status}</p>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
                          <button type="button" className="admin-link" onClick={() => setUploader({ tier: row.tier, noteKey, name })}>
                            Upload
                          </button>
                          <button type="button" className="admin-link" onClick={() => setPicker({ tier: row.tier, noteKey, name })}>
                            Library
                          </button>
                          {entry?.assetId && (
                            <button
                              type="button"
                              className="admin-link"
                              onClick={() => setEntry(row.tier, noteKey, { assetId: null })}
                            >
                              {fallback && fallback.id !== entry.assetId ? 'Use default' : 'Remove'}
                            </button>
                          )}
                          {!entry?.assetId && fallback && (
                            <button
                              type="button"
                              className="admin-link"
                              onClick={() => setEntry(row.tier, noteKey, { hideImage: !entry?.hideImage })}
                            >
                              {entry?.hideImage ? 'Show default' : 'Hide'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="admin-link"
                            aria-expanded={expanded}
                            onClick={() => setOpen(expanded ? null : rowId)}
                          >
                            {expanded ? 'Close' : 'Alt & prompt'}
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="mt-3 space-y-3">
                          <label className="block">
                            <span className="admin-label">Alt text on this perfume</span>
                            <input
                              className="admin-input"
                              maxLength={200}
                              placeholder={shown?.altText || defaultAltText('NOTE', name)}
                              value={entry?.alt || ''}
                              onChange={(e) => setEntry(row.tier, noteKey, { alt: e.target.value || null })}
                            />
                          </label>
                          <PromptPanel
                            label={`Prompt for ${name}`}
                            hint="Builds a consistent 1:1 note image prompt from the note family and brand palette."
                            generate={() => generateNotePrompt({ noteName: name, tier: row.tier, aspectRatio: '1:1' })}
                          />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ),
      )}

      <MediaPickerModal
        open={Boolean(picker)}
        type="NOTE"
        title={picker ? `Select image for ${picker.name}` : 'Select note image'}
        initialSearch={picker?.name || ''}
        selectedId={picker ? findEntry(picker.tier, picker.noteKey)?.assetId : null}
        onClose={() => setPicker(null)}
        onSelect={(asset) => {
          applyAsset(picker, asset)
          setPicker(null)
        }}
      />

      <MediaUploadModal
        open={Boolean(uploader)}
        type="NOTE"
        defaultName={uploader?.name || ''}
        onClose={() => setUploader(null)}
        onUploaded={(asset) => {
          applyAsset(uploader, asset)
          setUploader(null)
        }}
      />
    </div>
  )
}
