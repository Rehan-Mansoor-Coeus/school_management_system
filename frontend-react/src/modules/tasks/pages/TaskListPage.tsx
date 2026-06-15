import { useEffect, useState } from 'react'
import { deleteTask, fetchTasks, formatTaskError } from '../../../api/tasks'
import { useToast } from '../../../components/ui/ToastProvider'

export default function TaskListPage() {
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])

  const load = async () => {
    try {
      setRows(await fetchTasks())
    } catch (error) {
      pushToast(formatTaskError(error, 'Failed to load tasks'), 'error')
    }
  }

  useEffect(() => { load() }, [])

  const remove = async (id: number) => {
    if (!window.confirm('Delete this task?')) return
    try {
      await deleteTask(id)
      pushToast('Task deleted.')
      load()
    } catch (error) {
      pushToast(formatTaskError(error, 'Unable to delete task'), 'error')
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Title</th>
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Deadline</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No tasks found.</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium text-slate-900">{row.title}</td>
              <td className="px-4 py-3">{row.priority || '-'}</td>
              <td className="px-4 py-3">{row.deadline || '-'}</td>
              <td className="px-4 py-3">{row.status || '-'}</td>
              <td className="px-4 py-3">
                <button type="button" onClick={() => remove(Number(row.id))} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
