import api from '../../api/client'
import type { Institution } from './types'

export function backendBaseUrl() {
  const base = (api.defaults.baseURL || '').toString()
  if (!base) return 'http://localhost:8000'
  return base.endsWith('/api') ? base.slice(0, -4) : base
}

export function publicFileUrl(path?: string | null) {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${backendBaseUrl()}/storage/${path}`
}

type BrandingField = 'logo' | 'letterhead' | 'registrar_signature' | 'official_stamp'

export function institutionFileUrl(institution: Partial<Institution>, field: BrandingField) {
  const urlField = `${field}_url` as keyof Institution
  const explicitUrl = institution[urlField]
  if (typeof explicitUrl === 'string' && explicitUrl) return explicitUrl
  return publicFileUrl(institution[field] ?? null)
}

