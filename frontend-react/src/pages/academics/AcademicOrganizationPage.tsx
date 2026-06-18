import React, { useEffect, useMemo, useState } from 'react'
import SearchableSelect from '../../components/ui/SearchableSelect'
import SearchableMultiSelect, { type SearchableMultiSelectOption } from '../../components/ui/SearchableMultiSelect'
import { useToast } from '../../components/ui/ToastProvider'
import { useAcademicInstitutionParams } from '../../context/AcademicInstitutionContext'
import {
  createProgramSubject,
  deleteProgramSubject,
  fetchOrganizationTree,
  updateDepartment,
  updateProgram,
} from '../../api/admin'

type TreeProgram = {
  id: number
  name: string
  code?: string
  program_subjects?: Array<{
    id: number
    subject?: { id: number; name: string; code?: string }
    is_required?: boolean
  }>
}

type TreeUnit = {
  id: number
  name: string
  departments?: Array<{ id: number; name: string; programmes?: TreeProgram[] }>
}

type ProgramOption = {
  id: number
  name: string
  code: string
  department_id?: number | null
  academic_unit_id?: number | null
  duration_years?: number
  duration_value?: number
  duration_unit?: string
  level?: string
  semester_count?: number
  tuition_fee?: number
  application_fee?: number
  is_active?: boolean
  department?: { name: string }
}
type DepartmentRow = {
  id: number
  name: string
  code: string
  institution_id?: number
  academic_unit_id?: number | null
  description?: string | null
  is_active?: boolean
  academic_unit?: { id: number; name: string } | null
}
type UnitOption = { id: number; name: string }
type SubjectOption = { id: number; name: string; code?: string }
type ProgramLink = {
  id: number
  programme_id: number
  subject_id: number
  is_required?: boolean
  subject?: SubjectOption
}

