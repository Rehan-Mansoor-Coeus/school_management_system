import { useEffect, useState } from 'react'
import {
  createCourse,
  deleteCourse,
  fetchCourses,
  fetchTimetableOptions,
  formatTimetableError,
  updateCourse,
  type TimetableOptions,
} from '../../../api/timetable'
import { useToast } from '../../../components/ui/ToastProvider'
import { useAuth } from '../../../context/AuthContext'

type Course = {
  id: number
  code: string
  name: string
  credit_hours: number
  contact_hours: number
  practical_hours: number
  laboratory_hours: number
  level?: string | null
  is_active: boolean
  department?: { id: number; name: string } | null
  programme?: { id: number; name: string; code?: string } | null
  programme_semester?: { id: number; name: string } | null
  department_id?: number | null
  programme_id?: number | null
  programme_semester_id?: number | null
  description?: string | null
}

const empty = {
  code: '',
  name: '',
  department_id: '',
  programme_id: '',
  programme_semester_id: '',
  credit_hours: '3',
  contact_hours: '45',
  practical_hours: '0',
  laboratory_hours: '0',
  level: '',
  is_active: true,
  description: '',
}

export default function CoursesPage() {
  const { pushToast } = useToast()
  const { canAccess } = useAuth()
  const canManage = canAccess({ permissions: ['timetable.courses.manage', 'timetable.manage'] })
  const canDelete = canAccess({ permissions: ['timetable.courses.manage', 'timetable.delete', 'timetable.manage'] })

  const [courses, setCourses] = useState<Course[]>([])
  const [options, setOptions] = useState<TimetableOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>(empty)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [list, opts] = await Promise.all([fetchCourses(), fetchTimetableOptions()])
      setCourses(list as Course[])
      setOptions(opts)
    } catch (error) {
      pushToast(formatTimetableError(error, 'Failed to load courses'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(empty)
    setShowForm(true)
  }

  const openEdit = (course: Course) => {
    setEditing(course)
    setForm({
      code: course.code,
      name: course.name,
      department_id: course.department_id ?? '',
      programme_id: course.programme_id ?? '',
      programme_semester_id: course.programme_semester_id ?? '',
      credit_hours: String(course.credit_hours ?? 0),
      contact_hours: String(course.contact_hours ?? 0),
      practical_hours: String(course.practical_hours ?? 0),
      laboratory_hours: String(course.laboratory_hours ?? 0),
      level: course.level ?? '',
      is_active: course.is_active,
      description: course.description ?? '',
    })
    setShowForm(true)
  }

  const submit = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        department_id: form.department_id || null,
        programme_id: form.programme_id || null,
        programme_semester_id: form.programme_semester_id || null,
        credit_hours: Number(form.credit_hours) || 0,
        contact_hours: Number(form.contact_hours) || 0,
        practical_hours: Number(form.practical_hours) || 0,
        laboratory_hours: Number(form.laboratory_hours) || 0,
      }
      if (editing) {
        await updateCourse(editing.id, payload)
        pushToast('Course updated.', 'success')
      } else {
        await createCourse(payload)
        pushToast('Course created.', 'success')
      }
      setShowForm(false)
      await load()
    } catch (error) {
      pushToast(formatTimetableError(error, 'Failed to save course'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (course: Course) => {
    if (!window.confirm(`Delete course ${course.code}?`)) return
    try {
      await deleteCourse(course.id)
      pushToast('Course deleted.', 'success')
      await load()
    } catch (error) {
      pushToast(formatTimetableError(error, 'Failed to delete course'), 'error')
    }
  }

  const semestersForProgramme = (options?.programme_semesters || []).filter(
    (s) => !form.programme_id || s.programme_id === Number(form.programme_id),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Courses</h2>
        {canManage && (
          <button onClick={openCreate} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800">
            + New Course
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Programme</th>
              <th className="px-4 py-3">Credit</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Practical</th>
              <th className="px-4 py-3">Lab</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
            ) : courses.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-400">No courses yet.</td></tr>
            ) : (
              courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.code}</td>
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.department?.name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{c.programme?.name || '-'}</td>
                  <td className="px-4 py-3">{c.credit_hours}</td>
                  <td className="px-4 py-3">{c.contact_hours}</td>
                  <td className="px-4 py-3">{c.practical_hours}</td>
                  <td className="px-4 py-3">{c.laboratory_hours}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage && <button onClick={() => openEdit(c)} className="text-sm font-medium text-blue-600 hover:underline">Edit</button>}
                    {canDelete && <button onClick={() => remove(c)} className="ml-3 text-sm font-medium text-red-600 hover:underline">Delete</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">{editing ? 'Edit Course' : 'New Course'}</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Course Code *">
                <input value={String(form.code)} onChange={(e) => setForm({ ...form, code: e.target.value })} className="ttinput" />
              </Field>
              <Field label="Course Name *">
                <input value={String(form.name)} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ttinput" />
              </Field>
              <Field label="Department">
                <select value={String(form.department_id)} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="ttinput">
                  <option value="">—</option>
                  {options?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
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
              <Field label="Level">
                <input value={String(form.level)} onChange={(e) => setForm({ ...form, level: e.target.value })} className="ttinput" placeholder="e.g. 100" />
              </Field>
              <Field label="Credit Hours">
                <input type="number" value={String(form.credit_hours)} onChange={(e) => setForm({ ...form, credit_hours: e.target.value })} className="ttinput" />
              </Field>
              <Field label="Contact Hours">
                <input type="number" value={String(form.contact_hours)} onChange={(e) => setForm({ ...form, contact_hours: e.target.value })} className="ttinput" />
              </Field>
              <Field label="Practical Hours">
                <input type="number" value={String(form.practical_hours)} onChange={(e) => setForm({ ...form, practical_hours: e.target.value })} className="ttinput" />
              </Field>
              <Field label="Laboratory Hours">
                <input type="number" value={String(form.laboratory_hours)} onChange={(e) => setForm({ ...form, laboratory_hours: e.target.value })} className="ttinput" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={Boolean(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4" />
                Active
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={submit} disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}
