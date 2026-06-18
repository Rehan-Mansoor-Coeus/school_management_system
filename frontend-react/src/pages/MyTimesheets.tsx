import { useEffect, useState } from 'react'
import { createOrGetWeeklyTimesheet, fetchMyTimesheets } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function MyTimesheetsPage() {
  const [timesheets, setTimesheets] = useState<any[]>([])
  const [weekStartDate, setWeekStartDate] = useState('')
  const [loading, setLoading] = useState(false)
  const { pushToast } = useToast()

  const loadData = async () => {
    setLoading(true)
    try {
      setTimesheets(await fetchMyTimesheets())
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load timesheets', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateWeek = async () => {
    if (!weekStartDate) return
    try {
      await createOrGetWeeklyTimesheet(weekStartDate)
      pushToast('Weekly timesheet ready.')
      loadData()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to prepare weekly timesheet', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">My Timesheets</h2>
          <p className="text-sm text-slate-500">Track your weekly timesheets and submission status.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="date"
            value={weekStartDate}
            onChange={(e) => setWeekStartDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2"
          />
          <button onClick={handleCreateWeek} className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700">
            Open Week
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold">Week</th>
              <th className="px-4 py-3 text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-sm font-semibold">Submitted</th>
              <th className="px-4 py-3 text-sm font-semibold">Expected</th>
              <th className="px-4 py-3 text-sm font-semibold">Overtime</th>
              <th className="px-4 py-3 text-sm font-semibold">Under-time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : timesheets.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No timesheets found.</td></tr>
            ) : (
              timesheets.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm">{item.week_start_date} - {item.week_end_date}</td>
                  <td className="px-4 py-3 text-sm capitalize">{item.status}</td>
                  <td className="px-4 py-3 text-sm">{item.total_submitted_hours}</td>
                  <td className="px-4 py-3 text-sm">{item.total_expected_hours}</td>
                  <td className="px-4 py-3 text-sm">{item.overtime_hours}</td>
                  <td className="px-4 py-3 text-sm">{item.under_time_hours}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
