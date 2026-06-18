import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchContracts, formatContractError } from '../../../api/contracts'
import { useToast } from '../../../components/ui/ToastProvider'

type ContractRow = {
  id: number
  reference_number: string
  title: string
  recipient_name: string
  recipient_type: string
  status: string
  end_date?: string | null
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  generated: 'bg-blue-100 text-blue-800',
  sent: 'bg-indigo-100 text-indigo-800',
  signed: 'bg-purple-100 text-purple-800',
  pending_approval: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  fully_executed: 'bg-green-100 text-green-900',
}

export default function ContractsListPage() {
  const { pushToast } = useToast()
  const [rows, setRows] = useState<ContractRow[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const result = await fetchContracts(statusFilter ? { status: statusFilter } : undefined)
        setRows((result.data as ContractRow[]) || [])
      } catch (error) {
        pushToast(formatContractError(error, 'Failed to load contracts'), 'error')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [statusFilter, pushToast])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {['draft', 'generated', 'sent', 'signed', 'pending_approval', 'approved', 'rejected', 'fully_executed'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">End Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr>
            ) : rows.length ? rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link to={`/contracts/list/${row.id}`} className="font-medium text-[#1e3a5f] hover:underline">
                    {row.reference_number}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.title}</td>
                <td className="px-4 py-3">{row.recipient_name}</td>
                <td className="px-4 py-3 capitalize">{row.recipient_type}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[row.status] || 'bg-slate-100 text-slate-700'}`}>
                    {row.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">{row.end_date || '—'}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No contracts found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
