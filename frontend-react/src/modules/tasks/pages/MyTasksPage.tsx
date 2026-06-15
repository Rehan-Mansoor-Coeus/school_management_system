import { useEffect, useState } from 'react'
import { fetchMyTasks, formatTaskError, updateTaskAssignmentProgress } from '../../../api/tasks'
import { FormField, formInputClass } from '../../../components/ui/FormField'
import { useToast } from '../../../components/ui/ToastProvider'

export default function MyTasksPage() {
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])
  const [progressInput, setProgressInput] = useState<Record<number, string>>({})

  const load = async () => {
    try {
      setRows(await fetchMyTasks())
    } catch (error) {
      pushToast(formatTaskError(error, 'Failed to load my tasks'), 'error')
    }
  }

  useEffect(() => { load() }, [])

  const updateProgress = async (assignmentId: number) => {
    const progress = Number(progressInput[assignmentId] ?? 0)
    try {
      await updateTaskAssignmentProgress(assignmentId, { progress })
      pushToast('Progress updated.')
      load()
    } catch (error) {
      pushToast(formatTaskError(error, 'Unable to update task progress'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">No assigned tasks found.</div>
      ) : rows.map((row) => (
        <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">{row.task?.title || row.title || `Assignment #${row.id}`}</h3>
          <p className="mt-1 text-sm text-slate-500">Current status: {row.status || '-'}, progress: {row.progress || 0}%</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <FormField label="Progress (%)">
              <input
                type="number"
                min="0"
                max="100"
                className={formInputClass}
                value={progressInput[row.id] ?? ''}
                onChange={(event) => setProgressInput((prev) => ({ ...prev, [row.id]: event.target.value }))}
              />
            </FormField>
            <button type="button" onClick={() => updateProgress(Number(row.id))} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">
              Update
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
