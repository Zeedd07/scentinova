import { apiRequest } from './apiClient'

export async function adminFetchOrders(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.q) q.set('q', params.q)
  if (params.page) q.set('page', String(params.page))
  const suffix = q.toString() ? `?${q}` : ''
  const data = await apiRequest(`/admin/orders${suffix}`, { auth: true })
  return data.data
}

export async function adminFetchOrder(id) {
  const data = await apiRequest(`/admin/orders/${id}`, { auth: true })
  return data.data.order
}

export async function adminUpdateOrderStatus(id, body) {
  const data = await apiRequest(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body,
    auth: true,
  })
  return data.data.order
}

export async function adminUpdateShipping(id, body) {
  const data = await apiRequest(`/admin/orders/${id}/shipping`, {
    method: 'PATCH',
    body,
    auth: true,
  })
  return data.data.order
}

export async function adminRefundOrder(id, body = {}) {
  const data = await apiRequest(`/admin/orders/${id}/refund`, {
    method: 'POST',
    body,
    auth: true,
  })
  return data.data.order
}
