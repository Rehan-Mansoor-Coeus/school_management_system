import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { fetchLicensingOverviewKpis, fetchSemesterLicenses, type LicensingOverviewKpis, type SemesterLicense } from '../../../api/licensing'
import { formatApiError } from '../../../utils/apiError'

export default function LicensingReportsPage() {
  const [kpis, setKpis] = useState<LicensingOverviewKpis | null>(null)
  const [rows, setRows] = useState<SemesterLicense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [kpiRes, semRes] = await Promise.all([
          fetchLicensingOverviewKpis(),
          fetchSemesterLicenses(),
        ])
        setKpis(kpiRes.data.data)
        setRows(semRes.data.data || [])
      } catch (err) {
        setError(formatApiError(err, 'Unable to load reports.'))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function exportCsv() {
    const header = ['Institution', 'Year', 'Semester', 'Estimated', 'Locked', 'Down paid', 'Balance', 'Status']
    const lines = rows.map((r) => [
      r.institution?.name || r.institution_id,
      r.academic_year || '',
      r.semester_name,
      r.estimated_total,
      r.locked_total ?? '',
      r.down_payment_paid,
      r.balance_due,
      r.status,
    ].join(','))
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'semester-license-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            <Link to="/super-admin/licensing" className="hover:text-[#1e3a5f]">Licenses &amp; Billing</Link>
            {' / '}Reports
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Licensing Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Estimated vs locked fees, collection, and outstanding balances.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!rows.length}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading || !kpis ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Estimated revenue', kpis.estimated_revenue],
              ['Locked revenue', kpis.locked_revenue],
              ['Down payments received', kpis.down_payments_received],
              ['Outstanding balances', kpis.outstanding_balances],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{Number(value).toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Est / Locked</th>
                  <th className="px-4 py-3">Collected</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="px-4 py-3">{r.institution?.name || r.institution_id}</td>
                    <td className="px-4 py-3">{r.academic_year} · {r.semester_name}</td>
                    <td className="px-4 py-3">
                      {Number(r.estimated_total).toLocaleString()}
                      {r.locked_total != null ? ` / ${Number(r.locked_total).toLocaleString()}` : ''}
                    </td>
                    <td className="px-4 py-3">{Number(r.amount_paid).toLocaleString()}</td>
                    <td className="px-4 py-3">{Number(r.balance_due).toLocaleString()}</td>
                    <td className="px-4 py-3 capitalize">{r.status.replace(/_/g, ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
