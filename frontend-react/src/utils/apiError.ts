type ApiErrorLike = {
  response?: { status?: number; statusText?: string; data?: unknown }
  message?: string
  code?: string
  config?: { url?: string; baseURL?: string; method?: string }
}

export function formatApiError(error: unknown, fallback = 'Request failed'): string {
  const err = error as ApiErrorLike
  const data = err.response?.data

  if (data && typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>

    if (record.errors && typeof record.errors === 'object') {
      const parts = Object.values(record.errors as Record<string, string[]>)
        .flat()
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      if (parts.length) {
        return parts.join(' ')
      }
    }

    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message.trim()
    }

    if (typeof record.error === 'string' && record.error.trim()) {
      return record.error.trim()
    }
  }

  if (typeof data === 'string' && data.trim()) {
    const text = data.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    if (text) {
      return text.length > 280 ? `${text.slice(0, 280)}…` : text
    }
  }

  const status = err.response?.status
  if (status) {
    if (status === 401) {
      return 'Invalid credentials.'
    }
    if (status === 403) {
      return 'You do not have permission to sign in.'
    }
    if (status === 422) {
      return 'Please check your input and try again.'
    }
    if (status === 429) {
      return 'Too many login attempts. Please wait and try again.'
    }
    if (status >= 500) {
      return `Server error (${status}). Check the Laravel log for details.`
    }

    return `Request failed (${status}${err.response?.statusText ? `: ${err.response.statusText}` : ''}).`
  }

  if (!err.response) {
    const apiBase = err.config?.baseURL
      || (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE
      || 'http://localhost:8000/api'
    const path = err.config?.url || ''
    const target = `${apiBase.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`

    if (err.code === 'ECONNABORTED') {
      return `Request timed out while contacting ${target}.`
    }

    return `Cannot reach ${target}. Check that Laravel is running, VITE_API_BASE is correct, and CORS allows this site.`
  }

  return err.message?.trim() || fallback
}
