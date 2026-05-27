import React, { useEffect, useMemo, useState } from 'react'
import { fetchInstitutionModules, fetchInstitutions, updateInstitutionModules } from '../api/admin'
import { useToast } from '../components/ui/ToastProvider'

type Institution = { id: number; name: string; code: string; is_active: boolean }
type ModuleRow = { id: number; key: string; name: string; description?: string | null; sort_order: number; is_active: boolean; enabled: number | boolean }

export default function ModulesPage() {
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(null)
  const [modules, setModules] = useState<ModuleRow[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadInstitutions()
  }, [])

  const loadInstitutions = async () => {
    setLoading(true)
    try {
      const res = await fetchInstitutions()
      const list = res.data?.data || res.data || []
      setInstitutions(list)
      if (list.length > 0) {
        setSelectedInstitutionId((current) => current ?? list[0].id)
      }
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load institutions', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedInstitutionId) return
    loadModules(selectedInstitutionId)
  }, [selectedInstitutionId])

  const loadModules = async (institutionId: number) => {
    setLoading(true)
    try {
      const res = await fetchInstitutionModules(institutionId)
      setModules(res.data?.modules || [])
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load modules', 'error')
      setModules([])
    } finally {
      setLoading(false)
    }
  }

  const canSave = selectedInstitutionId && modules.length > 0 && !saving

  const changedPayload = useMemo(() => {
    return modules.map((module) => ({ key: module.key, enabled: Boolean(module.enabled) }))
  }, [modules])

  const save = async () => {
    if (!selectedInstitutionId) return
    setSaving(true)
    try {
      await updateInstitutionModules(selectedInstitutionId, changedPayload)
      pushToast('Module settings saved.')
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to save module settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Module Settings</h2>
          <p className="text-sm text-slate-500">Enable or disable modules per institution (client).</p>
        </div>
        <button
          onClick={save}
          disabled={!canSave}
          className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
            canSave ? 'bg-slate-900 hover:bg-slate-700' : 'bg-slate-300'
          }`}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">Institution</label>
        <select
          value={selectedInstitutionId ?? ''}
          onChange={(event) => setSelectedInstitutionId(event.target.value ? Number(event.target.value) : null)}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
        >
          {institutions.map((institution) => (
            <option key={institution.id} value={institution.id}>
              {institution.name} ({institution.code})
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Module</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Key</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Enabled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                  Loading modules...
                </td>
              </tr>
            ) : modules.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-slate-500">
                  No modules found.
                </td>
              </tr>
            ) : (
              modules.map((module) => (
                <tr key={module.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{module.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{module.key}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <label className="inline-flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(module.enabled)}
                        onChange={(event) =>
                          setModules((current) =>
                            current.map((row) =>
                              row.id === module.id ? { ...row, enabled: event.target.checked } : row
                            )
                          )
                        }
                      />
                      <span>{Boolean(module.enabled) ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
