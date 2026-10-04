import { apiRequest } from './apiClient'

/** Active announcement-bar offers, in display order: [{ id, text }]. */
export async function fetchOffers({ signal } = {}) {
  const data = await apiRequest('/offers', { signal })
  return Array.isArray(data?.data?.offers) ? data.data.offers : []
}
