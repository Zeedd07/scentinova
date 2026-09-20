import { apiRequest } from './apiClient'

export async function subscribeNewsletter(email) {
  const data = await apiRequest('/newsletter/subscribe', {
    method: 'POST',
    body: { email },
  })
  return data.data
}
