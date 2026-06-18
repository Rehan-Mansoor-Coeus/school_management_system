import { useEffect, useState } from 'react'
import {
  createLesson,
  deleteLesson,
  fetchAssignments,
  fetchLessons,
  formatTimetableError,
} from '../../../api/timetable'
import { useToast } from '../../../components/ui/ToastProvider'
import { useAuth } from '../../../context/AuthContext'
import { Field, Modal } from '../components/ttui'

type Lesson = {
  id: number
  lesson_date: string
  start_time?: string | null
  end_time?: string | null
  duration_hours: number
  topic?: string | null
  remarks?: string | null
  course?: { code: string; name: string } | null
  teacher?: { name: string } | null
}

type Assignment = {
  id: number
  course?: { id: number; code: string; name: string } | null
  course_id?: number
  expected_contact_hours: number
  completed_contact_hours: number
}

const empty = { assignment_id: '', lesson_date: new Date().toISOString().slice(0, 10), start_time: '', end_time: '', duration_hours: '', topic: '', remarks: '' }

export default function LessonLogPage() {
  const { pushToast } = useToast()
  const { canAccess } = useAuth()
  const canLog = canAccess({ permissions: ['timetable.lessons.log', 'timetable.manage'] })

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Record<string, unknown>>(empty)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [logs, asg] = await Promise.all([fetchLessons(), fetchAssignments()])
      setLessons(logs as Lesson[])
      setAssignments(asg as Assignment[])
    } catch (error) { pushToast(formatTimetableError(error, 'Failed to load lessons'), 'error') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  const submit = async () => {
    if (!form.assignment_id) { pushToast('Select a course assignment.', 'error'); return }
    const asg = assignments.find((a) => a.id === Number(form.assignment_id))
    setSaving(true)
    try {
      await createLesson({
        assignment_id: Number(form.assignment_id),
        course_id: asg?.course?.id ?? asg?.course_id,
        lesson_date: form.lesson_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
        topic: form.topic || null,
        remarks: form.remarks || null,
      })
      pushToast('Lesson recorded.', 'success')
      setShowForm(false); setForm(empty); await load()
    } catch (error) { pushToast(formatTimetableError(error, 'Failed to record lesson'), 'error') }
    finally { setSaving(false) }
  }

  const remove = async (l: Lesson) => {
    if (!window.confirm('Delete this lesson record? Contact hours will be recalculated.')) return
    try { await deleteLesson(l.id); pushToast('Lesson deleted.', 'success'); await load() }
    catch (error) { pushToast(formatTimetableError(error, 'Failed to delete'), 'error') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Lesson Logs</h2>
        {canLog && <button onClick={() => { setForm(empty); setShowForm(true) }} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800">+ Record Lesson</button>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Teacher</th><th className="px-4 py-3">Time</th><th className="px-4 py-3">Hours</th><th className="px-4 py-3">Topic</th><th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
              : lessons.length === 0 ? <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No lessons recorded yet.</td></tr>
              : lessons.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">{l.lesson_date}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{l.course ? `${l.course.code} ${l.course.name}` : '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{l.teacher?.name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{l.start_time && l.end_time ? `${String(l.start_time).slice(0, 5)}–${String(l.end_time).slice(0, 5)}` : '-'}</td>
                  <td className="px-4 py-3">{l.duration_hours} h</td>
                  <td className="px-4 py-3 text-slate-600">{l.topic || '-'}</td>
                  <td className="px-4 py-3 text-right">{canLog && <button onClick={() => remove(l)} className="text-sm font-medium text-red-600 hover:underline">Delete</button>}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title="Record Lesson" onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Course (assignment) *">
                <select value={String(form.assignment_id)} onChange={(e) => setForm({ ...form, assignment_id: e.target.value })} className="ttinput">
                  <option value="">Select…</option>
                  {assignments.map((a) => <option key={a.id} value={a.id}>{a.course ? `${a.course.code} — ${a.course.name}` : `Assignment #${a.id}`} ({a.completed_contact_hours}/{a.expected_contact_hours}h)</option>)}
                </select>
              </Field>
            </div>
            <Field label="Date *"><input type="date" value={String(form.lesson_date)} onChange={(e) => setForm({ ...form, lesson_date: e.target.value })} className="ttinput" /></Field>
            <Field label="Duration (hours)"><input type="number" step="0.25" value={String(form.duration_hours)} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} className="ttinput" placeholder="auto from times" /></Field>
            <Field label="Start Time"><input type="time" value={String(form.start_time)} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="ttinput" /></Field>
            <Field label="End Time"><input type="time" value={String(form.end_time)} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="ttinput" /></Field>
            <div className="sm:col-span-2"><Field label="Topic Taught"><input value={String(form.topic)} onChange={(e) => setForm({ ...form, topic: e.target.value })} className="ttinput" /></Field></div>
            <div className="sm:col-span-2"><Field label="Remarks"><textarea value={String(form.remarks)} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="ttinput" rows={2} /></Field></div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Provide either a duration or both start and end times. Contact hours update automatically.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600">Cancel</button>
            <button onClick={submit} disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
