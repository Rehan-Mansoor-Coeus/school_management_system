import { FormEvent, useEffect, useState } from 'react'
import { fetchTimesheetActivities, submitStaffEntry } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function MyStaffTimesheetPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [form, setForm] = useState<any>({
    date: '',
    activity_id: '',
    actual_start_time: '',
    actual_end_time: '',
    description: '',
    remarks: '',
  })
  const { pushToast } = useToast()

  useEffect(() => {
    fetchTimesheetActivities().then((res) => setActivities(res.data || [])).catch(() => pushToast('Failed to load activities', 'error'))
  }, [])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await submitStaffEntry({
        ...form,
        activity_id: form.activity_id ? Number(form.activity_id) : null,
        submit: true,
      })
      pushToast('Staff timesheet submitted.')
      setForm({ date: '', activity_id: '', actual_start_time: '', actual_end_time: '', description: '', remarks: '' })
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to submit staff timesheet', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">My Staff Timesheet</h2>
      <form onSubmit={save} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <input type="date" required value={form.date} onChange={(e) => setForm((p: any) => ({ ...p, date: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <select value={form.activity_id} onChange={(e) => setForm((p: any) => ({ ...p, activity_id: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2">
          <option value="">Activity</option>
          {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <input type="time" required value={form.actual_start_time} onChange={(e) => setForm((p: any) => ({ ...p, actual_start_time: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <input type="time" required value={form.actual_end_time} onChange={(e) => setForm((p: any) => ({ ...p, actual_end_time: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2" />
        <textarea value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} placeholder="Description" className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2" />
        <textarea value={form.remarks} onChange={(e) => setForm((p: any) => ({ ...p, remarks: e.target.value }))} placeholder="Remarks" className="rounded-xl border border-slate-200 px-3 py-2 sm:col-span-2" />
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-white sm:w-fit">Submit</button>
      </form>
    </div>
  )
}
