import api from '../api/client'

export type AuthProfile = {
  user: Record<string, unknown> | null
  permissions: string[]
  enabledModules: string[]
  institution: Record<string, unknown> | null
}

const AUTH_TIMEOUT_MS = 12_000

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
  return {
    user,
    permissions: readJson('permissions', []),
    enabledModules: readJson('enabled_modules', []),
    institution: readJson('institution', null) ?? (user?.institution as Record<string, unknown> | null) ?? null,
  }
}

export function persistProfile(profile: AuthProfile) {
  localStorage.setItem('me', JSON.stringify(profile.user))
  localStorage.setItem('permissions', JSON.stringify(profile.permissions))
  localStorage.setItem('enabled_modules', JSON.stringify(profile.enabledModules))
  localStorage.setItem('institution', JSON.stringify(profile.institution))
}

export function clearStoredSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('me')
  localStorage.removeItem('permissions')
  localStorage.removeItem('enabled_modules')
  localStorage.removeItem('institution')
  delete api.defaults.headers.common['Authorization']
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
  const institution = (data.institution as Record<string, unknown> | null | undefined)
    ?? (user?.institution as Record<string, unknown> | null | undefined)
    ?? null

  return { user, permissions, enabledModules, institution }
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
