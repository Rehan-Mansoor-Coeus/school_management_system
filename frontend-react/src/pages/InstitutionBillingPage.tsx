import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  fetchInstitutionBilling,
  requestInstitutionBillingChange,
  uploadInstitutionBillingProof,
  type LicenseInvoice,
  type LicensePayment,
  type SemesterLicense,
  type CurrentLicense,
} from '../api/licensing'
import { formatApiError } from '../utils/apiError'

export default function InstitutionBillingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [license, setLicense] = useState<CurrentLicense | null>(null)
  const [semesters, setSemesters] = useState<SemesterLicense[]>([])
  const [invoices, setInvoices] = useState<LicenseInvoice[]>([])
  const [payments, setPayments] = useState<LicensePayment[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [requestType, setRequestType] = useState<'renewal' | 'upgrade' | 'add_modules' | 'support'>('renewal')
  const [requestNotes, setRequestNotes] = useState('')
  const [form, setForm] = useState({
    amount: '',
    reference: '',
    license_invoice_id: '',
    institution_semester_license_id: '',
    allocation_type: 'down_payment',
    proof: null as File | null,
  })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetchInstitutionBilling()
      setLicense(res.data.current_license)
      setSemesters(res.data.semester_licenses || [])
      setInvoices(res.data.invoices || [])
      setPayments(res.data.payments || [])
      setNotes(res.data.notes || [])
    } catch (err) {
      setError(formatApiError(err, 'Unable to load billing.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function submitProof(e: React.FormEvent) {
    e.preventDefault()
    if (!form.proof) return
    setUploading(true)
    setError('')
    setMsg('')
    try {
      const fd = new FormData()
      fd.append('amount', form.amount)
      fd.append('reference', form.reference)
      fd.append('allocation_type', form.allocation_type)
      fd.append('proof', form.proof)
      if (form.license_invoice_id) fd.append('license_invoice_id', form.license_invoice_id)
      if (form.institution_semester_license_id) {
        fd.append('institution_semester_license_id', form.institution_semester_license_id)
      }
      const res = await uploadInstitutionBillingProof(fd)
      setMsg(res.data.message)
      setForm({
        amount: '',
        reference: '',
        license_invoice_id: '',
        institution_semester_license_id: '',
        allocation_type: 'down_payment',
        proof: null,
      })
      await load()
    } catch (err) {
      setError(formatApiError(err, 'Could not upload proof.'))
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 p-6 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading billing…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Subscription &amp; Billing</h2>
        <p className="mt-1 text-sm text-slate-500">
          View your institution license, semester fees, invoices, and submit payment proofs.
        </p>
      </div>

      {msg && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{msg}</div>}
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {license && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Current license</h3>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div><dt className="text-slate-500">Plan</dt><dd className="font-medium">{license.plan?.name || license.plan_name}</dd></div>
            <div><dt className="text-slate-500">Status</dt><dd className="font-medium capitalize">{license.license_status}</dd></div>
            <div><dt className="text-slate-500">Payment</dt><dd className="font-medium capitalize">{license.payment_status}</dd></div>
          </dl>
        </div>
      )}

      {notes.length > 0 && (
        <ul className="list-disc space-y-1 rounded-xl bg-slate-50 px-5 py-3 text-sm text-slate-600">
          {notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Semester billing</h3>
        <p className="mt-1 text-xs text-slate-500">Projected amounts until lock; final amounts after reconciliation.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3">Period</th>
                <th className="py-2 pr-3">Projected / Final</th>
                <th className="py-2 pr-3">Down payment</th>
                <th className="py-2 pr-3">Balance</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {semesters.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-slate-500">No semester licenses assigned yet.</td></tr>
              )}
              {semesters.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-2 pr-3">{s.academic_year} · {s.semester_name}</td>
                  <td className="py-2 pr-3">
                    {s.currency} {Number(s.estimated_total).toLocaleString()}
                    {s.locked_total != null ? ` → ${Number(s.locked_total).toLocaleString()}` : ' (projected)'}
                  </td>
                  <td className="py-2 pr-3">
                    {Number(s.down_payment_paid).toLocaleString()} / {Number(s.required_down_payment).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3">{Number(s.balance_due).toLocaleString()}</td>
                  <td className="py-2 capitalize">{s.status.replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Request renewal / upgrade</h3>
        <p className="mt-1 text-xs text-slate-500">
          You cannot change prices or approve your own payments. Submit a request for the platform team.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={requestType}
            onChange={(e) => setRequestType(e.target.value as typeof requestType)}
          >
            <option value="renewal">Renewal</option>
            <option value="upgrade">Upgrade plan</option>
            <option value="add_modules">Add modules</option>
            <option value="support">Billing support</option>
          </select>
          <input
            className="min-w-[220px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Notes (optional)"
            value={requestNotes}
            onChange={(e) => setRequestNotes(e.target.value)}
          />
          <button
            type="button"
            disabled={requesting}
            onClick={async () => {
              setRequesting(true)
              setError('')
              setMsg('')
              try {
                const res = await requestInstitutionBillingChange({
                  request_type: requestType,
                  notes: requestNotes || undefined,
                })
                setMsg(res.data.message)
                setRequestNotes('')
              } catch (err) {
                setError(formatApiError(err, 'Could not submit request.'))
              } finally {
                setRequesting(false)
              }
            }}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {requesting ? 'Sending…' : 'Submit request'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Invoices</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {invoices.length === 0 && <li className="text-slate-500">No invoices.</li>}
            {invoices.map((inv) => (
              <li key={inv.id} className="flex justify-between gap-2 border-b border-slate-50 pb-2">
                <span>
                  <span className="font-medium">{inv.invoice_number}</span>
                  <span className="block text-xs capitalize text-slate-500">{inv.invoice_type.replace(/_/g, ' ')}</span>
                </span>
                <span className="text-right">
                  {inv.currency} {Number(inv.total_amount).toLocaleString()}
                  <span className="block text-xs capitalize text-slate-500">{inv.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={submitProof} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900">Upload payment proof</h3>
          <p className="text-xs text-slate-500">Proofs do not activate your license until verified by the platform.</p>
          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            placeholder="Amount"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
          />
          <input
            placeholder="Reference"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.reference}
            onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
          />
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.institution_semester_license_id}
            onChange={(e) => setForm((p) => ({ ...p, institution_semester_license_id: e.target.value }))}
          >
            <option value="">Semester license (optional)</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>{s.academic_year} · {s.semester_name}</option>
            ))}
          </select>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.license_invoice_id}
            onChange={(e) => setForm((p) => ({ ...p, license_invoice_id: e.target.value }))}
          >
            <option value="">Invoice (optional)</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>{inv.invoice_number}</option>
            ))}
          </select>
          <input
            required
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,.webp"
            className="w-full text-sm"
            onChange={(e) => setForm((p) => ({ ...p, proof: e.target.files?.[0] || null }))}
          />
          <button
            type="submit"
            disabled={uploading}
            className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : 'Submit proof'}
          </button>
          {payments.length > 0 && (
            <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
              Recent payments: {payments.slice(0, 3).map((p) => `${p.payment_number} (${p.status})`).join(' · ')}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
