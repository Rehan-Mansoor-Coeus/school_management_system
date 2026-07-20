import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, Search } from 'lucide-react'
import {
  fetchInstitutionLicenses,
  fetchLicensePlans,
  updateCurrentLicense,
  type InstitutionLicenseRow,
  type LicensePlan,
} from '../../../api/licensing'
import { formatApiError } from '../../../utils/apiError'

function fieldClass() {
  return 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20'
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function InstitutionLicensesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const focusInstitutionId = searchParams.get('institution_id')

  const [rows, setRows] = useState<InstitutionLicenseRow[]>([])
  const [plans, setPlans] = useState<LicensePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  const [editing, setEditing] = useState<InstitutionLicenseRow | null>(null)
  const [form, setForm] = useState({
    license_plan_id: '',
    license_status: 'active',
    payment_status: 'paid',
    expiry_date: '',
    max_users_override: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [licRes, planRes] = await Promise.all([
        fetchInstitutionLicenses({
          search: search || undefined,
          license_status: statusFilter || undefined,
          payment_status: paymentFilter || undefined,
        }),
        fetchLicensePlans({ active_only: true }),
      ])
      setRows(licRes.data.data || [])
      setPlans(planRes.data.data || [])
    } catch (err) {
      setError(formatApiError(err, 'Unable to load institution licenses.'))
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, paymentFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!focusInstitutionId || rows.length === 0) return
    const match = rows.find((r) => String(r.institution.id) === String(focusInstitutionId))
    if (match) openEdit(match)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusInstitutionId, rows.length])

  const filtered = useMemo(() => rows, [rows])

  function openEdit(row: InstitutionLicenseRow) {
    setEditing(row)
    setSaveMsg('')
    setForm({
      license_plan_id: row.plan?.id ? String(row.plan.id) : '',
      license_status: row.license_status || 'active',
      payment_status: row.payment_status || 'unpaid',
      expiry_date: row.expiry_date ? row.expiry_date.slice(0, 10) : '',
      max_users_override: row.max_users != null ? String(row.max_users) : '',
      is_active: row.institution.is_active,
    })
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    setSaveMsg('')
    try {
      await updateCurrentLicense(editing.institution.id, {
        license_plan_id: form.license_plan_id ? Number(form.license_plan_id) : undefined,
        license_status: form.license_status,
        payment_status: form.payment_status,
        expiry_date: form.expiry_date || null,
        max_users_override: form.max_users_override === '' ? null : Number(form.max_users_override),
        is_active: form.is_active,
      })
      setSaveMsg('License updated.')
      setEditing(null)
      await load()
    } catch (err) {
      setSaveMsg(formatApiError(err, 'Could not update license.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            <Link to="/super-admin/licensing" className="hover:text-[#1e3a5f]">Licenses &amp; Billing</Link>
            {' / '}Institution Licenses
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Institution Licenses</h1>
          <p className="mt-1 text-sm text-slate-500">Assign and manage the current license for each institution.</p>
        </div>
        <Link
          to="/super-admin/licensing/assign"
          className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d4a73]"
        >
          Assign license
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className={`${fieldClass()} pl-9`}
            placeholder="Search institution…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={fieldClass()} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All license statuses</option>
          {['active', 'trial', 'pending_payment', 'grace_period', 'overdue', 'expired', 'suspended'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className={fieldClass()} value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          <option value="">All payment statuses</option>
          {['paid', 'unpaid', 'partially_paid', 'pending', 'overdue'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Institution</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">License</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={`${row.institution.id}-${row.id}`} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{row.institution.name}</div>
                    <div className="text-xs text-slate-500">{row.institution.code}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.plan?.name || row.plan_name || '—'}</td>
                  <td className="px-4 py-3 capitalize text-slate-700">{row.license_status}</td>
                  <td className="px-4 py-3 capitalize text-slate-700">{row.payment_status}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(row.expiry_date)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.current_users ?? 0}{row.max_users != null ? ` / ${row.max_users}` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {row.currency} {Number(row.balance || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/super-admin/institutions/${row.institution.id}`)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="rounded-lg bg-[#1e3a5f] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#2d4a73]"
                      >
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">No institution licenses found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Manage license · {editing.institution.name}</h3>
            {saveMsg && <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{saveMsg}</div>}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <select className={`sm:col-span-2 ${fieldClass()}`} value={form.license_plan_id} onChange={(e) => setForm((p) => ({ ...p, license_plan_id: e.target.value }))}>
                <option value="">Select plan…</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
              <select className={fieldClass()} value={form.license_status} onChange={(e) => setForm((p) => ({ ...p, license_status: e.target.value }))}>
                {['active', 'trial', 'pending_payment', 'grace_period', 'overdue', 'expired', 'suspended', 'draft'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select className={fieldClass()} value={form.payment_status} onChange={(e) => setForm((p) => ({ ...p, payment_status: e.target.value }))}>
                {['paid', 'unpaid', 'partially_paid', 'pending', 'overdue'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input type="date" className={fieldClass()} value={form.expiry_date} onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))} />
              <input type="number" min={0} placeholder="Max users" className={fieldClass()} value={form.max_users_override} onChange={(e) => setForm((p) => ({ ...p, max_users_override: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
                Institution is active
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
