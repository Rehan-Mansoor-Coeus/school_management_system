import { useEffect, useMemo, useState } from 'react'
import { fetchMyTasks, fetchPendingTaskAcceptances, fetchTasks, formatTaskError } from '../../../api/tasks'
import { useToast } from '../../../components/ui/ToastProvider'

export default function TaskDashboardPage() {
  const { pushToast } = useToast()
  const [all, setAll] = useState<any[]>([])
  const [mine, setMine] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [allTasks, myTasks, pendingRows] = await Promise.all([
          fetchTasks(),
          fetchMyTasks(),
          fetchPendingTaskAcceptances(),
        ])
        setAll(allTasks)
        setMine(myTasks)
        setPending(pendingRows)
      } catch (error) {
        pushToast(formatTaskError(error, 'Failed to load task dashboard'), 'error')
      }
    }
    load()
  }, [])

  const stats = useMemo(
    () => [
      { label: 'All Tasks', value: all.length },
      { label: 'My Tasks', value: mine.length },
      { label: 'Pending Acceptances', value: pending.length },
    ],
    [all, mine, pending],
  )

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
