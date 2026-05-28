import api from '../../api/client'
import type { Institution } from './types'

export function backendBaseUrl() {
  const configuredBase = (api.defaults.baseURL || '').toString().trim()
  const envBase = ((import.meta as any).env?.VITE_API_BASE || '').toString().trim()
  const fallback = 'http://localhost:8000'

  const source = configuredBase || envBase
  if (!source) return fallback

  // Relative API URLs like "/api" should resolve to backend host, not Vite host.
  if (source.startsWith('/')) return fallback

  try {
    const parsed = new URL(source)
    const base = `${parsed.protocol}//${parsed.host}`
    return parsed.pathname.endsWith('/api') ? base : `${base}${parsed.pathname}`.replace(/\/$/, '')
  } catch {
    return fallback
  }
}

export function publicFileUrl(path?: string | null) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const parsed = new URL(path)
      // If backend sends storage URL with wrong origin, force the frontend-configured backend origin.
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

type BrandingField = 'logo' | 'letterhead' | 'registrar_signature' | 'official_stamp'

export function institutionFileUrl(institution: Partial<Institution>, field: BrandingField) {
  const urlField = `${field}_url` as keyof Institution
  const explicitUrl = institution[urlField]
  if (typeof explicitUrl === 'string' && explicitUrl) return publicFileUrl(explicitUrl)

  const directPath = institution[field]
  if (typeof directPath === 'string' && directPath) return publicFileUrl(directPath)

  const legacyPathField = `${field}_path` as keyof Institution
  const legacyPath = institution[legacyPathField]
  if (typeof legacyPath === 'string' && legacyPath) return publicFileUrl(legacyPath)

  return null
}

