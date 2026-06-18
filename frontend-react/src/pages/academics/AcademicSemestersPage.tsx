import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/ui/Modal'
import FormSelect from '../../components/ui/FormSelect'
import { useToast } from '../../components/ui/ToastProvider'
import { useAcademicInstitutionParams } from '../../context/AcademicInstitutionContext'
import { createSemester, fetchPrograms, fetchSemesters, updateSemester } from '../../api/admin'

type Semester = {
  id: number
  name: string
  semester_number: number
  start_date?: string
  end_date?: string
  academic_year?: string
  is_active: boolean
  programme?: { id: number; name: string }
}

const emptyForm = {
  programme_id: '',
  semester_number: '1',
  name: 'Semester 1',
  start_date: '',
  end_date: '',
  academic_year: '',
  is_active: true,
}

export default function AcademicSemestersPage() {
  const { pushToast } = useToast()
  const { institutionId, requiresSelection, params } = useAcademicInstitutionParams()
  const [rows, setRows] = useState<Semester[]>([])
  const [programs, setPrograms] = useState<{ id: number; name: string; semester_count?: number }[]>([])
  const [programFilter, setProgramFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Semester | null>(null)
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    if (requiresSelection && !institutionId) {
      setRows([])
      setPrograms([])
      return
    }
    try {
      const [semRes, progRes] = await Promise.all([
        fetchSemesters(programFilter ? { ...params, programme_id: programFilter } : params),
        fetchPrograms(params),
      ])
      setRows(semRes.data)
      setPrograms(progRes.data)
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to load semesters', 'error')
    }
  }

  useEffect(() => {
    load()
  }, [programFilter, institutionId])

  const usedNumbersForProgram = useMemo(() => {
    if (!form.programme_id) return new Set<number>()
    return new Set(
      rows.filter((r) => String(r.programme?.id) === form.programme_id).map((r) => r.semester_number)
    )
  }, [form.programme_id, rows])

  const nextSemesterNumber = useMemo(() => {
    if (!form.programme_id) return 1
    const used = usedNumbersForProgram
    let n = 1
    while (used.has(n)) n += 1
    return n
  }, [form.programme_id, usedNumbersForProgram])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (row: Semester) => {
    setEditing(row)
    setForm({
      programme_id: String(row.programme?.id || ''),
      semester_number: String(row.semester_number),
      name: row.name,
      start_date: row.start_date?.slice(0, 10) || '',
      end_date: row.end_date?.slice(0, 10) || '',
      academic_year: row.academic_year || '',
      is_active: row.is_active,
    })
    setOpen(true)
  }

  const onProgramChange = (programmeId: string) => {
    const used = new Set(
      rows.filter((r) => String(r.programme?.id) === programmeId).map((r) => r.semester_number)
    )
    let n = 1
    while (used.has(n)) n += 1
    setForm((f) => ({
      ...f,
      programme_id: programmeId,
      semester_number: String(n),
      name: `Semester ${n}`,
    }))
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (requiresSelection && !institutionId) {
      pushToast('Select an institution first.', 'error')
      return
    }
    const payload = {
      ...form,
      ...params,
      programme_id: Number(form.programme_id),
      semester_number: Number(form.semester_number),
    }
    try {
      if (editing) {
        await updateSemester(editing.id, payload)
        pushToast('Semester updated.')
      } else {
        await createSemester(payload)
        pushToast('Semester created.')
      }
      setOpen(false)
      load()
    } catch (e: any) {
      const msg = e?.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' ')
        : e?.response?.data?.message
      pushToast(
        msg ||
          'Save failed. Programs auto-create semesters when created — edit an existing semester or pick the next semester number.',
        'error'
      )
    }
  }

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Programs automatically create semesters when registered. Use this page to set dates, academic year, and names — click a row to edit, or add only if a semester number is not yet used.
      </p>

      <div className="flex flex-wrap gap-3">
        <FormSelect
          value={programFilter}
          onChange={setProgramFilter}
          options={[{ value: '', label: 'All programs' }, ...programs.map((p) => ({ value: String(p.id), label: p.name }))]}
          className="min-w-[220px]"
        />
        <button type="button" onClick={openCreate} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Add Semester
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No semesters found. Create a program first — semesters are auto-generated.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{row.programme?.name}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">
                    {row.start_date || '—'} → {row.end_date || '—'}
                  </td>
                  <td className="px-4 py-3">{row.academic_year || '—'}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => openEdit(row)} className="text-blue-600 text-xs font-medium">
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? 'Edit Semester' : 'Add Semester'} open onClose={() => setOpen(false)}>
          <form onSubmit={save} className="grid gap-3">
            <FormSelect
              value={form.programme_id}
              onChange={onProgramChange}
              options={programs.map((p) => ({ value: String(p.id), label: p.name }))}
              placeholder="Select program"
              required
              disabled={Boolean(editing)}
            />
            {!editing && form.programme_id && usedNumbersForProgram.has(Number(form.semester_number)) && (
              <p className="text-xs text-amber-700">
                Semester {form.semester_number} already exists for this program. Suggested next: {nextSemesterNumber}.
              </p>
            )}
            <input
              required
              type="number"
              min={1}
              value={form.semester_number}
              onChange={(e) => setForm({ ...form, semester_number: e.target.value, name: `Semester ${e.target.value}` })}
              className="rounded-xl border px-3 py-2"
              placeholder="Semester number"
              disabled={Boolean(editing)}
            />
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border px-3 py-2"
              placeholder="Semester name"
            />
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="rounded-xl border px-3 py-2"
            />
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="rounded-xl border px-3 py-2"
            />
            <input
              value={form.academic_year}
              onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
              className="rounded-xl border px-3 py-2"
              placeholder="Academic year (e.g. 2025/2026)"
            />
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              {editing ? 'Update' : 'Save'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
