import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE || '/api',
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
  },
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

let redirectingToLogin = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const url = String(error?.config?.url || '')
    const hasResponse = Boolean(error?.response)

    const message = String(error?.response?.data?.message || '')
    const isSessionExpired =
      hasResponse &&
      status === 401 &&
      (!message || /unauthenticated/i.test(message)) &&
      !url.includes('/auth/login')

    if (isSessionExpired) {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']

      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin') && !redirectingToLogin) {
        redirectingToLogin = true
        window.location.href = '/admin?session=expired'
      }
    }

    return Promise.reject(error)
  },
)

const existingToken = localStorage.getItem('token')
if (existingToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`
}

export default api
