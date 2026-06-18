import { FormEvent, useEffect, useState } from 'react'
import { addTimesheetEntry, createOrGetWeeklyTimesheet, fetchTimesheetActivities } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function AddTimesheetEntryPage() {
  const [weekStartDate, setWeekStartDate] = useState('')
  const [timesheetId, setTimesheetId] = useState<number | null>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [form, setForm] = useState({ work_date: '', activity_id: '', hours_worked: '', description: '' })
  const { pushToast } = useToast()

  useEffect(() => {
    fetchTimesheetActivities()
      .then(setActivities)
      .catch(() => pushToast('Unable to load activities', 'error'))
  }, [])

  const prepareWeek = async () => {
    if (!weekStartDate) return
    try {
      const timesheet = await createOrGetWeeklyTimesheet(weekStartDate)
      setTimesheetId(timesheet.id)
      pushToast('Week selected. Add your entries.')
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to open weekly timesheet', 'error')
    }
  }

  const submitEntry = async (event: FormEvent) => {
    event.preventDefault()
    if (!timesheetId) return pushToast('Select a week first.', 'error')
    try {
      await addTimesheetEntry(timesheetId, {
        ...form,
        activity_id: Number(form.activity_id),
        hours_worked: Number(form.hours_worked),
      })
      setForm({ work_date: '', activity_id: '', hours_worked: '', description: '' })
      pushToast('Entry added successfully.')
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to add entry', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Add Timesheet Entry</h2>
        <p className="text-sm text-slate-500">Select week, task, date, and log your working hours.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium">Week Start Date</label>
            <input type="date" value={weekStartDate} onChange={(e) => setWeekStartDate(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
          </div>
          <button onClick={prepareWeek} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Select Week</button>
        </div>
      </div>

      <form onSubmit={submitEntry} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input type="date" required value={form.work_date} onChange={(e) => setForm((p) => ({ ...p, work_date: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Activity</label>
            <select required value={form.activity_id} onChange={(e) => setForm((p) => ({ ...p, activity_id: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2">
              <option value="">Select activity</option>
              {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Hours Worked</label>
            <input type="number" min="0.25" max="24" step="0.25" required value={form.hours_worked} onChange={(e) => setForm((p) => ({ ...p, hours_worked: e.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2" />
        </div>
        <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2 text-white sm:w-auto">Add Entry</button>
      </form>
    </div>
  )
}
