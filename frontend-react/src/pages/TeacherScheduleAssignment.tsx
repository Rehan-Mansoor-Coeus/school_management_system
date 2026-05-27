import { FormEvent, useEffect, useState } from 'react'
import { createTeacherSchedule, fetchTeacherSchedules, fetchTimesheetReferences, fetchShiftTypes } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function TeacherScheduleAssignmentPage() {
  const [refs, setRefs] = useState<any>({})
  const [shiftTypes, setShiftTypes] = useState<any[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [form, setForm] = useState<any>({
    teacher_id: '',
    course_id: '',
    class_id: '',
    shift_type_id: '',
    day_of_week: '1',
    start_time: '08:00',
    end_time: '08:45',
    course_contact_hour_plan_id: '',
  })
  const { pushToast } = useToast()

  const load = async () => {
    const [refsRes, shiftRes, scheduleRes] = await Promise.all([fetchTimesheetReferences(), fetchShiftTypes(), fetchTeacherSchedules()])
    setRefs(refsRes.data || {})
    setShiftTypes(shiftRes.data || [])
    setRows(scheduleRes.data || [])
  }

  useEffect(() => { load().catch(() => pushToast('Failed to load teacher scheduling data', 'error')) }, [])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createTeacherSchedule({
        ...form,
        teacher_id: Number(form.teacher_id),
        course_id: form.course_id ? Number(form.course_id) : null,
        class_id: form.class_id ? Number(form.class_id) : null,
        shift_type_id: Number(form.shift_type_id),
        day_of_week: Number(form.day_of_week),
        course_contact_hour_plan_id: form.course_contact_hour_plan_id ? Number(form.course_contact_hour_plan_id) : null,
      })
      pushToast('Teacher schedule assigned.')
      load()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to assign schedule', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Teacher Schedule Assignment</h2>
      <form onSubmit={save} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <select required value={form.teacher_id} onChange={(e) => setForm((p: any) => ({ ...p, teacher_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Teacher</option>
          {(refs.teachers || []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={form.course_id} onChange={(e) => setForm((p: any) => ({ ...p, course_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Course</option>
          {(refs.courses || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={form.class_id} onChange={(e) => setForm((p: any) => ({ ...p, class_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Class</option>
          {(refs.classes || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select required value={form.shift_type_id} onChange={(e) => setForm((p: any) => ({ ...p, shift_type_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Shift Type</option>
          {shiftTypes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="number" min={1} max={7} value={form.day_of_week} onChange={(e) => setForm((p: any) => ({ ...p, day_of_week: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <input type="time" value={form.start_time} onChange={(e) => setForm((p: any) => ({ ...p, start_time: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <input type="time" value={form.end_time} onChange={(e) => setForm((p: any) => ({ ...p, end_time: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-white">Assign</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50"><tr><th className="px-4 py-3">Teacher</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Day</th><th className="px-4 py-3">Time</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.teacher?.name}</td>
                <td className="px-4 py-3">{row.course?.name}</td>
                <td className="px-4 py-3">{row.class_model?.name}</td>
                <td className="px-4 py-3">{row.day_of_week}</td>
                <td className="px-4 py-3">{row.start_time} - {row.end_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