export default function AcademicOrganizationPage() {
  const { pushToast } = useToast()
  const { institutionId, requiresSelection, params } = useAcademicInstitutionParams()

  const [institution, setInstitution] = useState<{ id: number; name: string } | null>(null)
  const [units, setUnits] = useState<TreeUnit[]>([])
  const [unassignedDepartments, setUnassignedDepartments] = useState<Array<{ id: number; name: string; programmes?: TreeProgram[] }>>([])
  const [programmes, setProgrammes] = useState<ProgramOption[]>([])
  const [departmentsFlat, setDepartmentsFlat] = useState<DepartmentRow[]>([])
  const [academicUnits, setAcademicUnits] = useState<UnitOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [programLinks, setProgramLinks] = useState<ProgramLink[]>([])
  const [loading, setLoading] = useState(false)
  const [savingOrg, setSavingOrg] = useState(false)

  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [pendingSubjects, setPendingSubjects] = useState<SearchableMultiSelectOption[]>([])
  const [isOptional, setIsOptional] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (requiresSelection && !institutionId) {
      setInstitution(null)
      setUnits([])
      setUnassignedDepartments([])
      setProgrammes([])
      setDepartmentsFlat([])
      setAcademicUnits([])
      setSubjects([])
      setProgramLinks([])
      return
    }

    let cancelled = false
    setLoading(true)

    fetchOrganizationTree(params)
      .then((res) => {
        if (cancelled) return
        setInstitution(res.data.institution)
        setUnits(res.data.academic_units || [])
        setUnassignedDepartments(res.data.unassigned_departments || [])
        setProgrammes(res.data.programmes || [])
        setDepartmentsFlat(res.data.departments || [])
        setAcademicUnits((res.data.academic_units || []).map((u: TreeUnit) => ({ id: u.id, name: u.name })))
        setSubjects(res.data.subjects || [])
        setProgramLinks(res.data.program_links || [])
      })
      .catch((e: any) => {
        if (cancelled) return
        pushToast(e?.response?.data?.message || 'Failed to load organization', 'error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [institutionId, requiresSelection])

  const programOptions = programmes.map((p) => ({
    value: String(p.id),
    label: p.department ? `${p.name} — ${p.department.name}` : p.name,
  }))

  const linksForProgram = useMemo(
    () => programLinks.filter((link) => String(link.programme_id) === selectedProgramId),
    [programLinks, selectedProgramId],
  )

  const assignedSubjectIds = useMemo(
    () => new Set(linksForProgram.map((link) => link.subject_id)),
    [linksForProgram],
  )

  const subjectSearchOptions: SearchableMultiSelectOption[] = subjects
    .filter((s) => !assignedSubjectIds.has(s.id))
    .map((s) => ({
      id: s.id,
      label: s.name,
      sublabel: s.code || undefined,
    }))

  const reload = async () => {
    if (requiresSelection && !institutionId) return
    const res = await fetchOrganizationTree(params)
    setInstitution(res.data.institution)
    setUnits(res.data.academic_units || [])
    setUnassignedDepartments(res.data.unassigned_departments || [])
    setProgrammes(res.data.programmes || [])
    setDepartmentsFlat(res.data.departments || [])
    setAcademicUnits((res.data.academic_units || []).map((u: TreeUnit) => ({ id: u.id, name: u.name })))
    setSubjects(res.data.subjects || [])
    setProgramLinks(res.data.program_links || [])
  }

  const reassignDepartmentUnit = async (dept: DepartmentRow, academicUnitId: number | null) => {
    setSavingOrg(true)
    try {
      await updateDepartment(dept.id, {
        ...params,
        institution_id: dept.institution_id ?? institution?.id,
        name: dept.name,
        code: dept.code,
        description: dept.description ?? '',
        is_active: dept.is_active ?? true,
        academic_unit_id: academicUnitId,
      })
      pushToast('Department moved.')
      await reload()
    } catch (e: any) {
      const msg = e?.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' ')
        : e?.response?.data?.message
      pushToast(msg || 'Failed to move department', 'error')
    } finally {
      setSavingOrg(false)
    }
  }

  const reassignProgrammeDepartment = async (prog: ProgramOption, departmentId: number) => {
    setSavingOrg(true)
    try {
      await updateProgram(prog.id, {
        ...params,
        name: prog.name,
        code: prog.code,
        description: '',
        duration_years: prog.duration_years || 1,
        duration_value: prog.duration_value,
        duration_unit: prog.duration_unit,
        level: prog.level || 'degree',
        semester_count: prog.semester_count || 1,
        tuition_fee: prog.tuition_fee,
        application_fee: prog.application_fee,
        is_active: prog.is_active ?? true,
        department_id: departmentId,
      })
      pushToast('Programme moved.')
      await reload()
    } catch (e: any) {
      const msg = e?.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' ')
        : e?.response?.data?.message
      pushToast(msg || 'Failed to move programme', 'error')
    } finally {
      setSavingOrg(false)
    }
  }

  const assignPending = async () => {
    if (!selectedProgramId || !pendingSubjects.length) {
      pushToast('Select a programme and at least one subject.', 'error')
      return
    }
    setSaving(true)
    try {
      for (const subject of pendingSubjects) {
        await createProgramSubject({
          ...params,
          programme_id: Number(selectedProgramId),
          subject_id: Number(subject.id),
          is_required: !isOptional,
        })
      }
      pushToast(`${pendingSubjects.length} subject(s) assigned.`)
      setPendingSubjects([])
      setIsOptional(false)
      await reload()
    } catch (e: any) {
      const msg = e?.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' ')
        : e?.response?.data?.message
      pushToast(msg || 'Failed to assign subjects', 'error')
    } finally {
      setSaving(false)
    }
  }

  const removeLink = async (id: number) => {
    if (!window.confirm('Remove this subject from the program?')) return
    try {
      await deleteProgramSubject(id)
      pushToast('Subject removed from program.')
      await reload()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to remove subject', 'error')
    }
  }

  if (requiresSelection && !institutionId) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Select a working institution above to assign subjects to programmes.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Institution</p>
        <p className="mt-1 text-lg font-bold text-slate-900">{loading ? 'Loading…' : institution?.name || '—'}</p>
        <p className="mt-2 text-sm text-slate-500">
          Search and select subjects for a programme. Unchecked &quot;Optional&quot; means the course is mandatory.
          The same subject can be assigned to multiple programmes.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Assign subjects to a programme</h3>

        <SearchableSelect
          value={selectedProgramId}
          onChange={setSelectedProgramId}
          options={programOptions}
          placeholder="Search programme (e.g. BSc Nursing)..."
        />

        {selectedProgramId && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Search subjects to add</label>
              <SearchableMultiSelect
                options={subjectSearchOptions}
                selected={pendingSubjects}
                onChange={setPendingSubjects}
                placeholder="Search subjects..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={isOptional} onChange={(e) => setIsOptional(e.target.checked)} />
              Optional (students may choose during course registration)
            </label>

            {pendingSubjects.length > 0 && (
              <button
                type="button"
                disabled={saving}
                onClick={assignPending}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? 'Assigning…' : `Assign ${pendingSubjects.length} subject(s)`}
              </button>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Subject</th>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {linksForProgram.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        No subjects assigned yet.
                      </td>
                    </tr>
                  ) : (
                    linksForProgram.map((link) => (
                      <tr key={link.id} className="border-t border-slate-100">
                        <td className="px-4 py-2 font-medium text-slate-900">{link.subject?.name || `#${link.subject_id}`}</td>
                        <td className="px-4 py-2 text-slate-600">{link.subject?.code || '—'}</td>
                        <td className="px-4 py-2">{link.is_required === false ? 'Optional' : 'Mandatory'}</td>
                        <td className="px-4 py-2">
                          <button type="button" onClick={() => removeLink(link.id)} className="text-xs text-rose-600 hover:underline">
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Organize departments → academic units</h3>
        <p className="text-xs text-slate-500">Assign each department to an academic unit (faculty / school). Academic units belong to the selected institution.</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Department</th>
                <th className="px-4 py-2">Academic unit</th>
              </tr>
            </thead>
            <tbody>
              {departmentsFlat.length === 0 ? (
                <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-500">No departments yet.</td></tr>
              ) : (
                departmentsFlat.map((dept) => (
                  <tr key={dept.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-900">{dept.name} <span className="text-xs text-slate-400">({dept.code})</span></td>
                    <td className="px-4 py-2">
                      <select
                        disabled={savingOrg}
                        value={dept.academic_unit_id ? String(dept.academic_unit_id) : ''}
                        onChange={(e) => reassignDepartmentUnit(dept, e.target.value ? Number(e.target.value) : null)}
                        className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                      >
                        <option value="">— No academic unit —</option>
                        {academicUnits.map((u) => (
                          <option key={u.id} value={String(u.id)}>{u.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Organize programmes → departments</h3>
        <p className="text-xs text-slate-500">Assign each programme to a department so it shows up for applicants under the right structure.</p>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Programme</th>
                <th className="px-4 py-2">Department</th>
              </tr>
            </thead>
            <tbody>
              {programmes.length === 0 ? (
                <tr><td colSpan={2} className="px-4 py-6 text-center text-slate-500">No programmes yet.</td></tr>
              ) : (
                programmes.map((prog) => (
                  <tr key={prog.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-900">{prog.name} <span className="text-xs text-slate-400">({prog.code})</span></td>
                    <td className="px-4 py-2">
                      <select
                        disabled={savingOrg}
                        value={prog.department_id ? String(prog.department_id) : ''}
                        onChange={(e) => e.target.value && reassignProgrammeDepartment(prog, Number(e.target.value))}
                        className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                      >
                        <option value="">— Select department —</option>
                        {departmentsFlat.map((d) => (
                          <option key={d.id} value={String(d.id)}>{d.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-2 font-semibold text-slate-900">Department → Programme structure</h3>
        <p className="mb-3 text-xs text-slate-500">Read-only view of how departments and programmes are linked.</p>
        {units.length === 0 && unassignedDepartments.length === 0 ? (
          <p className="text-sm text-slate-500">No structure configured yet.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {units.map((unit) => (
              <div key={unit.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="font-semibold text-slate-900">{unit.name}</p>
                {(unit.departments || []).map((dept) => (
                  <div key={dept.id} className="ml-3 mt-2 border-l-2 border-violet-200 pl-3">
                    <p className="font-medium text-slate-800">{dept.name}</p>
                    {(dept.programmes || []).map((prog) => (
                      <p key={prog.id} className="ml-2 text-xs text-emerald-700">
                        ↳ {prog.name}
                        {(prog.program_subjects || []).length > 0 ? ` · ${prog.program_subjects!.length} subject(s)` : ''}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            {unassignedDepartments.map((dept) => (
              <div key={dept.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="font-medium text-amber-900">{dept.name} (no academic unit)</p>
                {(dept.programmes || []).map((prog) => (
                  <p key={prog.id} className="ml-2 text-xs text-emerald-800">↳ {prog.name}</p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
