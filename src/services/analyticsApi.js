import { apiRequest } from './apiClient'

const SESSION_KEY = 'scentinova-analytics-session'

export function getAnalyticsSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = `sess_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

export async function trackEvent(type, { productId, metadata } = {}) {
  return apiRequest('/analytics/events', {
    method: 'POST',
    body: {
      type,
      productId: productId || null,
      sessionId: getAnalyticsSessionId(),
      metadata: metadata || {},
    },
  })
}

export async function adminAnalyticsOverview() {
  const data = await apiRequest('/admin/analytics/overview', { auth: true })
  return data.data
}

export async function adminAnalyticsProducts() {
  const data = await apiRequest('/admin/analytics/products', { auth: true })
  return data.data
}

export async function adminDashboard() {
  const data = await apiRequest('/admin/dashboard', { auth: true })
  return data.data
}
