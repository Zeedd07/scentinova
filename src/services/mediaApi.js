import { apiRequest, apiUpload } from './apiClient'

export async function listMedia({ page = 1, limit = 24, search, type, category, signal } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search?.trim()) params.set('search', search.trim())
  if (type) params.set('type', type)
  if (category) params.set('category', category)
  const data = await apiRequest(`/admin/media?${params}`, { auth: true, signal })
  return { assets: data.data.assets, meta: data.meta }
}

export async function getMedia(id) {
  const data = await apiRequest(`/admin/media/${id}`, { auth: true })
  return data.data
}

export async function getNoteDefaults(keys, { signal } = {}) {
  if (!keys.length) return {}
  const qs = new URLSearchParams({ keys: keys.join(',') })
  const data = await apiRequest(`/admin/media/note-defaults?${qs}`, { auth: true, signal })
  return data.data.defaults
}

/** Upload through the backend (Cloudinary credentials never reach the browser). */
export async function uploadMedia(file, { type, name, category, altText, tags, makeDefault, onProgress } = {}) {
  const formData = new FormData()
  formData.append('type', type)
  formData.append('name', name)
  if (category) formData.append('category', category)
  if (altText) formData.append('altText', altText)
  if (tags) formData.append('tags', tags)
  if (makeDefault) formData.append('makeDefault', 'true')
  formData.append('image', file)
  const data = await apiUpload('/admin/media/upload', formData, { auth: true, onProgress })
  return data.data.asset
}

export async function updateMedia(id, patch) {
  const data = await apiRequest(`/admin/media/${id}`, { method: 'PATCH', body: patch, auth: true })
  return data.data.asset
}

export async function deleteMedia(id) {
  const data = await apiRequest(`/admin/media/${id}`, { method: 'DELETE', auth: true })
  return data.data
}

export async function generateNotePrompt(input) {
  const data = await apiRequest('/admin/prompts/note', { method: 'POST', body: input, auth: true })
  return data.data
}
