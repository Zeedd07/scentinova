import { apiRequest, setAccessToken, clearAccessToken } from './apiClient'

export async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  setAccessToken(data.data.accessToken)
  return data.data
}

export async function refreshSession(opts = {}) {
  const data = await apiRequest('/auth/refresh', { method: 'POST', ...opts })
  setAccessToken(data.data.accessToken)
  return data.data
}

export async function logout() {
  try {
    await apiRequest('/auth/logout', { method: 'POST' })
  } finally {
    clearAccessToken()
  }
}

export async function getMe() {
  const data = await apiRequest('/auth/me', { auth: true })
  return data.data.user
}
