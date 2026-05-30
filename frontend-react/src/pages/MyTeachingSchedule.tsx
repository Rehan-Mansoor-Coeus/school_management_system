import { useEffect, useState } from 'react'
import { fetchMyTeachingSchedules } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function MyTeachingSchedulePage() {
  const [rows, setRows] = useState<any[]>([])
  const { pushToast } = useToast()

  useEffect(() => {
    fetchMyTeachingSchedules()
      .then((res) => setRows(res.data || []))
      .catch((error: any) => pushToast(error?.response?.data?.message || 'Failed to load schedule', 'error'))
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">My Teaching Schedule</h2>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50"><tr><th className="px-4 py-3">Day</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">End</th><th className="px-4 py-3">Expected Contact Hours</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td className="px-4 py-8 text-slate-500" colSpan={6}>No schedule assigned.</td></tr> : rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.day_of_week}</td>
                <td className="px-4 py-3">{row.course?.name}</td>
                <td className="px-4 py-3">{row.class_model?.name}</td>
                <td className="px-4 py-3">{row.start_time}</td>
                <td className="px-4 py-3">{row.end_time}</td>
                <td className="px-4 py-3">{row.expected_contact_hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
