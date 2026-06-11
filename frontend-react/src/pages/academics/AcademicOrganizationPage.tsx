import React, { useCallback, useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import FormSelect from '../../components/ui/FormSelect'
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
  semesters?: Array<{ id: number; name: string; semester_number: number; start_date?: string; end_date?: string }>
  program_subjects?: Array<{
    id: number
    subject?: { id: number; name: string; code?: string }
    is_required?: boolean
    semester?: { id: number; name: string }
  }>
}

type TreeUnit = {
  id: number
  name: string
  unit_type: string
  departments?: Array<{ id: number; name: string; programmes?: TreeProgram[] }>
}

type DeptOption = { id: number; name: string; code: string; academic_unit_id?: number | null; academic_unit?: { name: string } }
type ProgramOption = {
  id: number
  name: string
  code: string
  department_id?: number
  duration_years?: number
  level?: string
  semester_count?: number
  department?: { name: string }
}
type SubjectOption = { id: number; name: string; code?: string }
type ProgramLink = {
  id: number
  programme_id: number
  subject_id: number
  programme_semester_id?: number | null
  is_required?: boolean
  programme?: ProgramOption
  subject?: SubjectOption
  semester?: { id: number; name: string }
}

export default function AcademicOrganizationPage() {
  const { pushToast } = useToast()
  const { institutionId, requiresSelection, params } = useAcademicInstitutionParams()

  const [institution, setInstitution] = useState<{ id: number; name: string } | null>(null)
  const [units, setUnits] = useState<TreeUnit[]>([])
  const [unassignedDepartments, setUnassignedDepartments] = useState<Array<{ id: number; name: string; programmes?: TreeProgram[] }>>([])
  const [departments, setDepartments] = useState<DeptOption[]>([])
  const [programmes, setProgrammes] = useState<ProgramOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [programLinks, setProgramLinks] = useState<ProgramLink[]>([])
  const [loading, setLoading] = useState(false)

  const [deptLinkForm, setDeptLinkForm] = useState({ department_id: '', academic_unit_id: '' })
  const [progLinkForm, setProgLinkForm] = useState({ programme_id: '', department_id: '' })
  const [subjectLinkForm, setSubjectLinkForm] = useState({
    programme_id: '',
    subject_id: '',
    programme_semester_id: '',
    is_required: true,
  })

  const load = useCallback(async () => {
    if (requiresSelection && !institutionId) {
      setInstitution(null)
      setUnits([])
      setUnassignedDepartments([])
      setDepartments([])
      setProgrammes([])
      setSubjects([])
      setProgramLinks([])
      return
    }
    setLoading(true)
    try {
      const res = await fetchOrganizationTree(params)
      setInstitution(res.data.institution)
      setUnits(res.data.academic_units || [])
      setUnassignedDepartments(res.data.unassigned_departments || [])
      setDepartments(res.data.departments || [])
      setProgrammes(res.data.programmes || [])
      setSubjects(res.data.subjects || [])
      setProgramLinks(res.data.program_links || [])
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to load organization', 'error')
    } finally {
      setLoading(false)
    }
  }, [institutionId, params, pushToast, requiresSelection])

  useEffect(() => {
    load()
  }, [load])

  const unitOptions = units.map((u) => ({ value: String(u.id), label: `${u.name} (${u.unit_type.replace('_', ' ')})` }))
  const deptOptions = departments.map((d) => ({
    value: String(d.id),
    label: d.code ? `${d.name} (${d.code})` : d.name,
  }))
  const programOptions = programmes.map((p) => ({
    value: String(p.id),
    label: p.department ? `${p.name} — ${p.department.name}` : p.name,
  }))
  const subjectOptions = subjects.map((s) => ({
    value: String(s.id),
    label: s.code ? `${s.name} (${s.code})` : s.name,
  }))

  const selectedProgramTree = [...units.flatMap((u) => u.departments || []), ...unassignedDepartments]
    .flatMap((d) => d.programmes || [])
    .find((p) => String(p.id) === subjectLinkForm.programme_id)
  const semesterOptions = (selectedProgramTree?.semesters || []).map((s) => ({
    value: String(s.id),
    label: s.name,
  }))

  const linkDepartmentToUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deptLinkForm.department_id || !deptLinkForm.academic_unit_id) return
    const dept = departments.find((d) => String(d.id) === deptLinkForm.department_id)
    if (!dept) return
    try {
      await updateDepartment(Number(deptLinkForm.department_id), {
        ...params,
        name: dept.name,
        code: dept.code,
        academic_unit_id: Number(deptLinkForm.academic_unit_id),
      })
      pushToast('Department linked to academic unit.')
      setDeptLinkForm({ department_id: '', academic_unit_id: '' })
      load()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to link department', 'error')
    }
  }

  const linkProgramToDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!progLinkForm.programme_id || !progLinkForm.department_id) return
    const program = programmes.find((p) => String(p.id) === progLinkForm.programme_id)
    if (!program) return
    try {
      await updateProgram(Number(progLinkForm.programme_id), {
        ...params,
        name: program.name,
        code: program.code,
        department_id: Number(progLinkForm.department_id),
        duration_years: program.duration_years || 1,
        level: program.level || 'bachelor',
        semester_count: program.semester_count || 2,
      })
      pushToast('Program linked to department.')
      setProgLinkForm({ programme_id: '', department_id: '' })
      load()
    } catch (e: any) {
      const msg = e?.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' ')
        : e?.response?.data?.message
      pushToast(msg || 'Failed to link program', 'error')
    }
  }

  const linkSubjectToProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectLinkForm.programme_id || !subjectLinkForm.subject_id) return
    try {
      await createProgramSubject({
        ...params,
        programme_id: Number(subjectLinkForm.programme_id),
        subject_id: Number(subjectLinkForm.subject_id),
        programme_semester_id: subjectLinkForm.programme_semester_id
          ? Number(subjectLinkForm.programme_semester_id)
          : null,
        is_required: subjectLinkForm.is_required,
      })
      pushToast('Subject linked to program.')
      setSubjectLinkForm({ programme_id: '', subject_id: '', programme_semester_id: '', is_required: true })
      load()
    } catch (e: any) {
      const msg = e?.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' ')
        : e?.response?.data?.message
      pushToast(msg || 'Failed to link subject', 'error')
    }
  }

  const removeProgramSubject = async (id: number) => {
    if (!window.confirm('Remove this subject from the program?')) return
    try {
      await deleteProgramSubject(id)
      pushToast('Link removed.')
      load()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to remove link', 'error')
    }
  }

  const renderProgram = (prog: TreeProgram) => (
    <div key={prog.id} className="ml-4 border-l-2 border-emerald-200 pl-3">
      <p className="text-sm font-medium text-slate-800">↳ {prog.name}</p>
      {(prog.semesters || []).length > 0 && (
        <div className="mt-1 space-y-0.5 border-l-2 border-amber-200 pl-3">
          {prog.semesters!.map((sem) => (
            <p key={sem.id} className="text-xs text-slate-600">
              ↳ {sem.name}
              {sem.start_date ? ` (${sem.start_date} → ${sem.end_date || '—'})` : ''}
            </p>
          ))}
        </div>
      )}
      {(prog.program_subjects || []).length > 0 && (
        <div className="mt-1 space-y-0.5 border-l-2 border-teal-200 pl-3">
          {prog.program_subjects!.map((link) => (
            <p key={link.id} className="text-xs text-teal-700">
              ↳ {link.subject?.name || 'Subject'}
              {link.semester ? ` · ${link.semester.name}` : ''}
              {link.is_required === false ? ' (elective)' : ' (required)'}
            </p>
          ))}
        </div>
      )}
    </div>
  )

  if (requiresSelection && !institutionId) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Select a working institution above to manage organization links.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Institution</p>
        <p className="mt-1 text-lg font-bold text-slate-900">{loading ? 'Loading…' : institution?.name || '—'}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <form onSubmit={linkDepartmentToUnit} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <h3 className="font-semibold text-slate-900">Link Department → Unit</h3>
          <p className="text-xs text-slate-500">Assign a department to an academic unit (school/faculty).</p>
          <FormSelect
            value={deptLinkForm.department_id}
            onChange={(v) => setDeptLinkForm((f) => ({ ...f, department_id: v }))}
            options={deptOptions}
            placeholder="Select department"
          />
          <FormSelect
            value={deptLinkForm.academic_unit_id}
            onChange={(v) => setDeptLinkForm((f) => ({ ...f, academic_unit_id: v }))}
            options={unitOptions}
            placeholder="Select academic unit"
          />
          <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Link Department
          </button>
        </form>

        <form onSubmit={linkProgramToDepartment} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <h3 className="font-semibold text-slate-900">Link Program → Department</h3>
          <p className="text-xs text-slate-500">Move or assign a program under a department.</p>
          <FormSelect
            value={progLinkForm.programme_id}
            onChange={(v) => setProgLinkForm((f) => ({ ...f, programme_id: v }))}
            options={programOptions}
            placeholder="Select program"
          />
          <FormSelect
            value={progLinkForm.department_id}
            onChange={(v) => setProgLinkForm((f) => ({ ...f, department_id: v }))}
            options={deptOptions}
            placeholder="Select department"
          />
          <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Link Program
          </button>
        </form>

        <form onSubmit={linkSubjectToProgram} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <h3 className="font-semibold text-slate-900">Link Subject → Program</h3>
          <p className="text-xs text-slate-500">Attach a course to a program and optional semester.</p>
          <FormSelect
            value={subjectLinkForm.programme_id}
            onChange={(v) => setSubjectLinkForm((f) => ({ ...f, programme_id: v, programme_semester_id: '' }))}
            options={programOptions}
            placeholder="Select program"
          />
          <FormSelect
            value={subjectLinkForm.subject_id}
            onChange={(v) => setSubjectLinkForm((f) => ({ ...f, subject_id: v }))}
            options={subjectOptions}
            placeholder="Select subject"
          />
          {semesterOptions.length > 0 && (
            <FormSelect
              value={subjectLinkForm.programme_semester_id}
              onChange={(v) => setSubjectLinkForm((f) => ({ ...f, programme_semester_id: v }))}
              options={[{ value: '', label: 'Any semester' }, ...semesterOptions]}
              placeholder="Semester (optional)"
            />
          )}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={subjectLinkForm.is_required}
              onChange={(e) => setSubjectLinkForm((f) => ({ ...f, is_required: e.target.checked }))}
            />
            Required course
          </label>
          <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Link Subject
          </button>
        </form>
      </div>

      {programLinks.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-900">Program ↔ Subject links</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2">Program</th>
                  <th className="px-3 py-2">Subject</th>
                  <th className="px-3 py-2">Semester</th>
                  <th className="px-3 py-2">Required</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programLinks.map((link) => (
                  <tr key={link.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{link.programme?.name || `#${link.programme_id}`}</td>
                    <td className="px-3 py-2">{link.subject?.name || `#${link.subject_id}`}</td>
                    <td className="px-3 py-2">{link.semester?.name || '—'}</td>
                    <td className="px-3 py-2">{link.is_required === false ? 'No' : 'Yes'}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeProgramSubject(link.id)} className="text-rose-600 text-xs">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 font-semibold text-slate-900">Organization tree</h3>
        {units.length === 0 && unassignedDepartments.length === 0 ? (
          <p className="text-sm text-slate-500">No structure yet. Create academic units, departments, and programs first.</p>
        ) : (
          <div className="space-y-4">
            {units.map((unit) => (
              <div key={unit.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-900">
                  {unit.name}{' '}
                  <span className="text-sm font-normal text-slate-500">({unit.unit_type.replace('_', ' ')})</span>
                </p>
                <div className="mt-2 space-y-2">
                  {(unit.departments || []).length === 0 ? (
                    <p className="ml-4 text-xs text-slate-400">No departments linked to this unit.</p>
                  ) : (
                    (unit.departments || []).map((dept) => (
                      <div key={dept.id}>
                        <p className="ml-2 font-medium text-slate-800">↳ {dept.name}</p>
                        {(dept.programmes || []).map(renderProgram)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}

            {unassignedDepartments.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="font-semibold text-amber-900">Departments not assigned to a unit</p>
                <div className="mt-2 space-y-2">
                  {unassignedDepartments.map((dept) => (
                    <div key={dept.id}>
                      <p className="font-medium text-slate-800">↳ {dept.name}</p>
                      {(dept.programmes || []).map(renderProgram)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
