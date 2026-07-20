import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { canAccessMenu, isAdminRole, PLATFORM_SUPER_ADMIN_ROLES, resolveUserRoles } from '../utils/accessControl'
import {
  clearStoredSession,
  persistProfile,
  readCachedProfile,
  setStoredActiveInstitutionId,
  type AuthInstitution,
  type AuthProfile,
} from '../utils/authSession'

export type AuthUser = {
  roles?: Array<{ name: string } | string>
  institution?: Record<string, unknown>
  [key: string]: unknown
} | null

type AuthState = {
  user: AuthUser
  permissions: string[]
  enabledModules: string[]
  institution: AuthInstitution
  roleType: string
  contextType: string
  actingAsSuperAdmin: boolean
  activeInstitution: AuthInstitution
  activeInstitutionId: number | null
}

type AuthContextValue = AuthState & {
  setAuth: (next: Partial<AuthState> | AuthProfile) => void
  clearAuth: () => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  userRoles: string[]
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  isAdmin: () => boolean
  isPlatformSuperAdmin: boolean
  isPlatformContext: boolean
  isInstitutionContext: boolean
  enterInstitutionContext: (institution: NonNullable<AuthInstitution>, enabledModules?: string[]) => void
  leaveInstitutionContext: () => void
  canAccess: (options: { permissions?: string[]; roles?: string[] }) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function fromProfile(profile: AuthProfile): AuthState {
  return {
    user: profile.user as AuthUser,
    permissions: profile.permissions || [],
    enabledModules: profile.enabledModules || [],
    institution: profile.institution,
    roleType: profile.roleType || '',
    contextType: profile.contextType || 'institution',
    actingAsSuperAdmin: Boolean(profile.actingAsSuperAdmin),
    activeInstitution: profile.activeInstitution,
    activeInstitutionId: profile.activeInstitutionId,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => fromProfile(readCachedProfile()))

  const setAuth = useCallback((next: Partial<AuthState> | AuthProfile) => {
    setState((current) => {
      const incoming = 'enabledModules' in next || 'roleType' in next || 'contextType' in next
        ? {
            user: ('user' in next ? next.user : current.user) as AuthUser,
            permissions: ('permissions' in next && next.permissions) ? next.permissions : current.permissions,
            enabledModules: ('enabledModules' in next && next.enabledModules) ? next.enabledModules : current.enabledModules,
            institution: ('institution' in next ? next.institution : current.institution) as AuthInstitution,
            roleType: ('roleType' in next && next.roleType) ? String(next.roleType) : current.roleType,
            contextType: ('contextType' in next && next.contextType) ? String(next.contextType) : current.contextType,
            actingAsSuperAdmin: ('actingAsSuperAdmin' in next) ? Boolean(next.actingAsSuperAdmin) : current.actingAsSuperAdmin,
            activeInstitution: ('activeInstitution' in next ? next.activeInstitution : current.activeInstitution) as AuthInstitution,
            activeInstitutionId: ('activeInstitutionId' in next) ? (next.activeInstitutionId ?? null) : current.activeInstitutionId,
          }
        : { ...current, ...(next as Partial<AuthState>) }

      const profile: AuthProfile = {
        user: incoming.user as Record<string, unknown> | null,
        permissions: incoming.permissions,
        enabledModules: incoming.enabledModules,
        institution: incoming.institution,
        roleType: incoming.roleType,
        contextType: incoming.contextType,
        actingAsSuperAdmin: incoming.actingAsSuperAdmin,
        activeInstitution: incoming.activeInstitution,
        activeInstitutionId: incoming.activeInstitutionId,
      }
      persistProfile(profile)
      return incoming
    })
  }, [])

  const clearAuth = useCallback(() => {
    setState({
      user: null,
      permissions: [],
      enabledModules: [],
      institution: null,
      roleType: '',
      contextType: 'platform',
      actingAsSuperAdmin: false,
      activeInstitution: null,
      activeInstitutionId: null,
    })
    clearStoredSession()
  }, [])

  const enterInstitutionContext = useCallback((institution: NonNullable<AuthInstitution>, enabledModules?: string[]) => {
    const id = Number(institution.id)
    setStoredActiveInstitutionId(id)
    setAuth({
      contextType: 'institution',
      actingAsSuperAdmin: true,
      activeInstitution: institution,
      activeInstitutionId: id,
      institution,
      enabledModules: enabledModules || [],
    })
  }, [setAuth])

  const leaveInstitutionContext = useCallback(() => {
    setStoredActiveInstitutionId(null)
    setAuth({
      contextType: 'platform',
      actingAsSuperAdmin: false,
      activeInstitution: null,
      activeInstitutionId: null,
      institution: null,
      enabledModules: [],
    })
  }, [setAuth])

  const value = useMemo<AuthContextValue>(() => {
    const userRoles = resolveUserRoles(state.user)
    const isPlatformSuperAdmin = userRoles.some((role) =>
      PLATFORM_SUPER_ADMIN_ROLES.includes(role as (typeof PLATFORM_SUPER_ADMIN_ROLES)[number])
    ) || state.roleType === 'platform_super_admin'

    return {
      ...state,
      userRoles,
      setAuth,
      clearAuth,
      enterInstitutionContext,
      leaveInstitutionContext,
      isPlatformSuperAdmin,
      isPlatformContext: isPlatformSuperAdmin && state.contextType === 'platform',
      isInstitutionContext: state.contextType === 'institution',
      hasPermission: (permission: string) => state.permissions.includes(permission),
      hasAnyPermission: (permissions: string[]) => permissions.some((p) => state.permissions.includes(p)),
      hasRole: (role: string) => userRoles.includes(role),
      hasAnyRole: (roles: string[]) => roles.some((role) => userRoles.includes(role)),
      isAdmin: () => isAdminRole(userRoles),
      canAccess: (options) => canAccessMenu({
        permissions: options.permissions,
        roles: options.roles,
        userPermissions: state.permissions,
        userRoles,
      }),
    }
  }, [state, setAuth, clearAuth, enterInstitutionContext, leaveInstitutionContext])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
