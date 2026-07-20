import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import {
  fetchLicensePayments,
  fetchPendingLicensePayments,
  recordLicensePayment,
  verifyLicensePayment,
  type LicensePayment,
} from '../../../api/licensing'
import { fetchSchools } from '../../../api/superadmin'
import { formatApiError } from '../../../utils/apiError'

export default function LicensePaymentsPage() {
  const [tab, setTab] = useState<'all' | 'pending'>('pending')
  const [rows, setRows] = useState<LicensePayment[]>([])
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [form, setForm] = useState({
    institution_id: '',
    amount: '',
    reference: '',
    institution_semester_license_id: '',
    license_invoice_id: '',
    allocation_type: 'down_payment',
    auto_verify: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = tab === 'pending'
        ? await fetchPendingLicensePayments()
        : await fetchLicensePayments()
      setRows(res.data.data || [])
    } catch (err) {
      setError(formatApiError(err, 'Unable to load payments.'))
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fetchSchools().then((res) => setSchools((res.data.data || []).map((s) => ({ id: s.id, name: s.name })))).catch(() => {})
  }, [])

  async function verify(id: number, approve: boolean) {
    let reason: string | undefined
    if (!approve) {
      reason = window.prompt('Rejection reason (required)') || undefined
      if (!reason) return
    }
    setBusyId(id)
    try {
      const res = await verifyLicensePayment(id, { approve, reason })
      setMsg(res.data.message)
      await load()
    } catch (err) {
      setError(formatApiError(err, 'Verification failed.'))
    } finally {
      setBusyId(null)
    }
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      const res = await recordLicensePayment({
        institution_id: Number(form.institution_id),
        amount: Number(form.amount),
        reference: form.reference || null,
        institution_semester_license_id: form.institution_semester_license_id
          ? Number(form.institution_semester_license_id) : null,
        license_invoice_id: form.license_invoice_id ? Number(form.license_invoice_id) : null,
        allocation_type: form.allocation_type,
        auto_verify: form.auto_verify,
        method: 'manual',
      })
      setMsg(res.data.message)
      setForm((p) => ({ ...p, amount: '', reference: '' }))
      await load()
    } catch (err) {
      setError(formatApiError(err, 'Could not record payment.'))
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm text-slate-500">
          <Link to="/super-admin/licensing" className="hover:text-[#1e3a5f]">Licenses &amp; Billing</Link>
          {' / '}Payments
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">License Payments</h1>
      </div>

      <div className="flex gap-2">
        {(['pending', 'all'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              tab === t ? 'bg-[#1e3a5f] text-white' : 'border border-slate-200 text-slate-700'
            }`}
          >
            {t === 'pending' ? 'Pending verification' : 'All payments'}
          </button>
        ))}
      </div>

      {msg && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{msg}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <form onSubmit={submitPayment} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
        <h2 className="sm:col-span-3 font-semibold text-slate-900">Record payment</h2>
        <select
          required
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={form.institution_id}
          onChange={(e) => setForm((p) => ({ ...p, institution_id: e.target.value }))}
        >
          <option value="">Institution…</option>
          {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input
          required
          type="number"
          min={0.01}
          step="0.01"
          placeholder="Amount"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={form.amount}
          onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
        />
        <input
          placeholder="Reference"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={form.reference}
          onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
        />
        <input
          placeholder="Semester license ID"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={form.institution_semester_license_id}
          onChange={(e) => setForm((p) => ({ ...p, institution_semester_license_id: e.target.value }))}
        />
        <input
          placeholder="Invoice ID"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={form.license_invoice_id}
          onChange={(e) => setForm((p) => ({ ...p, license_invoice_id: e.target.value }))}
        />
        <select
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={form.allocation_type}
          onChange={(e) => setForm((p) => ({ ...p, allocation_type: e.target.value }))}
        >
          {['down_payment', 'final_balance', 'additional_student', 'late_fee'].map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.auto_verify}
            onChange={(e) => setForm((p) => ({ ...p, auto_verify: e.target.checked }))}
          />
          Auto-verify (manual Super Admin entry)
        </label>
        <button type="submit" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white sm:col-span-2">
          Save payment
        </button>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Institution</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Proofs</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No payments.</td></tr>
              )}
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium">{p.payment_number}</td>
                  <td className="px-4 py-3">{p.institution_name || p.institution_id}</td>
                  <td className="px-4 py-3">{p.currency} {Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize">{p.status.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">{p.proofs?.length || 0}</td>
                  <td className="px-4 py-3">
                    {['pending', 'pending_verification'].includes(p.status) && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => verify(p.id, true)}
                          className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => verify(p.id, false)}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-xs text-rose-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
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
