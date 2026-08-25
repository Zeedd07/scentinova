/**
 * Scroll / video story beats — synced to the ~10s frame sequence (240 @ 24fps).
 * `from`/`to` are progress 0–1 (desktop scrub or video currentTime/duration).
 */
export const STORY_CHAPTERS = [
  {
    id: 'flacon',
    from: 0,
    to: 0.12,
    eyebrow: 'The Bottle',
    title: 'The flacon',
    body: 'Rectangular dark glass. A gold cap sealed like a vow — weight in the hand, silence in the room.',
    note: null,
  },
  {
    id: 'approach',
    from: 0.12,
    to: 0.3,
    eyebrow: 'The Bottle',
    title: 'Closer',
    body: 'The camera finds the nozzle. Ground glass meets gold. The first breath waits inside.',
    note: null,
  },
  {
    id: 'release',
    from: 0.3,
    to: 0.55,
    eyebrow: 'The Scent',
    title: 'The release',
    body: 'Mist blooms. Gold dust hangs in the air — bergamot lifts like dawn through a shutter.',
    note: 'Bergamot',
  },
  {
    id: 'ribbons',
    from: 0.55,
    to: 0.78,
    eyebrow: 'The Scent',
    title: 'Liquid memory',
    body: 'Amber ribbons coil through shadow. Oud settles low — smoked wood, velvet, lasting.',
    note: 'Amber · Oud',
  },
  {
    id: 'settle',
    from: 0.78,
    to: 1.01,
    eyebrow: 'Aurum',
    title: 'It settles',
    body: 'The bottle returns. Not perfume — a private hour in gold, worn long after the spray fades.',
    note: 'Eau de Parfum',
  },
]

/** Resolve active chapter from 0–1 progress. */
export function chapterAt(progress) {
  const p = Math.max(0, Math.min(1, progress))
  return (
    STORY_CHAPTERS.find((c) => p >= c.from && p < c.to) ??
    STORY_CHAPTERS[STORY_CHAPTERS.length - 1]
  )
}
