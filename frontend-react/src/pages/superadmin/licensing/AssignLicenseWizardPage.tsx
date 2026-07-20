import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import {
  assignInstitutionLicense,
  fetchLicensePlans,
  fetchModulePricing,
  fetchSchoolAcademicYears,
  previewLicensePricing,
  type LicensePlan,
  type ModuleCommercial,
  type PricingPreview,
} from '../../../api/licensing'
import { fetchSchools, type SchoolSummary } from '../../../api/superadmin'
import { formatApiError } from '../../../utils/apiError'
import { ColoredTabsBar } from '../../../components/ui/ColoredModuleTabsNav'

function fieldClass() {
  return 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20'
}

const STEPS = [
  { id: '1', label: 'Institution' },
  { id: '2', label: 'Plan' },
  { id: '3', label: 'Configure' },
  { id: '4', label: 'Review' },
]

export default function AssignLicenseWizardPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [step, setStep] = useState(0)
  const [schools, setSchools] = useState<SchoolSummary[]>([])
  const [plans, setPlans] = useState<LicensePlan[]>([])
  const [modules, setModules] = useState<ModuleCommercial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<PricingPreview | null>(null)

  const [institutionId, setInstitutionId] = useState(params.get('institution_id') || '')
  const [planId, setPlanId] = useState('')
  const [moduleIds, setModuleIds] = useState<number[]>([])
  const [customAmount, setCustomAmount] = useState('')
  const [discountAmount, setDiscountAmount] = useState('0')
  const [licenseStatus, setLicenseStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [createNewPeriod, setCreateNewPeriod] = useState(true)
  const [academicYears, setAcademicYears] = useState<{ id: number; name: string; is_current?: boolean }[]>([])
  const [academicYearId, setAcademicYearId] = useState('')
  const [semesterName, setSemesterName] = useState('first')
  const [estimatedStudents, setEstimatedStudents] = useState('100')
  const [lockDate, setLockDate] = useState('')

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const [schoolsRes, plansRes, modulesRes] = await Promise.all([
          fetchSchools(),
          fetchLicensePlans({ active_only: true }),
          fetchModulePricing().catch(() => ({ data: { data: [] as ModuleCommercial[] } })),
        ])
        setSchools(schoolsRes.data.data || [])
        setPlans(plansRes.data.data || [])
        setModules(modulesRes.data.data || [])
      } catch (err) {
        setError(formatApiError(err, 'Unable to load wizard data.'))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const selectedPlan = useMemo(
    () => plans.find((p) => String(p.id) === planId) || null,
    [plans, planId],
  )

  const selectedSchool = useMemo(
    () => schools.find((s) => String(s.id) === institutionId) || null,
    [schools, institutionId],
  )

  useEffect(() => {
    if (!selectedPlan) {
      setPreview(null)
      return
    }
    setModuleIds(selectedPlan.module_ids || selectedPlan.modules?.map((m) => m.id) || [])
    if (selectedPlan.license_type === 'per_student_semester' || selectedPlan.license_type === 'free') {
      setLicenseStatus('active')
      setPaymentStatus(selectedPlan.license_type === 'free' ? 'paid' : 'pending')
    } else {
      setLicenseStatus('pending_payment')
      setPaymentStatus('unpaid')
    }
  }, [selectedPlan?.id])

  useEffect(() => {
    if (!institutionId) {
      setAcademicYears([])
      setAcademicYearId('')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetchSchoolAcademicYears(Number(institutionId))
        if (cancelled) return
        const years = res.data.data || []
        setAcademicYears(years)
        const current = years.find((y) => y.is_current) || years[0]
        setAcademicYearId(current ? String(current.id) : '')
      } catch {
        if (!cancelled) {
          setAcademicYears([])
          setAcademicYearId('')
        }
      }
    })()
    return () => { cancelled = true }
  }, [institutionId])

  const moduleTotal = useMemo(() => {
    return moduleIds.reduce((sum, id) => {
      const mod = modules.find((m) => m.id === id)
      if (!mod || mod.is_free) return sum
      return sum + Number(mod.yearly_price || mod.one_time_price || 0) + Number(mod.setup_fee || 0)
    }, 0)
  }, [moduleIds, modules])

  useEffect(() => {
    if (!selectedPlan || step < 2) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await previewLicensePricing({
          license_type: selectedPlan.license_type,
          currency: selectedPlan.currency,
          base_price: selectedPlan.base_price,
          setup_fee: selectedPlan.setup_fee,
          module_total: moduleTotal,
          custom_amount: customAmount === '' ? null : Number(customAmount),
          discount_amount: Number(discountAmount || 0),
          price_per_student: selectedPlan.price_per_student,
          minimum_billable_students: selectedPlan.minimum_billable_students,
          down_payment_type: selectedPlan.down_payment_type,
          down_payment_value: selectedPlan.down_payment_value,
          minimum_down_payment: selectedPlan.minimum_down_payment,
          estimated_students: Number(estimatedStudents || 100),
        })
        if (!cancelled) setPreview(res.data.data)
      } catch {
        if (!cancelled) setPreview(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedPlan, moduleTotal, customAmount, discountAmount, step, estimatedStudents])

  const isPerStudent = selectedPlan?.license_type === 'per_student_semester'

  function canNext() {
    if (step === 0) return !!institutionId
    if (step === 1) return !!planId
    if (step === 2 && isPerStudent) return !!academicYearId && !!semesterName
    return true
  }

  async function submit() {
    if (!institutionId || !planId) return
    setSaving(true)
    setError('')
    try {
      const total = Number(preview?.total_amount ?? preview?.estimated_total ?? 0)
      const res = await assignInstitutionLicense({
        institution_id: Number(institutionId),
        license_plan_id: Number(planId),
        module_ids: moduleIds,
        custom_amount: customAmount === '' ? null : Number(customAmount),
        discount_amount: Number(discountAmount || 0),
        total_amount: total,
        license_status: licenseStatus || undefined,
        payment_status: paymentStatus || undefined,
        expiry_date: expiryDate || null,
        notes: notes || null,
        create_new_period: createNewPeriod,
        adjustment_amount: customAmount === '' ? 0 : Number(customAmount) - Number(preview?.calculated_amount || total),
        adjustment_reason: adjustmentReason || undefined,
        ...(isPerStudent ? {
          academic_year_id: Number(academicYearId),
          semester_name: semesterName,
          estimated_students: Number(estimatedStudents || 0),
          student_count_lock_date: lockDate || null,
          estimate_reason: adjustmentReason || 'Assigned via wizard',
        } : {}),
      })
      navigate(
        isPerStudent
          ? '/super-admin/licensing/semester-licenses'
          : `/super-admin/institutions/${institutionId}`,
        { state: { licenseAssigned: res.data.message } },
      )
    } catch (err) {
      setError(formatApiError(err, 'Could not assign license.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center gap-2 p-6 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading wizard…</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm text-slate-500">
          <Link to="/super-admin/licensing" className="hover:text-[#1e3a5f]">Licenses &amp; Billing</Link>
          {' / '}Assign license
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Assign License Wizard</h1>
        <p className="mt-1 text-sm text-slate-500">Select institution, plan, modules, and negotiated amounts in one flow.</p>
      </div>

      <ColoredTabsBar
        items={STEPS.map((s) => ({ id: s.id, label: s.label, color: Number(s.id) - 1 === step ? 'navy' : 'amber' }))}
        activeId={String(step + 1)}
        onChange={(id) => {
          const next = Number(id) - 1
          if (next <= step) setStep(next)
        }}
      />

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900">1. Select institution</h2>
            <select className={fieldClass()} value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
              <option value="">Choose school…</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900">2. Select license plan</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setPlanId(String(plan.id))}
                  className={`rounded-xl border p-4 text-left transition ${
                    planId === String(plan.id)
                      ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 ring-2 ring-[#1e3a5f]/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-900">{plan.name}</div>
                  <div className="mt-1 text-xs capitalize text-slate-500">{plan.license_type.replace(/_/g, ' ')}</div>
                  <div className="mt-2 text-sm text-slate-700">
                    {plan.license_type === 'per_student_semester'
                      ? `${plan.currency} ${Number(plan.price_per_student || 0).toLocaleString()} / student`
                      : `${plan.currency} ${Number(plan.base_price || 0).toLocaleString()}`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedPlan && (
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-900">3. Configure modules & amounts</h2>
            {isPerStudent && (
              <div className="grid gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:grid-cols-2">
                <p className="sm:col-span-2 text-sm font-medium text-amber-900">Per-student semester assignment</p>
                <label className="text-sm text-slate-600">Academic year
                  <select className={fieldClass()} value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
                    <option value="">Select year…</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>{y.name}{y.is_current ? ' (current)' : ''}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-600">Semester
                  <select className={fieldClass()} value={semesterName} onChange={(e) => setSemesterName(e.target.value)}>
                    {['first', 'second', 'third', 'summer'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-slate-600">Estimated students
                  <input type="number" min={0} className={fieldClass()} value={estimatedStudents} onChange={(e) => setEstimatedStudents(e.target.value)} />
                </label>
                <label className="text-sm text-slate-600">Count lock date
                  <input type="date" className={fieldClass()} value={lockDate} onChange={(e) => setLockDate(e.target.value)} />
                </label>
                {academicYears.length === 0 && institutionId && (
                  <p className="sm:col-span-2 text-xs text-amber-800">
                    This institution has no academic years yet. Create one under Academics before assigning a semester license.
                  </p>
                )}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {!isPerStudent && (
                <>
                  <label className="text-sm text-slate-600">License status
                    <select className={fieldClass()} value={licenseStatus} onChange={(e) => setLicenseStatus(e.target.value)}>
                      {['pending_payment', 'active', 'trial', 'draft'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-slate-600">Payment status
                    <select className={fieldClass()} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                      {['unpaid', 'partially_paid', 'paid', 'pending'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-slate-600">Expiry date
                    <input type="date" className={fieldClass()} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                  </label>
                  <label className="text-sm text-slate-600">Negotiated / custom amount
                    <input type="number" min={0} className={fieldClass()} value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder="Leave blank to use calculated" />
                  </label>
                  <label className="text-sm text-slate-600">Discount
                    <input type="number" min={0} className={fieldClass()} value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />
                  </label>
                </>
              )}
              <label className="text-sm text-slate-600">Adjustment / estimate reason
                <input className={fieldClass()} value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} />
              </label>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={createNewPeriod} onChange={(e) => setCreateNewPeriod(e.target.checked)} />
              Create new license period (recommended when changing plan)
            </label>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-800">Modules</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {modules.map((mod) => (
                  <label key={mod.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={moduleIds.includes(mod.id)}
                      onChange={() => setModuleIds((prev) => (
                        prev.includes(mod.id) ? prev.filter((x) => x !== mod.id) : [...prev, mod.id]
                      ))}
                    />
                    {mod.name}
                  </label>
                ))}
              </div>
            </div>
            {preview && (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Preview total: <strong>{preview.currency} {Number(preview.total_amount ?? preview.estimated_total ?? 0).toLocaleString()}</strong>
                {preview.note ? <span className="block text-xs text-slate-500">{preview.note}</span> : null}
              </div>
            )}
            <textarea className={fieldClass()} rows={2} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-sm text-slate-700">
            <h2 className="font-semibold text-slate-900">4. Review & assign</h2>
            <dl className="grid gap-2 sm:grid-cols-2">
              <div><dt className="text-slate-500">Institution</dt><dd className="font-medium">{selectedSchool?.name}</dd></div>
              <div><dt className="text-slate-500">Plan</dt><dd className="font-medium">{selectedPlan?.name}</dd></div>
              <div><dt className="text-slate-500">Type</dt><dd className="font-medium capitalize">{selectedPlan?.license_type.replace(/_/g, ' ')}</dd></div>
              <div><dt className="text-slate-500">Modules</dt><dd className="font-medium">{moduleIds.length}</dd></div>
              {!isPerStudent && (
                <>
                  <div><dt className="text-slate-500">License status</dt><dd className="font-medium">{licenseStatus}</dd></div>
                  <div><dt className="text-slate-500">Payment status</dt><dd className="font-medium">{paymentStatus}</dd></div>
                </>
              )}
              {isPerStudent && (
                <>
                  <div><dt className="text-slate-500">Academic year</dt><dd className="font-medium">{academicYears.find((y) => String(y.id) === academicYearId)?.name || '—'}</dd></div>
                  <div><dt className="text-slate-500">Semester</dt><dd className="font-medium capitalize">{semesterName}</dd></div>
                  <div><dt className="text-slate-500">Estimated students</dt><dd className="font-medium">{estimatedStudents}</dd></div>
                  <div><dt className="text-slate-500">Down payment</dt><dd className="font-medium">{preview?.currency} {Number(preview?.required_down_payment ?? 0).toLocaleString()}</dd></div>
                </>
              )}
              <div><dt className="text-slate-500">Total</dt><dd className="font-medium">{preview?.currency} {Number(preview?.total_amount ?? preview?.estimated_total ?? 0).toLocaleString()}</dd></div>
            </dl>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              disabled={!canNext()}
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Assign license
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
