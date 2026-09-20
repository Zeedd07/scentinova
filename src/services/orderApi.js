import { apiRequest } from './apiClient'

export async function createOrder(payload) {
  const data = await apiRequest('/orders', {
    method: 'POST',
    body: payload,
  })
  return data.data.order
}

export async function adminFetchOrders() {
  const data = await apiRequest('/admin/orders', { auth: true })
  return data.data.orders
}

export async function adminFetchOrder(id) {
  const data = await apiRequest(`/admin/orders/${id}`, { auth: true })
  return data.data.order
}

export async function adminUpdateOrderStatus(id, status) {
  const data = await apiRequest(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: { status },
    auth: true,
  })
  return data.data.order
}
