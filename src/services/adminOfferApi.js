import { apiRequest } from './apiClient'

export async function adminFetchOffers() {
  const data = await apiRequest('/admin/offers', { auth: true })
  return data.data.offers
}

export async function adminCreateOffer(body) {
  const data = await apiRequest('/admin/offers', { method: 'POST', body, auth: true })
  return data.data.offer
}

export async function adminUpdateOffer(id, body) {
  const data = await apiRequest(`/admin/offers/${id}`, { method: 'PATCH', body, auth: true })
  return data.data.offer
}

export async function adminDeleteOffer(id) {
  const data = await apiRequest(`/admin/offers/${id}`, { method: 'DELETE', auth: true })
  return data.data
}

export async function adminReorderOffers(ids) {
  const data = await apiRequest('/admin/offers/order', {
    method: 'PUT',
    body: { ids },
    auth: true,
  })
  return data.data.offers
}
