const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

let accessToken = null
let refreshPromise = null

export function setAccessToken(token) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export function clearAccessToken() {
  accessToken = null
}

export class ApiClientError extends Error {
  constructor(message, { code, status, fields } = {}) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code || 'API_ERROR'
    this.status = status || 500
    this.fields = fields || null
  }
}

async function parseBody(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const body = await parseBody(res)
      if (!res.ok || !body?.success) {
        clearAccessToken()
        throw new ApiClientError(
          body?.error?.message || 'Your admin session has expired. Please sign in again.',
          { code: body?.error?.code || 'UNAUTHORIZED', status: res.status },
        )
      }
      setAccessToken(body.data.accessToken)
      return body.data
    })().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export async function apiRequest(
  path,
  { method = 'GET', body, auth = false, retry = true, headers = {} } = {},
) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  const opts = {
    method,
    credentials: 'include',
    headers: {
      ...(!isFormData && body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...headers,
    },
  }

  if (body !== undefined) {
    opts.body = isFormData ? body : JSON.stringify(body)
  }

  if (auth && accessToken) {
    opts.headers.Authorization = `Bearer ${accessToken}`
  }

  let res
  try {
    res = await fetch(`${API_URL}${path}`, opts)
  } catch {
    throw new ApiClientError(
      'The Scentinova service is temporarily unavailable. Please try again.',
      { code: 'NETWORK_ERROR', status: 0 },
    )
  }

  if (res.status === 401 && auth && retry) {
    try {
      await refreshAccessToken()
      return apiRequest(path, { method, body, auth, retry: false, headers })
    } catch (err) {
      throw err
    }
  }

  const data = await parseBody(res)
  if (!res.ok || data?.success === false) {
    throw new ApiClientError(
      data?.error?.message || 'Something went wrong. Please try again.',
      {
        code: data?.error?.code || 'API_ERROR',
        status: res.status,
        fields: data?.error?.fields || null,
      },
    )
  }

  return data
}

/**
 * Multipart upload with optional XMLHttpRequest progress callback (0–100).
 */
export function apiUpload(path, formData, { auth = true, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}${path}`)
    xhr.withCredentials = true
    if (auth && accessToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
    }

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    }

    xhr.onload = () => {
      let data = null
      try {
        data = JSON.parse(xhr.responseText || 'null')
      } catch {
        data = null
      }

      if (xhr.status === 401 && auth) {
        refreshAccessToken()
          .then(() => apiUpload(path, formData, { auth, onProgress }))
          .then(resolve)
          .catch(reject)
        return
      }

      if (xhr.status < 200 || xhr.status >= 300 || data?.success === false) {
        reject(
          new ApiClientError(
            data?.error?.message || 'Upload failed. Please try again.',
            {
              code: data?.error?.code || 'UPLOAD_FAILED',
              status: xhr.status,
              fields: data?.error?.fields || null,
            },
          ),
        )
        return
      }
      resolve(data)
    }

    xhr.onerror = () => {
      reject(
        new ApiClientError(
          'The Scentinova service is temporarily unavailable. Please try again.',
          { code: 'NETWORK_ERROR', status: 0 },
        ),
      )
    }

    xhr.send(formData)
  })
}

export { API_URL }
