import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { canAccessMenu, isAdminRole, resolveUserRoles } from '../utils/accessControl'

export type AuthUser = {
  roles?: Array<{ name: string } | string>
  institution?: Record<string, unknown>
  [key: string]: unknown
} | null

type AuthState = {
  user: AuthUser
  permissions: string[]
  enabledModules: string[]
  institution: Record<string, unknown> | null
}

type AuthContextValue = AuthState & {
  setAuth: (next: Partial<AuthState>) => void
  clearAuth: () => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  userRoles: string[]
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  isAdmin: () => boolean
  canAccess: (options: { permissions?: string[]; roles?: string[] }) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch (error) {
    return fallback
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const user = readJson<AuthUser>('me', null)
    return {
      user,
      permissions: readJson('permissions', []),
      enabledModules: readJson('enabled_modules', []),
      institution: readJson('institution', null) ?? (user?.institution as Record<string, unknown> | undefined) ?? null,
    }
  })

  const setAuth = useCallback((next: Partial<AuthState>) => {
    setState((current) => {
      const merged = {
        ...current,
        ...next,
        institution: next.institution ?? next.user?.institution ?? current.institution ?? null,
      }
      localStorage.setItem('me', JSON.stringify(merged.user))
      localStorage.setItem('permissions', JSON.stringify(merged.permissions || []))
      localStorage.setItem('enabled_modules', JSON.stringify(merged.enabledModules || []))
      localStorage.setItem('institution', JSON.stringify(merged.institution))
      return merged
    })
  }, [])

  const clearAuth = useCallback(() => {
    setState({ user: null, permissions: [], enabledModules: [], institution: null })
    localStorage.removeItem('me')
    localStorage.removeItem('permissions')
    localStorage.removeItem('enabled_modules')
    localStorage.removeItem('institution')
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const userRoles = resolveUserRoles(state.user)

    return {
      ...state,
      userRoles,
      setAuth,
      clearAuth,
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
  }, [state, setAuth, clearAuth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
