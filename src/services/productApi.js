import { apiRequest } from './apiClient'

export async function fetchProducts(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const data = await apiRequest(`/products${qs ? `?${qs}` : ''}`)
  return { products: data.data.products, meta: data.meta }
}

export async function fetchFeaturedProducts() {
  const data = await apiRequest('/products/featured')
  return data.data.products
}

export async function fetchProductBySlug(slug) {
  const data = await apiRequest(`/products/${encodeURIComponent(slug)}`)
  return data.data.product
}

export async function adminFetchProducts() {
  const data = await apiRequest('/admin/products?limit=100', { auth: true })
  return data.data.products
}

export async function adminFetchProduct(id) {
  const data = await apiRequest(`/admin/products/${id}`, { auth: true })
  return data.data.product
}

export async function adminCreateProduct(payload) {
  const data = await apiRequest('/admin/products', {
    method: 'POST',
    body: payload,
    auth: true,
  })
  return data.data.product
}

export async function adminUpdateProduct(id, payload) {
  const data = await apiRequest(`/admin/products/${id}`, {
    method: 'PATCH',
    body: payload,
    auth: true,
  })
  return data.data.product
}

export async function adminDeleteProduct(id) {
  const data = await apiRequest(`/admin/products/${id}`, {
    method: 'DELETE',
    auth: true,
  })
  return data.data
}

export { uploadAdminImage, getUploadStatus } from './uploadApi'
