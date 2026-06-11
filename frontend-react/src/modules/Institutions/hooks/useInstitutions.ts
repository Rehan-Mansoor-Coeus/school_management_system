import { useCallback, useState } from 'react'
import type { Institution, InstitutionSettings, PaginatedResponse } from '../types'
import type { InstitutionListParams } from '../services/InstitutionsService'
import {
  createInstitution,
  deleteInstitution,
  fetchInstitution,
  fetchInstitutions,
  fetchInstitutionSettings,
  updateInstitution,
  updateInstitutionSettings,
  uploadInstitutionFile,
} from '../services/InstitutionsService'

export function useInstitutions() {
  const [loading, setLoading] = useState(false)

  const fetchInstitutionsList = useCallback(async (page = 1, filters: Omit<InstitutionListParams, 'page'> = {}) => {
    setLoading(true)
    try {
      const res = await fetchInstitutions({ ...filters, page })
      return res.data as PaginatedResponse<Institution>
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchInstitutionById = useCallback(async (id: number) => {
    setLoading(true)
    try {
      const res = await fetchInstitution(id)
      return res.data as Institution
    } finally {
      setLoading(false)
    }
  }, [])

  const createInstitutionRecord = useCallback(async (data: FormData) => {
    setLoading(true)
    try {
      const res = await createInstitution(data)
      return res.data
    } finally {
      setLoading(false)
    }
  }, [])

  const updateInstitutionRecord = useCallback(async (id: number, data: FormData) => {
    setLoading(true)
    try {
      const res = await updateInstitution(id, data)
      return res.data
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteInstitutionRecord = useCallback(async (id: number) => {
    setLoading(true)
    try {
      const res = await deleteInstitution(id)
      return res.data
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSettings = useCallback(async (id: number) => {
    setLoading(true)
    try {
      const res = await fetchInstitutionSettings(id)
      return res.data as InstitutionSettings
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (id: number, data: Partial<InstitutionSettings>) => {
    setLoading(true)
    try {
      const res = await updateInstitutionSettings(id, data)
      return res.data
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadFile = useCallback(async (id: number, type: 'logo' | 'letterhead' | 'signature' | 'footer', file: File) => {
    setLoading(true)
    try {
      const res = await uploadInstitutionFile(id, type, file)
      return res.data
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    fetchInstitutions: fetchInstitutionsList,
    fetchInstitution: fetchInstitutionById,
    createInstitution: createInstitutionRecord,
    updateInstitution: updateInstitutionRecord,
    deleteInstitution: deleteInstitutionRecord,
    fetchSettings,
    updateSettings,
    uploadFile,
  }
}
