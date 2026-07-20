import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Copy, Loader2, Plus, Save } from 'lucide-react'
import {
  createLicensePlan,
  duplicateLicensePlan,
  fetchLicensePlans,
  fetchModulePricing,
  previewLicensePricing,
  setLicensePlanStatus,
  updateLicensePlan,
  type LicensePlan,
  type ModuleCommercial,
  type PricingPreview,
} from '../../../api/licensing'
import { formatApiError } from '../../../utils/apiError'

const LICENSE_TYPES = [
  { value: 'free', label: 'Free' },
  { value: 'fixed_plan', label: 'Fixed plan' },
  { value: 'modular', label: 'Modular' },
  { value: 'per_student_semester', label: 'Per student per semester' },
  { value: 'usage_based', label: 'Usage-based' },
  { value: 'custom_contract', label: 'Custom contract' },
]

const BILLING_CYCLES = ['monthly', 'quarterly', 'six_months', 'yearly', 'one_time', 'custom']

function fieldClass() {
  return 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20'
}

const emptyForm = {
  name: '',
  code: '',
  description: '',
  license_type: 'fixed_plan',
  pricing_model: 'fixed',
  billing_cycle: 'yearly',
  currency: 'XAF',
  base_price: '0',
  setup_fee: '0',
  renewal_fee: '0',
  late_fee: '0',
  max_users: '',
  max_students: '',
  price_per_student: '',
  minimum_billable_students: '',
  down_payment_type: 'percentage',
  down_payment_value: '30',
  minimum_down_payment: '',
  student_count_method: 'enrolled_registered',
  student_count_lock_rule: 'semester_lock_date',
  additional_student_rule: 'bill_full_rate',
  withdrawn_student_rule: 'no_auto_credit_after_lock',
  balance_due_rule: 'after_lock_reconciliation',
  activation_rule: 'after_verified_down_payment',
  count_suspended_students: false,
  count_deferred_students: false,
  count_withdrawn_students: false,
  count_graduated_students: false,
  estimated_students: '100',
  status: 'active',
  is_featured: false,
  display_order: '0',
  grace_period_days: '7',
  module_ids: [] as number[],
}

