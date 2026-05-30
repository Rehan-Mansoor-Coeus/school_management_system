import { FormEvent, useEffect, useState } from 'react'
import { fetchUsers } from '../api/admin'
import { fetchWorkingSchedules, upsertWorkingSchedule } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function WorkingScheduleSettingsPage() {
  const [users, setUsers] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [form, setForm] = useState({
    staff_id: '',
    weekday: '1',
    expected_hours: '8',
    effective_from: '',
    effective_to: '',
  })
  const { pushToast } = useToast()

  const load = async () => {
    try {
      const [usersRes, schedulesRes] = await Promise.all([fetchUsers(), fetchWorkingSchedules()])
      setUsers(usersRes.data || [])
      setSchedules(schedulesRes.data || [])
    } catch {
      pushToast('Unable to load working schedules', 'error')
    }
  }

  useEffect(() => { load() }, [])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await upsertWorkingSchedule({
        staff_id: Number(form.staff_id),
        weekday: Number(form.weekday),
        expected_hours: Number(form.expected_hours),
        effective_from: form.effective_from,
        effective_to: form.effective_to || null,
      })
      pushToast('Schedule saved.')
      setForm({ staff_id: '', weekday: '1', expected_hours: '8', effective_from: '', effective_to: '' })
      load()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to save schedule', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Working Schedule Settings</h2>
        <p className="text-sm text-slate-500">Configure expected daily working hours per staff member.</p>
      </div>

      <form onSubmit={save} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        <select required value={form.staff_id} onChange={(e) => setForm((p) => ({ ...p, staff_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Select staff</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={form.weekday} onChange={(e) => setForm((p) => ({ ...p, weekday: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="1">Monday</option><option value="2">Tuesday</option><option value="3">Wednesday</option>
          <option value="4">Thursday</option><option value="5">Friday</option><option value="6">Saturday</option><option value="7">Sunday</option>
        </select>
        <input type="number" min="0" max="24" step="0.25" value={form.expected_hours} onChange={(e) => setForm((p) => ({ ...p, expected_hours: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <input type="date" required value={form.effective_from} onChange={(e) => setForm((p) => ({ ...p, effective_from: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <input type="date" value={form.effective_to} onChange={(e) => setForm((p) => ({ ...p, effective_to: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-white">Save Schedule</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50"><tr><th className="px-4 py-3 text-sm font-semibold">Staff</th><th className="px-4 py-3 text-sm font-semibold">Weekday</th><th className="px-4 py-3 text-sm font-semibold">Expected Hours</th><th className="px-4 py-3 text-sm font-semibold">Effective</th></tr></thead>
          <tbody className="divide-y divide-slate-200">
            {schedules.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 text-sm">{users.find((u) => u.id === s.staff_id)?.name || s.staff_id}</td>
                <td className="px-4 py-3 text-sm">{s.weekday}</td>
                <td className="px-4 py-3 text-sm">{s.expected_hours}</td>
                <td className="px-4 py-3 text-sm">{s.effective_from} - {s.effective_to || 'Open'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
