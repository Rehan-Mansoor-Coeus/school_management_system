import api from '../api/client'

export function backendBaseUrl() {
  const configuredBase = (api.defaults.baseURL || '').toString().trim()
  const envBase = ((import.meta as any).env?.VITE_API_BASE || '').toString().trim()
  const fallback = 'http://localhost:8000'

  const source = configuredBase || envBase
  if (!source) return fallback

  if (source.startsWith('/')) return fallback

  try {
    const parsed = new URL(source)
    const base = `${parsed.protocol}//${parsed.host}`
    return parsed.pathname.endsWith('/api') ? base : `${base}${parsed.pathname}`.replace(/\/$/, '')
  } catch {
    return fallback
  }
}

/** Resolve a storage path or URL to the backend host (same origin as VITE_API_BASE). */
export function publicFileUrl(path?: string | null) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const parsed = new URL(path)
      if (parsed.pathname.startsWith('/storage/')) {
        return `${backendBaseUrl()}${parsed.pathname}`
      }
      return path
    } catch {
      return path
    }
  }
  if (path.startsWith('/storage/')) return `${backendBaseUrl()}${path}`
  if (path.startsWith('storage/')) return `${backendBaseUrl()}/${path}`
  return `${backendBaseUrl()}/storage/${path}`
}
