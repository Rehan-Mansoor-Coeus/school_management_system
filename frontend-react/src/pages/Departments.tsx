import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/ToastProvider'
import { useAuth } from '../context/AuthContext'
import {
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  fetchInstitutions,
  updateDepartment,
} from '../api/admin'

interface Institution {
  id: number
  name: string
  code?: string
}

interface Department {
  id: number
  institution_id: number
  name: string
  code: string
  description?: string
  phone?: string
  email?: string
  office_location?: string
  is_active: boolean
  institution?: Institution
}

interface DepartmentFormState {
  institution_id?: number
  name: string
  code: string
  description: string
  phone: string
  email: string
  office_location: string
  is_active: boolean
}

export default function DepartmentsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [activeDepartment, setActiveDepartment] = useState<Department | null>(null)
  const [form, setForm] = useState<DepartmentFormState>({
    institution_id: user?.institution_id || undefined,
    name: '',
    code: '',
    description: '',
    phone: '',
    email: '',
    office_location: '',
    is_active: true,
  })
  const [search, setSearch] = useState('')
  const { pushToast } = useToast()

  const hasAssignedInstitution = Boolean(user?.institution_id)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [departmentsRes, institutionsRes] = await Promise.all([
        fetchDepartments(search),
        hasAssignedInstitution ? Promise.resolve({ data: [] }) : fetchInstitutions({ per_page: 1000 }),
      ])
      setDepartments(departmentsRes.data)
      if (!hasAssignedInstitution) {
        setInstitutions(institutionsRes.data?.data || institutionsRes.data || [])
      }
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load departments', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setActiveDepartment(null)
    setForm({
      institution_id: user?.institution_id || undefined,
      name: '',
      code: '',
      description: '',
      phone: '',
      email: '',
      office_location: '',
      is_active: true,
    })
    setModalOpen(true)
  }

  const openEditModal = (department: Department) => {
    setActiveDepartment(department)
    setForm({
      institution_id: department.institution_id,
      name: department.name,
      code: department.code,
      description: department.description || '',
      phone: department.phone || '',
      email: department.email || '',
      office_location: department.office_location || '',
      is_active: department.is_active,
    })
    setModalOpen(true)
  }

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!hasAssignedInstitution && !form.institution_id) {
      pushToast('Please select an institution.', 'error')
      return
    }

    try {
      if (activeDepartment) {
        await updateDepartment(activeDepartment.id, form)
        pushToast('Department updated successfully.')
      } else {
        await createDepartment(form)
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
              {!hasAssignedInstitution ? (
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Institution</th>
              ) : null}
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Contact</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Status</th>
              <th className="px-6 py-3 text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={hasAssignedInstitution ? 5 : 6} className="px-6 py-10 text-center text-slate-500">
                  Loading departments...
                </td>
              </tr>
            ) : departments.length === 0 ? (
              <tr>
                <td colSpan={hasAssignedInstitution ? 5 : 6} className="px-6 py-10 text-center text-slate-500">
                  No departments found.
                </td>
              </tr>
            ) : (
              departments.map((department) => (
                <tr key={department.id}>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{department.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{department.code}</td>
                  {!hasAssignedInstitution ? (
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {department.institution?.name || '—'}
                    </td>
                  ) : null}
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {department.email || department.phone || '—'}
                  </td>
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
              <select
                value={form.institution_id ?? ''}
                onChange={(event) => setForm((prev) => ({ ...prev, institution_id: Number(event.target.value) || undefined }))}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              >
                <option value="">Select institution</option>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name} {institution.code ? `(${institution.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
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
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                type="email"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Phone</label>
              <input
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                type="text"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Office location</label>
            <input
              value={form.office_location}
              onChange={(event) => setForm((prev) => ({ ...prev, office_location: event.target.value }))}
              type="text"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
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
