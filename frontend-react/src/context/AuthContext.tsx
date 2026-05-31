import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type AuthUser = any

type AuthState = {
  user: AuthUser | null
  permissions: string[]
  enabledModules: string[]
}

type AuthContextValue = AuthState & {
  setAuth: (next: Partial<AuthState>) => void
  clearAuth: () => void
  hasPermission: (permission: string) => boolean
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
  const [state, setState] = useState<AuthState>(() => ({
    user: readJson('me', null),
    permissions: readJson('permissions', []),
    enabledModules: readJson('enabled_modules', []),
  }))

  const setAuth = useCallback((next: Partial<AuthState>) => {
    setState((current) => {
      const merged = { ...current, ...next }
      localStorage.setItem('me', JSON.stringify(merged.user))
      localStorage.setItem('permissions', JSON.stringify(merged.permissions || []))
      localStorage.setItem('enabled_modules', JSON.stringify(merged.enabledModules || []))
      return merged
    })
  }, [])

  const clearAuth = useCallback(() => {
    setState({ user: null, permissions: [], enabledModules: [] })
    localStorage.removeItem('me')
    localStorage.removeItem('permissions')
    localStorage.removeItem('enabled_modules')
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    setAuth,
    clearAuth,
    hasPermission: (permission: string) => state.permissions.includes(permission),
  }), [state, setAuth, clearAuth])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
