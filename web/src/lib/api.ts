import axios from 'axios'

const TOKEN_KEY = 'cilikube_token'
const CLUSTER_KEY = 'cilikube_cluster'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export const getClusterId = () => localStorage.getItem(CLUSTER_KEY) || ''
export const setClusterId = (id: string) => localStorage.setItem(CLUSTER_KEY, id)

export const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_API || '',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const clusterId = getClusterId()
  const url = config.url || ''
  const needsCluster =
    url.includes('/api/v1/') &&
    !url.includes('/auth/') &&
    !url.includes('/clusters') &&
    !url.includes('/admin/') &&
    !url.includes('/audit/') &&
    !url.includes('/settings/') &&
    !url.includes('/profile') &&
    !url.includes('/environments') &&
    !url.includes('/me/access')

  if (clusterId && needsCluster) {
    config.params = { ...config.params, clusterId }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    // Axios rejects before the envelope check below, so without this every failure
    // surfaces as "Request failed with status code NNN" and the server's reason is lost.
    const body = error.response?.data
    if (body && typeof body === 'object') {
      const message = (body as { message?: string }).message
      const details = (body as { details?: string }).details
      const combined = [message, details].filter(Boolean).join(': ')
      if (combined) error.message = combined
    }
    return Promise.reject(error)
  },
)

export type ApiEnvelope<T> = {
  code: number
  data: T
  message: string
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const res = await api.get<ApiEnvelope<T>>(url, { params })
  if (res.data.code !== 0 && res.data.code !== 200) {
    throw new Error(res.data.message || 'Request failed')
  }
  return res.data.data
}

export async function apiPost<T>(url: string, data?: unknown) {
  const res = await api.post<ApiEnvelope<T>>(url, data)
  if (res.data.code !== 0 && res.data.code !== 200) {
    throw new Error(res.data.message || 'Request failed')
  }
  return res.data.data
}

export async function apiDelete<T>(url: string) {
  const res = await api.delete<ApiEnvelope<T>>(url)
  if (res.data.code !== 0 && res.data.code !== 200) {
    throw new Error(res.data.message || 'Request failed')
  }
  return res.data.data
}

export async function apiPatch<T>(url: string, data?: unknown) {
  const res = await api.patch<ApiEnvelope<T>>(url, data)
  if (res.data.code !== 0 && res.data.code !== 200) {
    throw new Error(res.data.message || 'Request failed')
  }
  return res.data.data
}

export async function apiPut<T>(url: string, data?: unknown) {
  const res = await api.put<ApiEnvelope<T>>(url, data)
  if (res.data.code !== 0 && res.data.code !== 200) {
    throw new Error(res.data.message || 'Request failed')
  }
  return res.data.data
}
