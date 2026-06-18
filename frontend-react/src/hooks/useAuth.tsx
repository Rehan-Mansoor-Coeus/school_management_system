import { useState, useEffect, createContext, useContext } from 'react'
import api from '../api/client'

type Institution = {
  id: number
  name: string
  acronym?: string | null
  logo_url?: string | null
}

type AuthUser = {
  id: number
  name: string
  email: string
  institution_id?: number | null
  institution?: Institution | null
}

type AuthContextValue = {
  user: AuthUser | null
  institution: Institution | null
  permissions: string[]
  loading: boolean
  refresh: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  institution: null,
  permissions: [],
  loading: true,
  refresh: async () => {},
  setUser: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setInstitution(null)
      setPermissions([])
      setLoading(false)
      return
    }

    try {
      const response = await api.get('/me')
      const payload = response.data
      const nextUser = payload.user || payload
      setUser(nextUser)
      setInstitution(payload.institution || nextUser?.institution || null)
      setPermissions(Array.isArray(payload.permissions) ? payload.permissions : [])
    } catch {
      setUser(null)
      setInstitution(null)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <AuthContext.Provider value={{ user, institution, permissions, loading, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
