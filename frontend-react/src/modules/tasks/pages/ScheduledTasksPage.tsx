import { useEffect, useState } from 'react'
import { fetchTasks, formatTaskError, processScheduledTasks } from '../../../api/tasks'
import { useToast } from '../../../components/ui/ToastProvider'

export default function ScheduledTasksPage() {
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])

  const load = async () => {
    try {
      setRows(await fetchTasks({ schedule_later: true }))
    } catch (error) {
      pushToast(formatTaskError(error, 'Failed to load scheduled tasks'), 'error')
    }
  }

  useEffect(() => { load() }, [])

  const processNow = async () => {
    try {
      await processScheduledTasks()
      pushToast('Scheduled task workflow processed.')
      load()
    } catch (error) {
      pushToast(formatTaskError(error, 'Unable to process scheduled tasks'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={processNow} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">Process Scheduled Queue</button>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Deadline</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-500">No scheduled tasks.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{row.title}</td>
                <td className="px-4 py-3">{row.deadline || '-'}</td>
                <td className="px-4 py-3">{row.status || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
