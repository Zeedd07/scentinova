/**
 * Indian states / union territories and their cities for the checkout address form.
 * Source of truth: @countrystatecity/countries-browser. Its India files are copied to
 * /geo at build time (scripts/copy-india-geo.mjs), so nothing is fetched from a CDN.
 */
import { configure, getCitiesOfState, getStatesOfCountry } from '@countrystatecity/countries-browser'

configure({ baseURL: '/geo', timeout: 10000 })

const COUNTRY = 'IN'
export const COUNTRY_NAME = 'India'

// Administrative divisions in the dataset, not cities. Mirrored in the backend.
const NOT_A_CITY = / Division$/i

const collator = new Intl.Collator('en', { sensitivity: 'base' })

export const normalizeText = (text) => String(text ?? '').trim().replace(/\s+/g, ' ').toLowerCase()

let statesPromise = null
const cityPromises = new Map()

/** Resolves to [{ name, code }] sorted by name. Cached; a failed load can be retried. */
export function loadIndiaStates() {
  if (!statesPromise) {
    statesPromise = getStatesOfCountry(COUNTRY)
      .then((states) => {
        // The package resolves [] instead of throwing when the file can't be fetched.
        if (!states.length) throw new Error('Could not load states.')
        return states
          .map((s) => ({ name: s.name, code: s.iso2 }))
          .sort((a, b) => collator.compare(a.name, b.name))
      })
      .catch((err) => {
        statesPromise = null
        throw err
      })
  }
  return statesPromise
}

/** Resolves to the sorted city names of one state. Cached per state. */
export function loadIndiaCities(stateCode) {
  if (!stateCode) return Promise.resolve([])
  if (!cityPromises.has(stateCode)) {
    const promise = getCitiesOfState(COUNTRY, stateCode)
      .then((cities) => {
        if (!cities.length) throw new Error('Could not load cities.')
        const names = new Set()
        for (const c of cities) {
          const name = c.name.trim()
          if (name && !NOT_A_CITY.test(name)) names.add(name)
        }
        return [...names].sort(collator.compare)
      })
      .catch((err) => {
        cityPromises.delete(stateCode)
        throw err
      })
    cityPromises.set(stateCode, promise)
  }
  return cityPromises.get(stateCode)
}

/**
 * Options matching `query`, best first: exact, prefix, word prefix, then substring.
 * `getLabel` maps an option to its display text.
 */
export function rankMatches(options, query, { limit = 100, getLabel = (o) => o } = {}) {
  const q = normalizeText(query)
  if (!q) return options.slice(0, limit)
  const buckets = [[], [], [], []]
  for (const option of options) {
    const label = normalizeText(getLabel(option))
    if (label === q) buckets[0].push(option)
    else if (label.startsWith(q)) buckets[1].push(option)
    else if (label.split(/[\s(-]+/).some((word) => word.startsWith(q))) buckets[2].push(option)
    else if (label.includes(q)) buckets[3].push(option)
  }
  return buckets.flat().slice(0, limit)
}

/** Exact case-insensitive match on the label (or any of `getAliases`), else null. */
export function findOption(options, text, { getLabel = (o) => o, getAliases = () => [] } = {}) {
  const q = normalizeText(text)
  if (!q) return null
  return (
    options.find(
      (o) => normalizeText(getLabel(o)) === q || getAliases(o).some((a) => normalizeText(a) === q),
    ) || null
  )
}
