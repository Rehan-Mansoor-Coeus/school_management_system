import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchContractDashboard, formatContractError } from '../../../api/contracts'
import { useToast } from '../../../components/ui/ToastProvider'

const statCards = [
  { key: 'total', label: 'Total Contracts', color: 'bg-slate-50 text-slate-900' },
  { key: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-800' },
  { key: 'sent', label: 'Sent', color: 'bg-blue-50 text-blue-900' },
  { key: 'pending_signatures', label: 'Pending Signatures', color: 'bg-amber-50 text-amber-900' },
  { key: 'pending_approval', label: 'Pending Approval', color: 'bg-orange-50 text-orange-900' },
  { key: 'approved', label: 'Approved', color: 'bg-emerald-50 text-emerald-900' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-50 text-red-900' },
  { key: 'expired', label: 'Expired', color: 'bg-rose-50 text-rose-900' },
]

export default function ContractDashboardPage() {
  const { pushToast } = useToast()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [charts, setCharts] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const data = await fetchContractDashboard()
        setStats((data.stats as Record<string, number>) || {})
        setCharts(data.charts || {})
      } catch (error) {
        pushToast(formatContractError(error, 'Failed to load contract dashboard'), 'error')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [pushToast])

  const byType = (charts.by_type as Record<string, number>) || {}
  const byStatus = (charts.by_status as Record<string, number>) || {}
  const expiringSoon = (charts.expiring_soon as Array<Record<string, unknown>>) || []

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.key} className={`rounded-2xl border border-slate-200 p-5 shadow-sm ${card.color}`}>
            <p className="text-sm opacity-80">{card.label}</p>
            <p className="mt-2 text-3xl font-bold">{loading ? '…' : String(stats[card.key] ?? 0)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Contracts by Type</h2>
          <div className="space-y-2">
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-600">{type.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
            {!Object.keys(byType).length && <p className="text-sm text-slate-500">No data yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Contracts by Status</h2>
          <div className="space-y-2">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-600">{status.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-slate-900">{count}</span>
              </div>
            ))}
            {!Object.keys(byStatus).length && <p className="text-sm text-slate-500">No data yet.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Contracts Expiring Soon</h2>
          <Link to="/contracts/list" className="text-xs font-medium text-[#1e3a5f] hover:underline">View all</Link>
        </div>
        {expiringSoon.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2 pr-4">Reference</th>
                  <th className="py-2 pr-4">Recipient</th>
                  <th className="py-2 pr-4">End Date</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {expiringSoon.map((row) => (
                  <tr key={String(row.id)} className="border-b border-slate-100">
                    <td className="py-2 pr-4">
                      <Link to={`/contracts/list/${row.id}`} className="font-medium text-[#1e3a5f] hover:underline">
                        {String(row.reference_number)}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{String(row.recipient_name)}</td>
                    <td className="py-2 pr-4">{String(row.end_date)}</td>
                    <td className="py-2 capitalize">{String(row.status).replace(/_/g, ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No contracts expiring in the next 90 days.</p>
        )}
      </div>
    </div>
  )
}
