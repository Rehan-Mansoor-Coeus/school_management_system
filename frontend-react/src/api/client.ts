import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000/api',
})

function applyAuthHeader(config: { headers?: Record<string, unknown> }) {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

api.interceptors.request.use((config) => applyAuthHeader(config))

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = String(error?.config?.url || '')

    if (status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']

      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const params = new URLSearchParams(window.location.search)
        if (params.get('session') !== 'expired') {
          window.location.href = '/login?session=expired'
        }
      }
    }

    // Do not redirect or clear session on 429 — let the caller handle it

    return Promise.reject(error)
  },
)

const existingToken = localStorage.getItem('token')
if (existingToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`
}

export default api
