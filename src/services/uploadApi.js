import { apiRequest, apiUpload } from './apiClient'

export async function getUploadStatus() {
  const data = await apiRequest('/admin/uploads/status', { auth: true })
  return data.data
}

/**
 * Upload a product image to Cloudinary via the admin API.
 * @returns Cloudinary payload: url, secure_url, public_id, width, height, format, bytes
 */
export async function uploadAdminImage(file, { slug, role = 'primary', onProgress } = {}) {
  const formData = new FormData()
  formData.append('image', file)
  if (slug) formData.append('slug', slug)
  formData.append('role', role)

  const data = await apiUpload('/admin/uploads/image', formData, {
    auth: true,
    onProgress,
  })
  return data.data.image
}

/**
 * Upload a product video to Cloudinary via the admin API.
 * @returns { publicId, url, posterUrl, width, height, duration, bytes }
 */
export async function uploadAdminVideo(file, { slug, onProgress } = {}) {
  const formData = new FormData()
  if (slug) formData.append('slug', slug)
  formData.append('video', file)

  const data = await apiUpload('/admin/uploads/video', formData, {
    auth: true,
    onProgress,
  })
  return data.data.video
}
