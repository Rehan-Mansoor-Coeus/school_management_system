import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { resolveUserRoles } from '../utils/accessControl'
import { fetchInstitutions } from '../api/admin'

type InstitutionOption = { id: number; name: string; code?: string }

type AcademicInstitutionContextValue = {
  institutionId: number | null
  setInstitutionId: (id: number | null) => void
  institutions: InstitutionOption[]
  loadingInstitutions: boolean
  requiresSelection: boolean
}

const AcademicInstitutionContext = createContext<AcademicInstitutionContextValue | null>(null)

const STORAGE_KEY = 'academic_selected_institution_id'

export function AcademicInstitutionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const assignedId = user?.institution_id ?? null
  const roles = resolveUserRoles(user)
  const isPlatformAdmin = roles.includes('super-admin') || roles.includes('system-super-admin')
  // Platform super-admins manage every institution, so they always pick a
  // working institution even though they may have a home institution_id.
  const requiresSelection = !assignedId || isPlatformAdmin

  const [institutionId, setInstitutionIdState] = useState<number | null>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) return Number(stored) || assignedId
    return assignedId
  })
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([])
  const [loadingInstitutions, setLoadingInstitutions] = useState(false)

  useEffect(() => {
    if (!requiresSelection && assignedId) {
      setInstitutionIdState(assignedId)
      return
    }

    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      setInstitutionIdState(Number(stored) || assignedId)
    } else if (assignedId) {
      setInstitutionIdState(assignedId)
    }
  }, [assignedId, requiresSelection])

  useEffect(() => {
    if (!requiresSelection) return

    setLoadingInstitutions(true)
    fetchInstitutions({ per_page: 500 })
      .then((res) => {
        const rows = res.data?.data || res.data || []
        const list = Array.isArray(rows) ? rows : []
        setInstitutions(list)
        if (list.length > 0) {
          const validIds = list.map((r) => r.id)
          // If nothing is selected, or the current/home institution no longer
          // exists (e.g. it was deleted), fall back to a valid institution so
          // the academics screens don't break.
          if (!institutionId || !validIds.includes(institutionId)) {
            const firstId = assignedId && validIds.includes(assignedId) ? assignedId : list[0].id
            setInstitutionIdState(firstId)
            sessionStorage.setItem(STORAGE_KEY, String(firstId))
          }
        }
      })
      .catch(() => setInstitutions([]))
      .finally(() => setLoadingInstitutions(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiresSelection])

  const setInstitutionId = (id: number | null) => {
    setInstitutionIdState(id)
    if (id) sessionStorage.setItem(STORAGE_KEY, String(id))
    else sessionStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo(
    () => ({
      institutionId,
      setInstitutionId,
      institutions,
      loadingInstitutions,
      requiresSelection,
    }),
    [institutionId, institutions, loadingInstitutions, requiresSelection]
  )

  return <AcademicInstitutionContext.Provider value={value}>{children}</AcademicInstitutionContext.Provider>
}

export function useAcademicInstitution() {
  const ctx = useContext(AcademicInstitutionContext)
  if (!ctx) {
    throw new Error('useAcademicInstitution must be used within AcademicInstitutionProvider')
  }
  return ctx
}

export function useAcademicInstitutionParams() {
  const { institutionId, requiresSelection } = useAcademicInstitution()
  const params = useMemo(
    () => (institutionId ? { institution_id: institutionId } : undefined),
    [institutionId],
  )
  return {
    institutionId,
    requiresSelection,
    params,
  }
}
