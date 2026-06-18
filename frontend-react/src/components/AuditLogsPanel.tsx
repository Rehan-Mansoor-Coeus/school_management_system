import { useEffect, useState } from 'react'
import { fetchAuditLogs, formatAuditError, type AuditLogRow } from '../api/audit'
import { formInputClass } from './ui/FormField'
import { useToast } from './ui/ToastProvider'

const sourceOptions = [
  { value: '', label: 'All sources' },
  { value: 'system', label: 'System' },
  { value: 'timesheet', label: 'Timesheets' },
  { value: 'messaging', label: 'Messaging' },
  { value: 'auth', label: 'Auth / OTP' },
]

type Props = {
  compact?: boolean
}

export default function AuditLogsPanel({ compact = false }: Props) {
  const { pushToast } = useToast()
  const [rows, setRows] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchAuditLogs({ search: search || undefined, source: source || undefined, action: action || undefined, page, per_page: compact ? 25 : 50 })
      setRows(data.items || [])
      setLastPage(data.pagination?.last_page || 1)
    } catch (error) {
      pushToast(formatAuditError(error, 'Failed to load audit logs'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [page])

  const onFilter = (event: React.FormEvent) => {
    event.preventDefault()
    setPage(1)
    load()
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Audit Logs</h2>
          <p className="text-sm text-slate-500">All system activity — tasks, timesheets, messaging, auth, and more.</p>
        </div>
      )}

      <form onSubmit={onFilter} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <input className={formInputClass} placeholder="Search activity…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={formInputClass} value={source} onChange={(e) => setSource(e.target.value)}>
          {sourceOptions.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <input className={formInputClass} placeholder="Action filter" value={action} onChange={(e) => setAction(e.target.value)} />
        <button type="submit" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">Apply filters</button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">When</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Source</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Activity</th>
              {!compact && <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">IP</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={compact ? 4 : 5} className="px-4 py-8 text-center text-sm text-slate-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={compact ? 4 : 5} className="px-4 py-8 text-center text-sm text-slate-500">No activity found.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-3 text-sm capitalize text-slate-700">{row.source}</td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  <div className="font-medium">{row.user_name}</div>
                  {row.user_email && <div className="text-xs text-slate-500">{row.user_email}</div>}
                </td>
                <td className="px-4 py-3 text-sm text-slate-700">
                  <div>{row.summary}</div>
                  <div className="text-xs text-slate-500">{row.action}</div>
                </td>
                {!compact && <td className="px-4 py-3 text-sm text-slate-500">{row.ip_address || '—'}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-slate-600">Page {page} of {lastPage}</span>
          <button type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
