import { useEffect, useState } from 'react'
import { fetchWorkload, formatTimetableError, type WorkloadRow } from '../../../api/timetable'
import { useToast } from '../../../components/ui/ToastProvider'

export default function WorkloadPage() {
  const { pushToast } = useToast()
  const [rows, setRows] = useState<WorkloadRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try { setRows(await fetchWorkload()) }
      catch (error) { pushToast(formatTimetableError(error, 'Failed to load workload'), 'error') }
      finally { setLoading(false) }
    }
    run()
  }, [pushToast])

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-800">Teacher Workload</h2>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Courses</th>
              <th className="px-4 py-3">Expected Hrs</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Remaining</th>
              <th className="px-4 py-3">Weekly Hrs</th>
              <th className="px-4 py-3">Max Weekly</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">Loading…</td></tr>
              : rows.length === 0 ? <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">No workload data yet.</td></tr>
              : rows.map((r) => (
                <tr key={r.teacher_id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.teacher_name}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.courses.length === 0 ? '-' : r.courses.map((c) => c.code || c.name).filter(Boolean).join(', ')}
                  </td>
                  <td className="px-4 py-3">{r.expected_hours}</td>
                  <td className="px-4 py-3">{r.completed_hours}</td>
                  <td className="px-4 py-3 font-medium">{r.remaining_hours}</td>
                  <td className="px-4 py-3">{r.weekly_hours}</td>
                  <td className="px-4 py-3">{r.max_weekly_hours}</td>
                  <td className="px-4 py-3">
                    {r.over_limit
                      ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Over limit</span>
                      : <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">OK</span>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Weekly hours are derived from the published timetable. Completed hours accumulate from teacher lesson logs.</p>
    </div>
  )
}
