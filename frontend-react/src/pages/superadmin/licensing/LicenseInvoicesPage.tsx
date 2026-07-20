import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { fetchLicenseInvoices, type LicenseInvoice } from '../../../api/licensing'
import { formatApiError } from '../../../utils/apiError'

export default function LicenseInvoicesPage() {
  const [rows, setRows] = useState<LicenseInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetchLicenseInvoices({ status: status || undefined })
        if (!cancelled) setRows(res.data.data || [])
      } catch (err) {
        if (!cancelled) setError(formatApiError(err, 'Unable to load invoices.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [status])

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm text-slate-500">
          <Link to="/super-admin/licensing" className="hover:text-[#1e3a5f]">Licenses &amp; Billing</Link>
          {' / '}Invoices
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">License Invoices</h1>
      </div>

      <select
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">All statuses</option>
        {['issued', 'partially_paid', 'paid', 'void'].map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
        ))}
      </select>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Institution</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No invoices yet.</td></tr>
              )}
              {rows.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{inv.institution_name || inv.institution_id}</td>
                  <td className="px-4 py-3 capitalize">{inv.invoice_type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">{inv.currency} {Number(inv.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3">{inv.currency} {Number(inv.balance).toLocaleString()}</td>
                  <td className="px-4 py-3">{inv.due_date || '—'}</td>
                  <td className="px-4 py-3 capitalize">{inv.status.replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
