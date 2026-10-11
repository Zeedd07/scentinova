import { apiRequest } from './apiClient'

export async function adminFetchSales() {
  const data = await apiRequest('/admin/sales', { auth: true })
  return data.data.sales
}

export async function adminCreateSale(body) {
  const data = await apiRequest('/admin/sales', { method: 'POST', body, auth: true })
  return data.data.sale
}

export async function adminUpdateSale(id, body) {
  const data = await apiRequest(`/admin/sales/${id}`, { method: 'PATCH', body, auth: true })
  return data.data.sale
}

export async function adminDeleteSale(id) {
  const data = await apiRequest(`/admin/sales/${id}`, { method: 'DELETE', auth: true })
  return data.data
}
