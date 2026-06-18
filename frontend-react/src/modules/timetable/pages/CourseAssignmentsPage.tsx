import { useEffect, useState } from 'react'
import {
  createAssignment,
  deleteAssignment,
  fetchAssignments,
  fetchTimetableOptions,
  formatTimetableError,
  type TimetableOptions,
} from '../../../api/timetable'
import { useToast } from '../../../components/ui/ToastProvider'
import { useAuth } from '../../../context/AuthContext'
import { Field, Modal } from '../components/ttui'

type Assignment = {
  id: number
  expected_contact_hours: number
  completed_contact_hours: number
  course?: { id: number; code: string; name: string } | null
  teacher?: { id: number; name: string } | null
  classroom?: { id: number; name: string } | null
  programme?: { id: number; name: string } | null
  programme_semester?: { id: number; name: string } | null
}

const empty = {
  course_id: '',
  teacher_id: '',
  classroom_id: '',
  programme_id: '',
  programme_semester_id: '',
  academic_year: '',
  expected_contact_hours: '45',
}

export default function CourseAssignmentsPage() {
  const { pushToast } = useToast()
  const { canAccess } = useAuth()
  const canManage = canAccess({ permissions: ['timetable.assignments.manage', 'timetable.manage'] })

  const [items, setItems] = useState<Assignment[]>([])
  const [options, setOptions] = useState<TimetableOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Record<string, unknown>>(empty)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [list, opts] = await Promise.all([fetchAssignments(), fetchTimetableOptions()])
      setItems(list as Assignment[])
      setOptions(opts)
    } catch (error) {
      pushToast(formatTimetableError(error, 'Failed to load assignments'), 'error')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  const submit = async () => {
    setSaving(true)
    try {
      await createAssignment({
        ...form,
        classroom_id: form.classroom_id || null,
        programme_id: form.programme_id || null,
        programme_semester_id: form.programme_semester_id || null,
        expected_contact_hours: Number(form.expected_contact_hours) || 0,
      })
      pushToast('Course assigned.', 'success')
      setShowForm(false); setForm(empty); await load()
    } catch (error) {
      pushToast(formatTimetableError(error, 'Failed to assign course'), 'error')
    } finally { setSaving(false) }
  }

  const remove = async (a: Assignment) => {
    if (!window.confirm('Remove this assignment?')) return
    try { await deleteAssignment(a.id); pushToast('Assignment removed.', 'success'); await load() }
    catch (error) { pushToast(formatTimetableError(error, 'Failed to remove'), 'error') }
  }

  const onCourseChange = (courseId: string) => {
    const course = options?.courses.find((c) => c.id === Number(courseId))
    setForm({
      ...form,
      course_id: courseId,
      programme_id: course?.programme_id ?? form.programme_id,
      programme_semester_id: course?.programme_semester_id ?? form.programme_semester_id,
      expected_contact_hours: course?.contact_hours ? String(course.contact_hours) : form.expected_contact_hours,
    })
  }

  const semestersForProgramme = (options?.programme_semesters || []).filter((s) => !form.programme_id || s.programme_id === Number(form.programme_id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Course Assignments</h2>
        {canManage && <button onClick={() => { setForm(empty); setShowForm(true) }} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800">+ Assign Course</button>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Course</th><th className="px-4 py-3">Teacher</th><th className="px-4 py-3">Classroom</th><th className="px-4 py-3">Programme</th><th className="px-4 py-3">Semester</th><th className="px-4 py-3">Expected</th><th className="px-4 py-3">Completed</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
              : items.length === 0 ? <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">No assignments yet.</td></tr>
              : items.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.course ? `${a.course.code} — ${a.course.name}` : '-'}</td>
                  <td className="px-4 py-3">{a.teacher?.name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.classroom?.name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.programme?.name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.programme_semester?.name || '-'}</td>
                  <td className="px-4 py-3">{a.expected_contact_hours} h</td>
                  <td className="px-4 py-3">{a.completed_contact_hours} h</td>
                  <td className="px-4 py-3 text-right">{canManage && <button onClick={() => remove(a)} className="text-sm font-medium text-red-600 hover:underline">Remove</button>}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Assign Course" onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Course *">
              <select value={String(form.course_id)} onChange={(e) => onCourseChange(e.target.value)} className="ttinput">
                <option value="">Select course…</option>
                {options?.courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </Field>
            <Field label="Teacher *">
              <select value={String(form.teacher_id)} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} className="ttinput">
                <option value="">Select teacher…</option>
                {options?.teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Classroom">
              <select value={String(form.classroom_id)} onChange={(e) => setForm({ ...form, classroom_id: e.target.value })} className="ttinput">
                <option value="">—</option>
                {options?.classrooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="Programme">
              <select value={String(form.programme_id)} onChange={(e) => setForm({ ...form, programme_id: e.target.value, programme_semester_id: '' })} className="ttinput">
                <option value="">—</option>
                {options?.programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Semester">
              <select value={String(form.programme_semester_id)} onChange={(e) => setForm({ ...form, programme_semester_id: e.target.value })} className="ttinput">
                <option value="">—</option>
                {semestersForProgramme.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Academic Year"><input value={String(form.academic_year)} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} className="ttinput" placeholder="2026/2027" /></Field>
            <Field label="Expected Contact Hours"><input type="number" value={String(form.expected_contact_hours)} onChange={(e) => setForm({ ...form, expected_contact_hours: e.target.value })} className="ttinput" /></Field>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
            <button onClick={submit} disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Assign'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
