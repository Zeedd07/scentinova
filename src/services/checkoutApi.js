import { apiRequest } from './apiClient'

export async function quoteCheckout(payload) {
  const data = await apiRequest('/checkout/quote', {
    method: 'POST',
    body: payload,
  })
  return data.data
}

export async function createPaymentOrder(payload, { idempotencyKey } = {}) {
  const data = await apiRequest('/checkout/create-payment-order', {
    method: 'POST',
    body: payload,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
  })
  return data.data
}

export async function verifyPayment(payload) {
  const data = await apiRequest('/payments/verify', {
    method: 'POST',
    body: payload,
  })
  return data.data
}

export async function reportPaymentFailed(payload) {
  const data = await apiRequest('/payments/failed', {
    method: 'POST',
    body: payload,
  })
  return data.data.order
}

export async function fetchOrderConfirmation(orderNumber, token) {
  const q = token ? `?token=${encodeURIComponent(token)}` : ''
  const data = await apiRequest(`/orders/confirmation/${orderNumber}${q}`)
  return data.data.order
}

export async function trackOrder(token) {
  const data = await apiRequest(`/orders/track/${encodeURIComponent(token)}`)
  return data.data.order
}
