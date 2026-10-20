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

export async function adminAnalyticsProducts() {
  const data = await apiRequest('/admin/analytics/products', { auth: true })
  return data.data
}

/** @param {'7d'|'30d'|'90d'|'all'|'custom'| { range: string, from?: string, to?: string }} range */
export async function adminAnalyticsReport(range) {
  const params = new URLSearchParams()
  if (typeof range === 'string') {
    params.set('range', range)
  } else {
    params.set('range', range.range)
    if (range.from) params.set('from', range.from)
    if (range.to) params.set('to', range.to)
  }
  const data = await apiRequest(`/admin/analytics/report?${params}`, { auth: true })
  return data.data
}

export async function adminDashboard() {
  const data = await apiRequest('/admin/dashboard', { auth: true })
  return data.data
}
