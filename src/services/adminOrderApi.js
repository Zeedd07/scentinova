import { apiRequest } from './apiClient'

export async function adminFetchOrders(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.method) q.set('method', params.method)
  if (params.product) q.set('product', params.product)
  if (params.sort) q.set('sort', params.sort)
  if (params.q) q.set('q', params.q)
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
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

export async function adminMarkCodPaid(id, body = {}) {
  const data = await apiRequest(`/admin/orders/${id}/mark-cod-paid`, {
    method: 'POST',
    body,
    auth: true,
  })
  return data.data.order
}
