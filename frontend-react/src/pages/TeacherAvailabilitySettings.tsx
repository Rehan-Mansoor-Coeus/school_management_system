import { FormEvent, useEffect, useState } from 'react'
import { createTeacherAvailability, fetchTeacherAvailabilities, fetchTimesheetReferences } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function TeacherAvailabilitySettingsPage() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [form, setForm] = useState({ teacher_id: '', day_of_week: '1', start_time: '08:00', end_time: '16:00' })
  const { pushToast } = useToast()

  const load = async () => {
    const [refs, avail] = await Promise.all([fetchTimesheetReferences(), fetchTeacherAvailabilities()])
    setTeachers((refs as any)?.teachers || [])
    setRows(avail || [])
  }

  useEffect(() => { load().catch(() => pushToast('Failed to load teacher availability', 'error')) }, [])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await createTeacherAvailability({
        teacher_id: Number(form.teacher_id),
        day_of_week: Number(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
      })
      pushToast('Availability saved.')
      setForm({ teacher_id: '', day_of_week: '1', start_time: '08:00', end_time: '16:00' })
      load()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to save availability', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Teacher Availability Settings</h2>
      </div>
      <form onSubmit={save} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <select required value={form.teacher_id} onChange={(e) => setForm((p) => ({ ...p, teacher_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Teacher</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input type="number" min={1} max={7} value={form.day_of_week} onChange={(e) => setForm((p) => ({ ...p, day_of_week: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <input type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <input type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-white">Save</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50"><tr><th className="px-4 py-3">Teacher</th><th className="px-4 py-3">Day</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">End</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{teachers.find((t) => t.id === row.teacher_id)?.name || row.teacher_id}</td>
                <td className="px-4 py-3">{row.day_of_week}</td>
                <td className="px-4 py-3">{row.start_time}</td>
                <td className="px-4 py-3">{row.end_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
