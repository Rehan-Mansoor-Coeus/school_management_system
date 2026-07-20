import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import {
  fetchSemesterLicenses,
  lockSemesterLicense,
  reconcileSemesterLicense,
  syncSemesterUsage,
  type SemesterLicense,
} from '../../../api/licensing'
import { formatApiError } from '../../../utils/apiError'

function money(currency: string, amount: number) {
  return `${currency} ${Number(amount || 0).toLocaleString()}`
}

export default function SemesterLicensesPage() {
  const [rows, setRows] = useState<SemesterLicense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchSemesterLicenses({
        search: search || undefined,
        status: status || undefined,
      })
      setRows(res.data.data || [])
    } catch (err) {
      setError(formatApiError(err, 'Unable to load semester licenses.'))
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    load()
  }, [load])

  async function runAction(id: number, action: 'sync' | 'lock' | 'reconcile') {
    setBusyId(id)
    setError('')
    try {
      if (action === 'sync') await syncSemesterUsage(id)
      if (action === 'lock') await lockSemesterLicense(id)
      if (action === 'reconcile') await reconcileSemesterLicense(id)
      await load()
    } catch (err) {
      setError(formatApiError(err, 'Action failed.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm text-slate-500">
          <Link to="/super-admin/licensing" className="hover:text-[#1e3a5f]">Licenses &amp; Billing</Link>
          {' / '}Semester licenses
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Semester Licenses</h1>
        <p className="mt-1 text-sm text-slate-500">
          Per-student semester billing periods: estimates, down payments, lock, and reconciliation.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Search institution…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {[
            'awaiting_down_payment', 'down_payment_partially_paid', 'active',
            'awaiting_reconciliation', 'balance_due', 'paid', 'overdue', 'suspended',
          ].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <Link
          to="/super-admin/licensing/assign"
          className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
        >
          Assign semester plan
        </Link>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Institution</th>
                <th className="px-4 py-3">Year / Semester</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">Down payment</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No semester licenses yet.</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{row.institution?.name || `#${row.institution_id}`}</div>
                    <div className="text-xs text-slate-500">{row.plan?.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{row.academic_year || row.academic_year_id}</div>
                    <div className="capitalize text-xs text-slate-500">{row.semester_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    Est {row.estimated_students}
                    {row.locked_students != null ? ` · Locked ${row.locked_students}` : ` · Proj ${row.projected_students}`}
                    <div className="text-xs text-slate-500">{money(row.currency, row.price_per_student)} / student</div>
                  </td>
                  <td className="px-4 py-3">
                    {money(row.currency, row.down_payment_paid)} / {money(row.currency, row.required_down_payment)}
                  </td>
                  <td className="px-4 py-3">{money(row.currency, row.balance_due)}</td>
                  <td className="px-4 py-3 capitalize">{row.status.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => runAction(row.id, 'sync')}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                      >
                        Sync
                      </button>
                      {!row.locked_at && (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => runAction(row.id, 'lock')}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                        >
                          Lock
                        </button>
                      )}
                      {row.locked_at && !row.reconciled_at && (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => runAction(row.id, 'reconcile')}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                        >
                          Reconcile
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
