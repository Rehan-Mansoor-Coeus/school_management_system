import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import FormSelect from '../../components/ui/FormSelect'
import { useToast } from '../../components/ui/ToastProvider'
import { useAuth } from '../../context/AuthContext'
import { useAcademicInstitution, useAcademicInstitutionParams } from '../../context/AcademicInstitutionContext'
import { createAcademicUnit, deleteAcademicUnit, fetchAcademicUnits, updateAcademicUnit } from '../../api/admin'

const UNIT_TYPES = [
  { value: 'school', label: 'School' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'institute', label: 'Institute' },
  { value: 'research_center', label: 'Research Center' },
  { value: 'department', label: 'Department' },
  { value: 'college', label: 'College' },
  { value: 'other', label: 'Other' },
]

type Unit = {
  id: number
  name: string
  unit_type: string
  description?: string
  is_active: boolean
  institution_id?: number
}

type UnitForm = {
  institution_id?: number
  name: string
  unit_type: string
  description: string
  is_active: boolean
}

export default function AcademicUnitsPage() {
  const { pushToast } = useToast()
  const { user, institution: authInstitution } = useAuth()
  const { institutionId, requiresSelection, params } = useAcademicInstitutionParams()
  const { institutions, loadingInstitutions } = useAcademicInstitution()
  const [rows, setRows] = useState<Unit[]>([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<Unit | null>(null)
  const [form, setForm] = useState<UnitForm>({
    institution_id: institutionId || user?.institution_id || undefined,
    name: '',
    unit_type: 'school',
    description: '',
    is_active: true,
  })

  const showInstitutionPicker = requiresSelection || institutions.length > 1
  const selectedInstitutionLabel = institutions.find((i) => i.id === (form.institution_id || institutionId))?.name
    || authInstitution?.name
    || '—'

  const load = async () => {
    if (requiresSelection && !institutionId) {
      setRows([])
      return
    }
    try {
      const res = await fetchAcademicUnits({ ...params, search })
      setRows(res.data)
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to load academic units', 'error')
    }
  }

  useEffect(() => {
    load()
  }, [search, institutionId])

  const openCreate = () => {
    setActive(null)
    setForm({
      institution_id: institutionId || user?.institution_id || undefined,
      name: '',
      unit_type: 'school',
      description: '',
      is_active: true,
    })
    setOpen(true)
  }

  const openEdit = (row: Unit) => {
    setActive(row)
    setForm({
      institution_id: row.institution_id || institutionId || user?.institution_id || undefined,
      name: row.name,
      unit_type: row.unit_type,
      description: row.description || '',
      is_active: row.is_active,
    })
    setOpen(true)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetInstitutionId = form.institution_id || institutionId || user?.institution_id
    if (!targetInstitutionId) {
      pushToast('Select an institution first.', 'error')
      return
    }
    try {
      const payload = {
        ...form,
        institution_id: targetInstitutionId,
      }
      if (active) {
        await updateAcademicUnit(active.id, payload)
        pushToast('Academic unit updated.')
      } else {
        await createAcademicUnit(payload)
        pushToast('Academic unit created.')
      }
      setOpen(false)
      load()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Save failed', 'error')
    }
  }

  return (
    <div className="space-y-4">
      {requiresSelection && !institutionId && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Select a working institution above to manage academic units.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search units…"
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
        />
        <button type="button" onClick={openCreate} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Add Academic Unit
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              {showInstitutionPicker && <th className="px-4 py-3">Institution</th>}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 capitalize">{row.unit_type.replace('_', ' ')}</td>
                {showInstitutionPicker && (
                  <td className="px-4 py-3 text-slate-600">{selectedInstitutionLabel}</td>
                )}
                <td className="px-4 py-3">{row.is_active ? 'Active' : 'Inactive'}</td>
                <td className="px-4 py-3">
                  <button type="button" className="mr-2 text-blue-600" onClick={() => openEdit(row)}>Edit</button>
                  <button
                    type="button"
                    className="text-rose-600"
                    onClick={async () => {
                      if (!window.confirm('Delete this unit?')) return
                      await deleteAcademicUnit(row.id)
                      load()
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={active ? 'Edit Academic Unit' : 'Add Academic Unit'} open onClose={() => setOpen(false)}>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Institution</label>
              {showInstitutionPicker ? (
                <div className="mt-1">
                  <FormSelect
                    value={form.institution_id ? String(form.institution_id) : ''}
                    onChange={(value) => setForm({ ...form, institution_id: value ? Number(value) : undefined })}
                    options={institutions.map((inst) => ({
                      value: String(inst.id),
                      label: inst.code ? `${inst.name} (${inst.code})` : inst.name,
                    }))}
                    placeholder={loadingInstitutions ? 'Loading institutions…' : 'Select institution'}
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">Academic units belong to an institution, like departments belong to a unit.</p>
                </div>
              ) : (
                <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{selectedInstitutionLabel}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Unit name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-medium">Unit type</label>
              <FormSelect value={form.unit_type} onChange={(v) => setForm({ ...form, unit_type: v })} options={UNIT_TYPES} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" rows={3} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Active
            </label>
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Save</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
