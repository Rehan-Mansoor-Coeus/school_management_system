import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/ToastProvider'
import { useAuth } from '../context/AuthContext'
import {
  createDepartment,
  deleteDepartment,
  fetchAcademicUnits,
  fetchDepartments,
  fetchInstitutions,
  updateDepartment,
} from '../api/admin'
import FormSelect from '../components/ui/FormSelect'
import { useAcademicInstitutionParams } from '../context/AcademicInstitutionContext'
import { suggestDepartmentCode } from '../utils/suggestDepartmentCode'

interface Institution {
  id: number
  name: string
  code?: string
}

interface AcademicUnit {
  id: number
  name: string
}

interface Department {
  id: number
  institution_id: number
  academic_unit_id?: number | null
  name: string
  code: string
  description?: string
  is_active: boolean
  institution?: Institution
  academic_unit?: AcademicUnit | null
}

interface DepartmentFormState {
  institution_id?: number
  academic_unit_id?: number | null
  name: string
  code: string
  description: string
  is_active: boolean
}

export default function DepartmentsPage() {
  const { user, institution: authInstitution } = useAuth()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [activeDepartment, setActiveDepartment] = useState<Department | null>(null)
  const [codeTouched, setCodeTouched] = useState(false)
  const [form, setForm] = useState<DepartmentFormState>({
    institution_id: user?.institution_id || undefined,
    name: '',
    code: '',
    description: '',
    is_active: true,
  })
  const [search, setSearch] = useState('')
  const { pushToast } = useToast()
  const { institutionId: contextInstitutionId, requiresSelection, params: institutionParams } = useAcademicInstitutionParams()

  const hasAssignedInstitution = Boolean(user?.institution_id)

  const selectedInstitution = useMemo(() => {
    const id = form.institution_id || contextInstitutionId || user?.institution_id
    const fromList = institutions.find((row) => row.id === id)
    if (fromList) return fromList
    if (hasAssignedInstitution && authInstitution && (authInstitution as Institution).id === id) {
      return authInstitution as Institution
    }
    return null
  }, [form.institution_id, contextInstitutionId, user?.institution_id, institutions, hasAssignedInstitution, authInstitution])

  const selectedUnitName = useMemo(() => {
    if (!form.academic_unit_id) return undefined
    return academicUnits.find((unit) => unit.id === form.academic_unit_id)?.name
  }, [form.academic_unit_id, academicUnits])

  useEffect(() => {
    loadData()
  }, [contextInstitutionId])

  useEffect(() => {
    if (!modalOpen || activeDepartment || codeTouched) return
    const code = suggestDepartmentCode(selectedInstitution?.code, selectedUnitName, departments)
    setForm((prev) => ({ ...prev, code }))
  }, [modalOpen, activeDepartment, codeTouched, selectedInstitution?.code, selectedUnitName, departments])

  const loadData = async () => {
    if (requiresSelection && !contextInstitutionId) {
      setDepartments([])
      setAcademicUnits([])
      return
    }
    setLoading(true)
    try {
      const deptParams = institutionParams ? { ...institutionParams, search } : { search }
      const [departmentsRes, institutionsRes] = await Promise.all([
        fetchDepartments(deptParams),
        hasAssignedInstitution ? Promise.resolve({ data: [] }) : fetchInstitutions({ per_page: 1000 }),
      ])
      setDepartments(departmentsRes.data)
      if (!hasAssignedInstitution) {
        setInstitutions(institutionsRes.data?.data || institutionsRes.data || [])
      }
      try {
        const unitsRes = await fetchAcademicUnits(institutionParams)
        setAcademicUnits(unitsRes.data || [])
      } catch {
        setAcademicUnits([])
      }
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load departments', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setActiveDepartment(null)
    setCodeTouched(false)
    setForm({
      institution_id: user?.institution_id || contextInstitutionId || undefined,
      academic_unit_id: null,
      name: '',
      code: suggestDepartmentCode(selectedInstitution?.code, undefined, departments),
      description: '',
      is_active: true,
    })
    setModalOpen(true)
  }

  const openEditModal = (department: Department) => {
    setActiveDepartment(department)
    setCodeTouched(true)
    setForm({
      institution_id: department.institution_id,
      academic_unit_id: department.academic_unit_id ?? null,
      name: department.name,
      code: department.code,
      description: department.description || '',
      is_active: department.is_active,
    })
    setModalOpen(true)
  }

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const institution_id = form.institution_id || contextInstitutionId || user?.institution_id
    if (!institution_id) {
      pushToast('Please select an institution.', 'error')
      return
    }

    const payload = {
      institution_id,
      academic_unit_id: form.academic_unit_id || null,
      name: form.name,
      code: form.code,
      description: form.description,
      is_active: form.is_active,
    }

    try {
      if (activeDepartment) {
        await updateDepartment(activeDepartment.id, payload)
        pushToast('Department updated successfully.')
      } else {
        await createDepartment(payload)
        pushToast('Department created successfully.')
      }
      setModalOpen(false)
      loadData()
    } catch (error: any) {
      const validation = error?.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(' ')
        : null
      pushToast(validation || error?.response?.data?.message || 'Unable to save department', 'error')
    }
  }

  const handleDelete = async (department: Department) => {
    if (!window.confirm('Delete this department?')) return
    try {
      await deleteDepartment(department.id)
      pushToast('Department deleted successfully.')
      loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to delete department', 'error')
    }
  }

  const departmentCount = useMemo(() => departments.length, [departments])

  const unitOptions = academicUnits.map((unit) => ({
    value: String(unit.id),
    label: unit.name,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Departments</h2>
          <p className="text-sm text-slate-500">Manage departments for your institute.</p>
        </div>
        <button onClick={openCreateModal} className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700">
          New department
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">Found {departmentCount} department{departmentCount === 1 ? '' : 's'}.</div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && loadData()}
            placeholder="Search departments..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 sm:w-80"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Name</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Code</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Academic unit</th>
              {!hasAssignedInstitution ? (
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Institution</th>
              ) : null}
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Status</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={hasAssignedInstitution ? 6 : 7} className="px-6 py-10 text-center text-slate-500">
                  Loading departments...
                </td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={hasAssignedInstitution ? 6 : 7} className="px-6 py-10 text-center text-slate-500">
                  No departments found.
                </td>
              </tr>
            ) : (
              departments.map((department) => (
                <tr key={department.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{department.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{department.code}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {department.academic_unit?.name || '—'}
                  </td>
                  {!hasAssignedInstitution ? (
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {department.institution?.name || '—'}
                    </td>
                  ) : null}
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {department.is_active ? 'Active' : 'Inactive'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openEditModal(department)} className="rounded-xl bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(department)} className="rounded-xl bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-200">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal title={activeDepartment ? 'Edit department' : 'Create department'} open={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {!hasAssignedInstitution ? (
            <div>
              <label className="block text-sm font-medium text-slate-700">Institution</label>
              <FormSelect
                value={form.institution_id ? String(form.institution_id) : ''}
                onChange={(value) => setForm((prev) => ({ ...prev, institution_id: value ? Number(value) : undefined }))}
                options={institutions.map((institution) => ({
                  value: String(institution.id),
                  label: institution.code ? `${institution.name} (${institution.code})` : institution.name,
                }))}
                placeholder="Select institution"
                required
              />
            </div>
          ) : null}
          <div>
            <label className="block text-sm font-medium text-slate-700">Academic unit</label>
            <div className="mt-2">
              <FormSelect
                value={form.academic_unit_id ? String(form.academic_unit_id) : ''}
                onChange={(value) => {
                  setCodeTouched(false)
                  setForm((prev) => ({ ...prev, academic_unit_id: value ? Number(value) : null }))
                }}
                options={unitOptions}
                placeholder="Select academic unit (optional)"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Code</label>
            <input
              value={form.code}
              onChange={(event) => {
                setCodeTouched(true)
                setForm((prev) => ({ ...prev, code: event.target.value }))
              }}
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
            <p className="mt-1 text-xs text-slate-500">Auto-generated from institution/unit prefix; you can edit it.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="is_active" className="text-sm text-slate-700">
              Active department
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
