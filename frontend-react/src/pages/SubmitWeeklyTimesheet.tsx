import { useState } from 'react'
import { createOrGetWeeklyTimesheet, submitTimesheet } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function SubmitWeeklyTimesheetPage() {
  const [weekStartDate, setWeekStartDate] = useState('')
  const [timesheet, setTimesheet] = useState<any>(null)
  const { pushToast } = useToast()

  const loadTimesheet = async () => {
    if (!weekStartDate) return
    try {
      const res = await createOrGetWeeklyTimesheet(weekStartDate)
      setTimesheet(res.data)
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to load timesheet', 'error')
    }
  }

  const submitWeekly = async () => {
    if (!timesheet?.id) return
    try {
      await submitTimesheet(timesheet.id)
      pushToast('Timesheet submitted.')
      loadTimesheet()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to submit timesheet', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Submit Weekly Timesheet</h2>
        <p className="text-sm text-slate-500">Review totals and submit your weekly timesheet for approval.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input type="date" value={weekStartDate} onChange={(e) => setWeekStartDate(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2" />
          <button onClick={loadTimesheet} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Load Week</button>
        </div>
      </div>

      {timesheet && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-xs text-slate-500">Submitted Hours</p><p className="text-lg font-semibold">{timesheet.total_submitted_hours}</p></div>
            <div><p className="text-xs text-slate-500">Expected Hours</p><p className="text-lg font-semibold">{timesheet.total_expected_hours}</p></div>
            <div><p className="text-xs text-slate-500">Overtime</p><p className="text-lg font-semibold">{timesheet.overtime_hours}</p></div>
            <div><p className="text-xs text-slate-500">Under-time</p><p className="text-lg font-semibold">{timesheet.under_time_hours}</p></div>
          </div>
          <div className="mt-4">
            <p className="mb-3 text-sm">Status: <span className="font-semibold capitalize">{timesheet.status}</span></p>
            <button onClick={submitWeekly} className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
              Submit Weekly Timesheet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
