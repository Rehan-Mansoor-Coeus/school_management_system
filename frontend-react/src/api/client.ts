import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE || '/api',
  timeout: 30_000,
  headers: {
    Accept: 'application/json',
  },
})

const SESSION_KEYS = [
  'token',
  'me',
  'permissions',
  'enabled_modules',
  'institution',
  'role_type',
  'context_type',
  'acting_as_super_admin',
  'active_institution',
  'active_institution_id',
]

/** Public auth endpoints must never carry a stale institution header (breaks CORS / login). */
function isPublicAuthRequest(url: string): boolean {
  const path = url.split('?')[0] || ''
  return /\/auth\/(login|register|signup|forgot-password|forgot-username)/i.test(path)
    || /\/auth\/signup\//i.test(path)
    || /\/auth\/forgot-password\//i.test(path)
}

function wipeLocalSession() {
  for (const key of SESSION_KEYS) {
    localStorage.removeItem(key)
  }
  delete api.defaults.headers.common['Authorization']
  delete api.defaults.headers.common['X-Active-Institution-Id']
}

function applyAuthHeader(config: { headers?: Record<string, unknown>; url?: string }) {
  const token = localStorage.getItem('token')
  config.headers = config.headers || {}
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const url = String(config.url || '')
  if (isPublicAuthRequest(url)) {
    if (config.headers['X-Active-Institution-Id']) {
      delete config.headers['X-Active-Institution-Id']
    }
    return config
  }

  // Only attach institution scope when explicitly acting as a school (not a stale id).
  let actingAs = false
  try {
    actingAs = JSON.parse(localStorage.getItem('acting_as_super_admin') || 'false') === true
  } catch {
    actingAs = localStorage.getItem('acting_as_super_admin') === 'true'
  }
  const activeInstitutionId = localStorage.getItem('active_institution_id')
  if (actingAs && activeInstitutionId && activeInstitutionId !== 'null') {
    config.headers['X-Active-Institution-Id'] = activeInstitutionId
  } else if (config.headers['X-Active-Institution-Id']) {
    delete config.headers['X-Active-Institution-Id']
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
      !isPublicAuthRequest(url)

    if (isSessionExpired) {
      // Full wipe — leaving active_institution_id causes CORS/login failures next time.
      wipeLocalSession()

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
