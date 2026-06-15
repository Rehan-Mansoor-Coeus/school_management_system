import { useEffect, useState } from 'react'
import { fetchHrDashboard, formatHrError } from '../../../api/hr'
import { useToast } from '../../../components/ui/ToastProvider'

const cards = [
  { key: 'staff_count', label: 'Total Staff' },
  { key: 'active_staff', label: 'Active Staff' },
  { key: 'jobs_count', label: 'Jobs' },
  { key: 'open_advances', label: 'Open Advances' },
  { key: 'payroll_runs', label: 'Payroll Runs' },
]

export default function HrOverviewPage() {
  const { pushToast } = useToast()
  const [data, setData] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        setData(await fetchHrDashboard())
      } catch (error) {
        pushToast(formatHrError(error, 'Failed to load HR dashboard'), 'error')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div key={card.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '...' : String(data[card.key] ?? 0)}</p>
        </div>
      ))}
    </div>
  )
}