export default function LicensePlansPage() {
  const [plans, setPlans] = useState<LicensePlan[]>([])
  const [modules, setModules] = useState<ModuleCommercial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState<LicensePlan | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<PricingPreview | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [plansRes, modulesRes] = await Promise.all([
        fetchLicensePlans(),
        fetchModulePricing().catch(() => ({ data: { data: [] as ModuleCommercial[] } })),
      ])
      setPlans(plansRes.data.data || [])
      setModules(modulesRes.data.data || [])
    } catch (err) {
      setError(formatApiError(err, 'Unable to load license plans.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const showPerStudent = form.license_type === 'per_student_semester'
  const showModular = form.license_type === 'modular' || form.license_type === 'fixed_plan'

  const moduleTotal = useMemo(() => {
    return form.module_ids.reduce((sum, id) => {
      const mod = modules.find((m) => m.id === id)
      if (!mod || mod.is_free) return sum
      const price =
        form.billing_cycle === 'monthly' ? mod.monthly_price
          : form.billing_cycle === 'quarterly' ? mod.quarterly_price
            : form.billing_cycle === 'six_months' ? mod.six_month_price
              : form.billing_cycle === 'one_time' ? mod.one_time_price
                : mod.yearly_price
      return sum + Number(price || 0) + Number(mod.setup_fee || 0)
    }, 0)
  }, [form.module_ids, form.billing_cycle, modules])

  useEffect(() => {
    if (!(creating || editing)) return
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const res = await previewLicensePricing({
          license_type: form.license_type,
          currency: form.currency,
          base_price: Number(form.base_price || 0),
          setup_fee: Number(form.setup_fee || 0),
          module_total: moduleTotal,
          price_per_student: form.price_per_student === '' ? 0 : Number(form.price_per_student),
          estimated_students: Number(form.estimated_students || 0),
          minimum_billable_students: form.minimum_billable_students === '' ? 0 : Number(form.minimum_billable_students),
          down_payment_type: form.down_payment_type || null,
          down_payment_value: form.down_payment_value === '' ? 0 : Number(form.down_payment_value),
          minimum_down_payment: form.minimum_down_payment === '' ? 0 : Number(form.minimum_down_payment),
        })
        if (!cancelled) setPreview(res.data.data)
      } catch {
        if (!cancelled) setPreview(null)
      }
    }, 300)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [creating, editing, form, moduleTotal])

  function openCreate() {
    setEditing(null)
    setCreating(true)
    setForm(emptyForm)
    setMessage('')
    setPreview(null)
  }

  function openEdit(plan: LicensePlan) {
    setCreating(false)
    setEditing(plan)
    setForm({
      ...emptyForm,
      name: plan.name,
      code: plan.code,
      description: plan.description || '',
      license_type: plan.license_type,
      pricing_model: plan.pricing_model || 'fixed',
      billing_cycle: plan.billing_cycle || 'yearly',
      currency: plan.currency || 'XAF',
      base_price: String(plan.base_price ?? 0),
      setup_fee: String(plan.setup_fee ?? 0),
      renewal_fee: String(plan.renewal_fee ?? 0),
      late_fee: String(plan.late_fee ?? 0),
      max_users: plan.max_users != null ? String(plan.max_users) : '',
      max_students: plan.max_students != null ? String(plan.max_students) : '',
      price_per_student: plan.price_per_student != null ? String(plan.price_per_student) : '',
      minimum_billable_students:
        plan.minimum_billable_students != null ? String(plan.minimum_billable_students) : '',
      down_payment_type: plan.down_payment_type || 'percentage',
      down_payment_value: plan.down_payment_value != null ? String(plan.down_payment_value) : '',
      minimum_down_payment: plan.minimum_down_payment != null ? String(plan.minimum_down_payment) : '',
      student_count_method: plan.student_count_method || 'enrolled_registered',
      student_count_lock_rule: plan.student_count_lock_rule || 'semester_lock_date',
      additional_student_rule: plan.additional_student_rule || 'bill_full_rate',
      withdrawn_student_rule: plan.withdrawn_student_rule || 'no_auto_credit_after_lock',
      balance_due_rule: plan.balance_due_rule || 'after_lock_reconciliation',
      activation_rule: plan.activation_rule || 'after_verified_down_payment',
      count_suspended_students: !!plan.count_suspended_students,
      count_deferred_students: !!plan.count_deferred_students,
      count_withdrawn_students: !!plan.count_withdrawn_students,
      count_graduated_students: !!plan.count_graduated_students,
      status: plan.status,
      is_featured: plan.is_featured,
      display_order: String(plan.display_order ?? 0),
      grace_period_days: String(plan.grace_period_days ?? 7),
      module_ids: plan.module_ids || plan.modules?.map((m) => m.id) || [],
    })
    setMessage('')
  }

  function closeEditor() {
    setEditing(null)
    setCreating(false)
    setPreview(null)
  }

  function toggleModule(id: number) {
    setForm((prev) => ({
      ...prev,
      module_ids: prev.module_ids.includes(id)
        ? prev.module_ids.filter((x) => x !== id)
        : [...prev.module_ids, id],
    }))
  }

  async function save() {
    setSaving(true)
    setMessage('')
    const payload: Record<string, unknown> = {
      name: form.name,
      code: form.code || undefined,
      description: form.description || null,
      license_type: form.license_type,
      pricing_model: form.license_type === 'per_student_semester' ? 'per_student' : form.pricing_model,
      billing_cycle: form.billing_cycle,
      currency: form.currency,
      base_price: Number(form.base_price || 0),
      setup_fee: Number(form.setup_fee || 0),
      renewal_fee: Number(form.renewal_fee || 0),
      late_fee: Number(form.late_fee || 0),
      max_users: form.max_users === '' ? null : Number(form.max_users),
      max_students: form.max_students === '' ? null : Number(form.max_students),
      price_per_student: form.price_per_student === '' ? null : Number(form.price_per_student),
      minimum_billable_students:
        form.minimum_billable_students === '' ? null : Number(form.minimum_billable_students),
      down_payment_type: form.down_payment_type || null,
      down_payment_value: form.down_payment_value === '' ? null : Number(form.down_payment_value),
      minimum_down_payment: form.minimum_down_payment === '' ? null : Number(form.minimum_down_payment),
      student_billing_period: form.license_type === 'per_student_semester' ? 'semester' : null,
      student_count_method: showPerStudent ? form.student_count_method : null,
      student_count_lock_rule: showPerStudent ? form.student_count_lock_rule : null,
      additional_student_rule: showPerStudent ? form.additional_student_rule : null,
      withdrawn_student_rule: showPerStudent ? form.withdrawn_student_rule : null,
      balance_due_rule: showPerStudent ? form.balance_due_rule : null,
      activation_rule: showPerStudent ? form.activation_rule : null,
      count_suspended_students: form.count_suspended_students,
      count_deferred_students: form.count_deferred_students,
      count_withdrawn_students: form.count_withdrawn_students,
      count_graduated_students: form.count_graduated_students,
      status: form.status,
      is_featured: form.is_featured,
      display_order: Number(form.display_order || 0),
      grace_period_days: Number(form.grace_period_days || 0),
      module_ids: form.module_ids,
    }

    try {
      if (editing) {
        await updateLicensePlan(editing.id, payload)
        setMessage('Plan updated.')
      } else {
        await createLicensePlan(payload)
        setMessage('Plan created.')
      }
      closeEditor()
      await load()
    } catch (err) {
      setMessage(formatApiError(err, 'Could not save plan.'))
    } finally {
      setSaving(false)
    }
  }

  async function onDuplicate(plan: LicensePlan) {
    try {
      await duplicateLicensePlan(plan.id)
      await load()
    } catch (err) {
      setError(formatApiError(err, 'Could not duplicate plan.'))
    }
  }

  async function onArchive(plan: LicensePlan) {
    try {
      await setLicensePlanStatus(plan.id, plan.status === 'archived' ? 'active' : 'archived')
      await load()
    } catch (err) {
      setError(formatApiError(err, 'Could not update plan status.'))
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            <Link to="/super-admin/licensing" className="hover:text-[#1e3a5f]">Licenses &amp; Billing</Link>
            {' / '}Plans
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">License Plans</h1>
          <p className="mt-1 text-sm text-slate-500">Full plan CRUD with per-student config, modules, and live pricing preview.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/super-admin/licensing/module-pricing" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Module pricing
          </Link>
          <Link to="/super-admin/licensing/assign" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Assign license
          </Link>
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2d4a73]">
            <Plus className="h-4 w-4" /> New plan
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {message && <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading plans…</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Billing</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Modules</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{plan.name}</div>
                    <div className="text-xs text-slate-500">{plan.code}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-700">{plan.license_type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 capitalize text-slate-700">{plan.billing_cycle}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {plan.license_type === 'per_student_semester'
                      ? `${plan.currency} ${Number(plan.price_per_student || 0).toLocaleString()} / student`
                      : `${plan.currency} ${Number(plan.base_price || 0).toLocaleString()}`}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{plan.modules?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">{plan.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => openEdit(plan)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                      <button type="button" onClick={() => onDuplicate(plan)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        <Copy className="h-3 w-3" /> Duplicate
                      </button>
                      <button type="button" onClick={() => onArchive(plan)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        {plan.status === 'archived' ? 'Activate' : 'Archive'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">{editing ? 'Edit plan' : 'Create plan'}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input className={fieldClass()} placeholder="Plan name *" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              <input className={fieldClass()} placeholder="Plan code" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
              <select className={fieldClass()} value={form.license_type} onChange={(e) => setForm((p) => ({ ...p, license_type: e.target.value }))}>
                {LICENSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select className={fieldClass()} value={form.billing_cycle} onChange={(e) => setForm((p) => ({ ...p, billing_cycle: e.target.value }))}>
                {BILLING_CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className={fieldClass()} placeholder="Currency" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} />
              <select className={fieldClass()} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                {['active', 'inactive', 'draft', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea className={`sm:col-span-2 ${fieldClass()}`} rows={2} placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />

              {!showPerStudent && (
                <>
                  <input className={fieldClass()} type="number" min={0} placeholder="Base price" value={form.base_price} onChange={(e) => setForm((p) => ({ ...p, base_price: e.target.value }))} />
                  <input className={fieldClass()} type="number" min={0} placeholder="Setup fee" value={form.setup_fee} onChange={(e) => setForm((p) => ({ ...p, setup_fee: e.target.value }))} />
                  <input className={fieldClass()} type="number" min={0} placeholder="Renewal fee" value={form.renewal_fee} onChange={(e) => setForm((p) => ({ ...p, renewal_fee: e.target.value }))} />
                  <input className={fieldClass()} type="number" min={0} placeholder="Late fee" value={form.late_fee} onChange={(e) => setForm((p) => ({ ...p, late_fee: e.target.value }))} />
                </>
              )}

              {showPerStudent && (
                <>
                  <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Per-student plans activate without upfront platform payment; assign with academic year + semester to create billing.
                  </div>
                  <input className={fieldClass()} type="number" min={0} placeholder="Price per student / semester *" value={form.price_per_student} onChange={(e) => setForm((p) => ({ ...p, price_per_student: e.target.value }))} />
                  <input className={fieldClass()} type="number" min={0} placeholder="Minimum billable students" value={form.minimum_billable_students} onChange={(e) => setForm((p) => ({ ...p, minimum_billable_students: e.target.value }))} />
                  <select className={fieldClass()} value={form.down_payment_type} onChange={(e) => setForm((p) => ({ ...p, down_payment_type: e.target.value }))}>
                    <option value="percentage">Down payment: percentage</option>
                    <option value="fixed_amount">Down payment: fixed amount</option>
                    <option value="minimum_student_charge">Down payment: minimum student charge</option>
                    <option value="custom">Down payment: custom</option>
                  </select>
                  <input className={fieldClass()} type="number" min={0} placeholder="Down-payment value" value={form.down_payment_value} onChange={(e) => setForm((p) => ({ ...p, down_payment_value: e.target.value }))} />
                  <input className={fieldClass()} type="number" min={0} placeholder="Minimum down payment" value={form.minimum_down_payment} onChange={(e) => setForm((p) => ({ ...p, minimum_down_payment: e.target.value }))} />
                  <input className={fieldClass()} type="number" min={0} placeholder="Preview estimated students" value={form.estimated_students} onChange={(e) => setForm((p) => ({ ...p, estimated_students: e.target.value }))} />
                  <select className={fieldClass()} value={form.student_count_method} onChange={(e) => setForm((p) => ({ ...p, student_count_method: e.target.value }))}>
                    <option value="enrolled_registered">Count: enrolled/registered</option>
                    <option value="active_students">Count: active students</option>
                    <option value="manual">Count: manual</option>
                  </select>
                  <select className={fieldClass()} value={form.student_count_lock_rule} onChange={(e) => setForm((p) => ({ ...p, student_count_lock_rule: e.target.value }))}>
                    <option value="semester_lock_date">Lock on semester lock date</option>
                    <option value="manual_lock">Manual lock</option>
                  </select>
                  <select className={fieldClass()} value={form.additional_student_rule} onChange={(e) => setForm((p) => ({ ...p, additional_student_rule: e.target.value }))}>
                    <option value="bill_full_rate">Additional students: bill full rate</option>
                    <option value="prorate">Additional students: prorate</option>
                    <option value="next_semester">Additional students: next semester</option>
                    <option value="ignore">Additional students: ignore</option>
                  </select>
                  <select className={fieldClass()} value={form.withdrawn_student_rule} onChange={(e) => setForm((p) => ({ ...p, withdrawn_student_rule: e.target.value }))}>
                    <option value="no_auto_credit_after_lock">Withdrawals: no auto credit after lock</option>
                    <option value="credit_before_lock">Withdrawals: credit before lock</option>
                  </select>
                  <select className={fieldClass()} value={form.balance_due_rule} onChange={(e) => setForm((p) => ({ ...p, balance_due_rule: e.target.value }))}>
                    <option value="after_lock_reconciliation">Balance due after lock</option>
                    <option value="end_of_semester">Balance due end of semester</option>
                  </select>
                  <select className={fieldClass()} value={form.activation_rule} onChange={(e) => setForm((p) => ({ ...p, activation_rule: e.target.value }))}>
                    <option value="after_verified_down_payment">Activate after verified down payment</option>
                    <option value="immediate">Activate immediately</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.count_suspended_students} onChange={(e) => setForm((p) => ({ ...p, count_suspended_students: e.target.checked }))} /> Count suspended</label>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.count_deferred_students} onChange={(e) => setForm((p) => ({ ...p, count_deferred_students: e.target.checked }))} /> Count deferred</label>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.count_withdrawn_students} onChange={(e) => setForm((p) => ({ ...p, count_withdrawn_students: e.target.checked }))} /> Count withdrawn</label>
                  <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.count_graduated_students} onChange={(e) => setForm((p) => ({ ...p, count_graduated_students: e.target.checked }))} /> Count graduated</label>
                </>
              )}

              <input className={fieldClass()} type="number" min={0} placeholder="Max users" value={form.max_users} onChange={(e) => setForm((p) => ({ ...p, max_users: e.target.value }))} />
              <input className={fieldClass()} type="number" min={0} placeholder="Max students" value={form.max_students} onChange={(e) => setForm((p) => ({ ...p, max_students: e.target.value }))} />
              <input className={fieldClass()} type="number" min={0} placeholder="Grace period days" value={form.grace_period_days} onChange={(e) => setForm((p) => ({ ...p, grace_period_days: e.target.value }))} />
              <input className={fieldClass()} type="number" min={0} placeholder="Display order" value={form.display_order} onChange={(e) => setForm((p) => ({ ...p, display_order: e.target.value }))} />
              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))} />
                Featured plan
              </label>

              {showModular && modules.length > 0 && (
                <div className="sm:col-span-2 rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-medium text-slate-800">Included modules</p>
                  <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
                    {modules.map((mod) => (
                      <label key={mod.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={form.module_ids.includes(mod.id)} onChange={() => toggleModule(mod.id)} />
                        <span>{mod.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {preview && (
                <div className="sm:col-span-2 rounded-xl border border-[#1e3a5f]/20 bg-[#1e3a5f]/5 p-3 text-sm text-slate-800">
                  <p className="font-semibold text-[#1e3a5f]">Live pricing preview</p>
                  {showPerStudent ? (
                    <ul className="mt-2 space-y-1">
                      <li>Billable qty: {preview.billable_qty}</li>
                      <li>Estimated total: {preview.currency} {Number(preview.estimated_total || 0).toLocaleString()}</li>
                      <li>Required down payment: {preview.currency} {Number(preview.required_down_payment || 0).toLocaleString()}</li>
                      <li>Estimated balance: {preview.currency} {Number(preview.estimated_balance || 0).toLocaleString()}</li>
                    </ul>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      <li>Base + setup + modules: {preview.currency} {Number(preview.calculated_amount || preview.total_amount || 0).toLocaleString()}</li>
                      <li>Total: {preview.currency} {Number(preview.total_amount || 0).toLocaleString()}</li>
                    </ul>
                  )}
                  {preview.note ? <p className="mt-2 text-xs text-slate-500">{preview.note}</p> : null}
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeEditor} className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" disabled={saving || !form.name} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
