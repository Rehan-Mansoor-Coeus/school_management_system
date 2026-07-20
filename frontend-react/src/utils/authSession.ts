import api from '../api/client'

export type AuthInstitution = {
  id?: number
  name?: string
  code?: string
  acronym?: string
  logo_url?: string | null
  is_active?: boolean
  subscription_status?: string
  subscription_expires_at?: string | null
  [key: string]: unknown
} | null

export type AuthProfile = {
  user: Record<string, unknown> | null
  permissions: string[]
  enabledModules: string[]
  institution: AuthInstitution
  roleType: string
  contextType: 'platform' | 'institution' | string
  actingAsSuperAdmin: boolean
  activeInstitution: AuthInstitution
  activeInstitutionId: number | null
}

const ACTIVE_INSTITUTION_KEY = 'active_institution_id'
const AUTH_TIMEOUT_MS = 30_000

export function getStoredActiveInstitutionId(): number | null {
  try {
    const raw = localStorage.getItem(ACTIVE_INSTITUTION_KEY)
    if (!raw || raw === 'null') return null
    const id = Number(raw)
    return Number.isFinite(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

export function setStoredActiveInstitutionId(id: number | null) {
  if (id && id > 0) {
    localStorage.setItem(ACTIVE_INSTITUTION_KEY, String(id))
  } else {
    localStorage.removeItem(ACTIVE_INSTITUTION_KEY)
  }
}

export function readCachedProfile(): AuthProfile {
  const readJson = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  }

  const user = readJson<Record<string, unknown> | null>('me', null)
  const activeInstitutionId = getStoredActiveInstitutionId()
  const institution = readJson<AuthInstitution>('institution', null)
    ?? (user?.institution as AuthInstitution)
    ?? null

  return {
    user,
    permissions: readJson('permissions', []),
    enabledModules: readJson('enabled_modules', []),
    institution,
    roleType: readJson('role_type', ''),
    contextType: readJson('context_type', activeInstitutionId ? 'institution' : 'platform'),
    actingAsSuperAdmin: Boolean(readJson('acting_as_super_admin', false)),
    activeInstitution: readJson('active_institution', null) ?? (activeInstitutionId ? institution : null),
    activeInstitutionId,
  }
}

export function persistProfile(profile: AuthProfile) {
  localStorage.setItem('me', JSON.stringify(profile.user))
  localStorage.setItem('permissions', JSON.stringify(profile.permissions))
  localStorage.setItem('enabled_modules', JSON.stringify(profile.enabledModules))
  localStorage.setItem('institution', JSON.stringify(profile.institution))
  localStorage.setItem('role_type', JSON.stringify(profile.roleType))
  localStorage.setItem('context_type', JSON.stringify(profile.contextType))
  localStorage.setItem('acting_as_super_admin', JSON.stringify(profile.actingAsSuperAdmin))
  localStorage.setItem('active_institution', JSON.stringify(profile.activeInstitution))
  setStoredActiveInstitutionId(profile.activeInstitutionId)
}

export function clearStoredSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('me')
  localStorage.removeItem('permissions')
  localStorage.removeItem('enabled_modules')
  localStorage.removeItem('institution')
  localStorage.removeItem('role_type')
  localStorage.removeItem('context_type')
  localStorage.removeItem('acting_as_super_admin')
  localStorage.removeItem('active_institution')
  localStorage.removeItem(ACTIVE_INSTITUTION_KEY)
  delete api.defaults.headers.common['Authorization']
  delete api.defaults.headers.common['X-Active-Institution-Id']
}

export function applyToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export function profileFromAuthResponse(data: Record<string, unknown>): AuthProfile {
  return normalizeProfile(data)
}

function normalizeProfile(data: Record<string, unknown>): AuthProfile {
  const user = (data.user ?? data) as Record<string, unknown> | null
  const permissions = (data.permissions as string[] | undefined) ?? []
  const enabledModules = (data.enabled_modules as string[] | undefined) ?? []
  const roleType = String(data.role_type || '')
  const contextType = String(data.context_type || (roleType === 'platform_super_admin' ? 'platform' : 'institution'))
  const actingAsSuperAdmin = Boolean(data.acting_as_super_admin)
  const activeInstitution = (data.active_institution as AuthInstitution)
    ?? (contextType === 'institution' ? ((data.institution as AuthInstitution) ?? null) : null)
  const activeInstitutionId = data.active_institution_id != null
    ? Number(data.active_institution_id)
    : (activeInstitution?.id != null ? Number(activeInstitution.id) : null)
  const institution = contextType === 'platform'
    ? null
    : ((data.institution as AuthInstitution) ?? activeInstitution ?? (user?.institution as AuthInstitution) ?? null)

  return {
    user,
    permissions,
    enabledModules,
    institution,
    roleType,
    contextType,
    actingAsSuperAdmin,
    activeInstitution: contextType === 'platform' ? null : activeInstitution,
    activeInstitutionId: contextType === 'platform' ? null : (activeInstitutionId && activeInstitutionId > 0 ? activeInstitutionId : null),
  }
}

export async function fetchAuthProfile(): Promise<AuthProfile> {
  const response = await api.get('/auth/user', {
    timeout: AUTH_TIMEOUT_MS,
    headers: { Accept: 'application/json' },
    validateStatus: (status) => status >= 200 && status < 300,
  })

  const contentType = String(response.headers?.['content-type'] || '')
  if (!contentType.includes('application/json')) {
    throw Object.assign(new Error('API returned non-JSON response'), { code: 'INVALID_API_RESPONSE' })
  }

  const profile = normalizeProfile(response.data as Record<string, unknown>)
  if (!profile.user || typeof profile.user !== 'object') {
    throw Object.assign(new Error('Invalid auth profile'), { code: 'INVALID_API_RESPONSE' })
  }

  persistProfile(profile)
  return profile
}

export function homePathForProfile(profile: AuthProfile): string {
  if (profile.roleType === 'platform_super_admin' && profile.contextType === 'platform') {
    return '/super-admin/dashboard'
  }
  return '/dashboard'
}
