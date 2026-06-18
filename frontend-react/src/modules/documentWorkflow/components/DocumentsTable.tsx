import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchContracts, fetchDocumentTypes, formatContractError } from '../../../api/contracts'
import { useToast } from '../../../components/ui/ToastProvider'

type DocRow = {
  id: number
  reference_number: string
  title: string
  recipient_name: string
  recipient_type: string
  status: string
  end_date?: string | null
  document_type?: { name?: string } | null
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

type DocType = { id: number; name: string }

export default function DocumentsTable({
  baseFilters = {},
  showStatusFilter = true,
  emptyLabel = 'No documents found.',
}: {
  baseFilters?: Record<string, string | number>
  showStatusFilter?: boolean
  emptyLabel?: string
}) {
  const { pushToast } = useToast()
  const [rows, setRows] = useState<DocRow[]>([])
  const [types, setTypes] = useState<DocType[]>([])
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDocumentTypes().then((t) => setTypes(t as DocType[])).catch(() => {})
  }, [])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const params: Record<string, string | number> = { ...baseFilters }
        if (typeFilter) params.document_type_id = typeFilter
        if (statusFilter) params.status = statusFilter
        const result = await fetchContracts(params)
        setRows((result.data as DocRow[]) || [])
      } catch (error) {
        pushToast(formatContractError(error, 'Failed to load documents'), 'error')
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, JSON.stringify(baseFilters)])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All document types</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {showStatusFilter && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            {['draft', 'generated', 'sent', 'signed', 'pending_approval', 'approved', 'rejected', 'fully_executed'].map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Recipient</th>
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
                  <Link to={`/document-workflow/documents/${row.id}`} className="font-medium text-[#1e3a5f] hover:underline">
                    {row.reference_number}
                  </Link>
                </td>
                <td className="px-4 py-3">{row.title}</td>
                <td className="px-4 py-3">{row.document_type?.name || '—'}</td>
                <td className="px-4 py-3">{row.recipient_name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColors[row.status] || 'bg-slate-100 text-slate-700'}`}>
                    {row.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">{row.end_date || '—'}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{emptyLabel}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
