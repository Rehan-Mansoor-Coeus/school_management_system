import React, { useEffect, useMemo, useRef, useState } from 'react'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/ToastProvider'
import HasPermission from '../../../components/HasPermission'
import { useAuth } from '../../../context/AuthContext'
import type { Institution, InstitutionType } from '../types'
import { institutionFileUrl } from '../utils'
import { useTranslation } from 'react-i18next'
import { useInstitutions } from '../hooks/useInstitutions'

type Props = {
  mode: 'create' | 'edit'
  institutionId: number | null
  onClose: () => void
  onSaved: () => void
}

type Faculty = { name: string; departments: Department[] }
type Department = { name: string; programmes: Programme[] }
type Programme = { name: string }
type FeeItem = { key: string; label: string; amount: number }
type GradeRow = { grade: string; min: number; max: number; gpa: number; remarks?: string }
type SemesterRow = { name: string; start: string; end: string; is_current: boolean }

const defaultInstitutionFees = (): FeeItem[] => [
  { key: 'registration_fee', label: 'Registration Fee', amount: 0 },
  { key: 'hostel_fee', label: 'Hostel Fee', amount: 0 },
  { key: 'library_fee', label: 'Library Fee', amount: 0 },
  { key: 'examination_fee', label: 'Examination Fee', amount: 0 },
]

function normalizeInstitutionFees(fees: FeeItem[]): FeeItem[] {
  const merged = fees.map((fee) => {
    if (fee.key === 'application_fee') {
      return {
        ...fee,
        key: 'registration_fee',
        label: 'Registration Fee',
      }
    }
    if (fee.key === 'tuition_fee') {
      return { ...fee, label: 'Tuition Fee' }
    }
    return fee
  })

  const byKey = new Map<string, FeeItem>()
  merged.forEach((fee) => {
    const existing = byKey.get(fee.key)
    if (!existing) {
      byKey.set(fee.key, fee)
      return
    }
    if ((fee.amount || 0) > (existing.amount || 0)) {
      byKey.set(fee.key, { ...existing, amount: fee.amount, label: fee.label || existing.label })
    }
  })

  return Array.from(byKey.values())
}

const institutionTypeKeys: InstitutionType[] = ['university', 'college', 'school', 'vocational', 'technical', 'training']

const gateways = [
  { key: 'stripe', label: 'Stripe (Visa / Card)' },
  { key: 'campay', label: 'Campay (Mobile Money)' },
  { key: 'flutterwave', label: 'Flutterwave' },
  { key: 'paystack', label: 'Paystack' },
  { key: 'pesapal', label: 'Pesapal' },
  { key: 'mtn_momo', label: 'MTN MoMo' },
  { key: 'airtel_money', label: 'Airtel Money' },
  { key: 'mpesa', label: 'M-Pesa' },
  { key: 'orange_money', label: 'Orange Money' },
] as const

type SimpleGatewayKey = Exclude<(typeof gateways)[number]['key'], 'stripe' | 'campay'>

type PaymentGatewayState = {
  enabled: boolean
  apiKey: string
  secretKey: string
  publicKey: string
  momoToken: string
  momoAppId: string
  momoAppUsername: string
  momoAppPassword: string
  momoAppWebhook: string
}

const emptyGatewayState = (): PaymentGatewayState => ({
  enabled: false,
  apiKey: '',
  secretKey: '',
  publicKey: '',
  momoToken: '',
  momoAppId: '',
  momoAppUsername: '',
  momoAppPassword: '',
  momoAppWebhook: '',
})

const simpleGatewayKeys = gateways
  .map((g) => g.key)
  .filter((key): key is SimpleGatewayKey => key !== 'stripe' && key !== 'campay')

export default function InstitutionForm({ mode, institutionId, onClose, onSaved }: Props) {
  const { pushToast } = useToast()
  const { hasPermission } = useAuth()
  const { t } = useTranslation()
  const { loading, fetchInstitution, createInstitution, updateInstitution } = useInstitutions()

  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const [basic, setBasic] = useState({
    name: '',
    code: '',
    type: 'university' as InstitutionType,
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    country: '',
    language: 'en' as 'en' | 'fr',
    currency: '',
    timezone: '',
    is_active: true,
    subscription_plan: '',
  })

  const [branding, setBranding] = useState<{
    logo: File | null
    letterhead: File | null
    registrar_signature: File | null
    official_stamp: File | null
    current: Partial<Institution>
  }>({
    logo: null,
    letterhead: null,
    registrar_signature: null,
    official_stamp: null,
    current: {},
  })

  const [faculties, setFaculties] = useState<Faculty[]>([{ name: 'Faculty of...', departments: [{ name: 'Department of...', programmes: [{ name: 'Programme...' }] }] }])
  const [fees, setFees] = useState<FeeItem[]>(defaultInstitutionFees())
  const [grades, setGrades] = useState<GradeRow[]>([
    { grade: 'A', min: 70, max: 100, gpa: 4.0, remarks: 'Excellent' },
    { grade: 'B', min: 60, max: 69, gpa: 3.0, remarks: 'Very Good' },
    { grade: 'C', min: 50, max: 59, gpa: 2.0, remarks: 'Good' },
    { grade: 'D', min: 45, max: 49, gpa: 1.0, remarks: 'Pass' },
    { grade: 'F', min: 0, max: 44, gpa: 0.0, remarks: 'Fail' },
  ])
  const [calendar, setCalendar] = useState<SemesterRow[]>([{ name: 'Semester 1', start: '', end: '', is_current: true }])
  const [payment, setPayment] = useState<Record<string, PaymentGatewayState>>(() => {
    const base: Record<string, PaymentGatewayState> = {}
    gateways.forEach((g) => (base[g.key] = emptyGatewayState()))
    return base
  })

  const steps = useMemo(() => {
    const baseSteps = [
      t('institutions.form.steps.basic'),
      t('institutions.form.steps.branding'),
      t('institutions.form.steps.academic'),
      t('institutions.form.steps.fees'),
      t('institutions.form.steps.grading'),
      t('institutions.form.steps.calendar'),
    ]
    if (hasPermission('institutions.settings')) baseSteps.push(t('institutions.form.steps.payment'))
    return baseSteps
  }, [hasPermission, t])

  const hydrating = useRef(false)
  const mounted = useRef(false)
  const ignoreNextDirty = useRef(false)

  const handleClose = () => {
    if (dirty && !window.confirm(t('institutions.form.unsavedWarning'))) return
    onClose()
  }

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const canShowPayment = hasPermission('institutions.settings')

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (hydrating.current) return
    if (ignoreNextDirty.current) {
      ignoreNextDirty.current = false
      return
    }
    setDirty(true)
  }, [basic, branding, faculties, fees, grades, calendar, payment])

  useEffect(() => {
    if (mode !== 'edit' || !institutionId) return
    hydrating.current = true
    fetchInstitution(institutionId)
      .then((inst) => {
        setBasic((current) => ({
          ...current,
          name: inst.name || '',
          code: inst.code || '',
          type: (inst.type || 'university') as InstitutionType,
          email: inst.email || '',
          phone: inst.phone || '',
          website: inst.website || '',
          address: inst.address || '',
          city: inst.city || '',
          country: inst.country || '',
          language: (inst.language || 'en') as 'en' | 'fr',
          currency: inst.currency || '',
          timezone: inst.timezone || '',
          is_active: Boolean(inst.is_active),
          subscription_plan: inst.subscription_plan || '',
        }))

        setBranding((current) => ({ ...current, current: inst }))

        const s = inst.settings || null
        if (s?.academic_structure?.faculties) setFaculties(s.academic_structure.faculties)
        if (s?.fee_structure?.fees) setFees(normalizeInstitutionFees(s.fee_structure.fees))
        if (s?.grading_system?.grades) setGrades(s.grading_system.grades)
        if (s?.academic_calendar?.semesters) setCalendar(s.academic_calendar.semesters)
        if (s?.payment_settings?.gateways) {
          const gw = s.payment_settings.gateways as Record<string, any>
          setPayment((prev) => {
            const next = { ...prev }
            gateways.forEach((g) => {
              const existing = gw[g.key] || {}
              next[g.key] = {
                enabled: Boolean(existing.enabled),
                apiKey: existing.apiKey || existing.api_key || '',
                secretKey: existing.secretKey || existing.secret_key || '',
                publicKey: existing.publicKey || existing.public_key || '',
                momoToken: existing.momo_token || existing.momoToken || '',
                momoAppId: existing.momo_app_id || existing.momoAppId || '',
                momoAppUsername: existing.momo_app_username || existing.momoAppUsername || '',
                momoAppPassword: existing.momo_app_password || existing.momoAppPassword || '',
                momoAppWebhook: existing.momo_app_webhook || existing.momoAppWebhook || '',
              }
            })
            return next
          })
        }
        ignoreNextDirty.current = true
        setDirty(false)
      })
      .catch((error: any) => {
        pushToast(error?.response?.data?.message || t('institutions.form.loadError'), 'error')
        onClose()
      })
      .finally(() => {
        hydrating.current = false
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, institutionId])

  const validateClient = () => {
    const nextErrors: Record<string, string[]> = {}
    if (!basic.name.trim()) nextErrors.name = ['Name is required.']
    if (!basic.code.trim()) nextErrors.code = ['Code is required.']
    if (!basic.type) nextErrors.type = ['Type is required.']
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const buildPayload = () => {
    const form = new FormData()
    Object.entries(basic).forEach(([key, value]) => {
      form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : (value as any))
    })

    const academic_structure = { faculties }
    const fee_structure = { fees, currency: basic.currency || null }
    const grading_system = { grades }
    const academic_calendar = { semesters: calendar }
    const payment_settings = canShowPayment
      ? {
          gateways: Object.fromEntries(
            gateways.map((g) => {
              const value = payment[g.key]
              if (g.key === 'stripe') {
                return [
                  g.key,
                  {
                    enabled: value.enabled,
                    publicKey: value.publicKey,
                    secretKey: value.secretKey,
                  },
                ]
              }
              if (g.key === 'campay') {
                return [
                  g.key,
                  {
                    enabled: value.enabled,
                    momo_token: value.momoToken,
                    momo_app_id: value.momoAppId,
                    momo_app_username: value.momoAppUsername,
                    momo_app_password: value.momoAppPassword,
                    momo_app_webhook: value.momoAppWebhook,
                  },
                ]
              }
              return [
                g.key,
                {
                  enabled: value.enabled,
                  apiKey: value.apiKey,
                  secretKey: value.secretKey,
                },
              ]
            })
          ),
        }
      : undefined

    form.append('academic_structure', JSON.stringify(academic_structure))
    form.append('fee_structure', JSON.stringify(fee_structure))
    form.append('grading_system', JSON.stringify(grading_system))
    form.append('academic_calendar', JSON.stringify(academic_calendar))
    if (payment_settings) form.append('payment_settings', JSON.stringify(payment_settings))

    if (branding.logo) form.append('logo', branding.logo)
    if (branding.letterhead) form.append('letterhead', branding.letterhead)
    if (mode === 'edit' && branding.registrar_signature) form.append('registrar_signature', branding.registrar_signature)
    if (branding.official_stamp) form.append('official_stamp', branding.official_stamp)

    return form
  }

  const save = async () => {
    if (!validateClient()) return
    setSaving(true)
    setErrors({})
    try {
      const payload = buildPayload()
      if (mode === 'create') {
        await createInstitution(payload)
        pushToast(t('institutions.form.created'), 'success')
      } else if (institutionId) {
        await updateInstitution(institutionId, payload)
        pushToast(t('institutions.form.updated'), 'success')
      }
      setDirty(false)
      onSaved()
    } catch (error: any) {
      if (error?.response?.status === 422) {
        setErrors(error.response.data?.errors || {})
      }
      pushToast(error?.response?.data?.message || t('institutions.form.saveError'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const currentStepName = steps[step] || steps[0]

  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  const fieldError = (key: string) => (errors[key] || []).join(' ')

  return (
    <Modal title={mode === 'create' ? t('institutions.form.addTitle') : t('institutions.form.editTitle')} open={true} onClose={handleClose} wide>
      {loading ? (
        <div className="flex items-center gap-2 p-6 text-slate-500">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          {t('institutions.form.loading')}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {steps.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(idx)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  idx === step ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="mb-4 text-sm font-semibold text-slate-900">{currentStepName}</div>

            {step === 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Institution name</label>
                  <input
                    value={basic.name}
                    onChange={(e) => setBasic((c) => ({ ...c, name: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  />
                  {fieldError('name') && <div className="mt-1 text-sm text-rose-600">{fieldError('name')}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Code</label>
                  <input
                    value={basic.code}
                    onChange={(e) => setBasic((c) => ({ ...c, code: e.target.value.toUpperCase() }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  />
                  {fieldError('code') && <div className="mt-1 text-sm text-rose-600">{fieldError('code')}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Type</label>
                  <select
                    value={basic.type}
                    onChange={(e) => setBasic((c) => ({ ...c, type: e.target.value as InstitutionType }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  >
                    {institutionTypeKeys.map((value) => (
                      <option key={value} value={value}>
                        {t(`institutions.types.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Language</label>
                  <select
                    value={basic.language}
                    onChange={(e) => setBasic((c) => ({ ...c, language: e.target.value as any }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  >
                    <option value="en">English</option>
                    <option value="fr">French</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    value={basic.email}
                    onChange={(e) => setBasic((c) => ({ ...c, email: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  />
                  {fieldError('email') && <div className="mt-1 text-sm text-rose-600">{fieldError('email')}</div>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Phone</label>
                  <input
                    value={basic.phone}
                    onChange={(e) => setBasic((c) => ({ ...c, phone: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Website</label>
                  <input
                    value={basic.website}
                    onChange={(e) => setBasic((c) => ({ ...c, website: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Subscription plan</label>
                  <input
                    value={basic.subscription_plan}
                    onChange={(e) => setBasic((c) => ({ ...c, subscription_plan: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Address</label>
                  <input
                    value={basic.address}
                    onChange={(e) => setBasic((c) => ({ ...c, address: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">City</label>
                  <input
                    value={basic.city}
                    onChange={(e) => setBasic((c) => ({ ...c, city: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Country</label>
                  <input
                    value={basic.country}
                    onChange={(e) => setBasic((c) => ({ ...c, country: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Currency</label>
                  <input
                    value={basic.currency}
                    onChange={(e) => setBasic((c) => ({ ...c, currency: e.target.value.toUpperCase() }))}
                    placeholder="e.g. NGN, KES, GHS"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Timezone</label>
                  <input
                    value={basic.timezone}
                    onChange={(e) => setBasic((c) => ({ ...c, timezone: e.target.value }))}
                    placeholder="e.g. Africa/Lagos"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={basic.is_active}
                      onChange={(e) => setBasic((c) => ({ ...c, is_active: e.target.checked }))}
                    />
                    Active
                  </label>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                {(
                  [
                    { key: 'logo', label: 'Logo', accept: 'image/*', current: branding.current.logo },
                    { key: 'letterhead', label: 'Letterhead (image/pdf)', accept: 'image/*,application/pdf', current: branding.current.letterhead },
                    ...(mode === 'edit'
                      ? [{ key: 'registrar_signature' as const, label: 'Registrar signature', accept: 'image/*', current: branding.current.registrar_signature }]
                      : []),
                    { key: 'official_stamp', label: 'Official stamp', accept: 'image/*', current: branding.current.official_stamp },
                  ] as const
                ).map((item) => (
                  <div key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 text-sm font-semibold text-slate-800">{item.label}</div>
                    {institutionFileUrl(branding.current, item.key) && (
                      <div className="mb-3">
                        {item.current?.toString().toLowerCase().endsWith('.pdf') ? (
                          <a
                            href={institutionFileUrl(branding.current, item.key)!}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-700 underline"
                          >
                            {t('institutions.form.fields.viewCurrent')}
                          </a>
                        ) : (
                          <img src={institutionFileUrl(branding.current, item.key)!} alt={item.label} className="h-24 w-full rounded-xl object-cover ring-1 ring-slate-200" />
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      accept={item.accept}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setBranding((c) => ({ ...c, [item.key]: file } as any))
                      }}
                      className="block w-full text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {faculties.map((faculty, fIdx) => (
                  <div key={fIdx} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <input
                        value={faculty.name}
                        onChange={(e) =>
                          setFaculties((current) => current.map((f, idx) => (idx === fIdx ? { ...f, name: e.target.value } : f)))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                        placeholder="Faculty / School name"
                      />
                      <button
                        type="button"
                        onClick={() => setFaculties((current) => current.filter((_, idx) => idx !== fIdx))}
                        className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {faculty.departments.map((dept, dIdx) => (
                        <div key={dIdx} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <input
                              value={dept.name}
                              onChange={(e) =>
                                setFaculties((current) =>
                                  current.map((f, idx) =>
                                    idx === fIdx
                                      ? {
                                          ...f,
                                          departments: f.departments.map((d, j) => (j === dIdx ? { ...d, name: e.target.value } : d)),
                                        }
                                      : f
                                  )
                                )
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
                              placeholder="Department name"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setFaculties((current) =>
                                  current.map((f, idx) =>
                                    idx === fIdx ? { ...f, departments: f.departments.filter((_, j) => j !== dIdx) } : f
                                  )
                                )
                              }
                              className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="mt-3 space-y-2">
                            {dept.programmes.map((prog, pIdx) => (
                              <div key={pIdx} className="flex gap-2">
                                <input
                                  value={prog.name}
                                  onChange={(e) =>
                                    setFaculties((current) =>
                                      current.map((f, idx) =>
                                        idx === fIdx
                                          ? {
                                              ...f,
                                              departments: f.departments.map((d, j) =>
                                                j === dIdx
                                                  ? {
                                                      ...d,
                                                      programmes: d.programmes.map((p, k) => (k === pIdx ? { ...p, name: e.target.value } : p)),
                                                    }
                                                  : d
                                              ),
                                            }
                                          : f
                                      )
                                    )
                                  }
                                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-slate-900"
                                  placeholder="Programme name"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFaculties((current) =>
                                      current.map((f, idx) =>
                                        idx === fIdx
                                          ? {
                                              ...f,
                                              departments: f.departments.map((d, j) =>
                                                j === dIdx ? { ...d, programmes: d.programmes.filter((_, k) => k !== pIdx) } : d
                                              ),
                                            }
                                          : f
                                      )
                                    )
                                  }
                                  className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() =>
                                setFaculties((current) =>
                                  current.map((f, idx) =>
                                    idx === fIdx
                                      ? {
                                          ...f,
                                          departments: f.departments.map((d, j) =>
                                            j === dIdx ? { ...d, programmes: [...d.programmes, { name: '' }] } : d
                                          ),
                                        }
                                      : f
                                  )
                                )
                              }
                              className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                            >
                              + Add Programme
                            </button>
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          setFaculties((current) =>
                            current.map((f, idx) =>
                              idx === fIdx ? { ...f, departments: [...f.departments, { name: '', programmes: [{ name: '' }] }] } : f
                            )
                          )
                        }
                        className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                      >
                        + Add Department
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setFaculties((current) => [...current, { name: '', departments: [{ name: '', programmes: [{ name: '' }] }] }])}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  + Add Faculty/School
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Set standard institution fees. Tuition per semester or year will be configured separately later.
                </p>
                {fees.map((fee, idx) => (
                  <div key={fee.key} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                    <input
                      value={fee.label}
                      onChange={(e) => setFees((current) => current.map((f, i) => (i === idx ? { ...f, label: e.target.value } : f)))}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-slate-900"
                      placeholder="Fee name"
                    />
                    <input
                      type="number"
                      value={fee.amount}
                      onChange={(e) => setFees((current) => current.map((f, i) => (i === idx ? { ...f, amount: Number(e.target.value) } : f)))}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-slate-900"
                      placeholder="Amount"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm text-slate-600">{basic.currency || 'Currency not set'}</div>
                      <button
                        type="button"
                        onClick={() => setFees((current) => current.filter((_, i) => i !== idx))}
                        className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFees((current) => [...current, { key: `custom_${Date.now()}`, label: 'Custom fee', amount: 0 }])}
                  className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                >
                  + Add custom fee
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setGrades([
                        { grade: 'A', min: 70, max: 100, gpa: 4.0, remarks: 'Excellent' },
                        { grade: 'B', min: 60, max: 69, gpa: 3.0, remarks: 'Very Good' },
                        { grade: 'C', min: 50, max: 59, gpa: 2.0, remarks: 'Good' },
                        { grade: 'D', min: 45, max: 49, gpa: 1.0, remarks: 'Pass' },
                        { grade: 'F', min: 0, max: 44, gpa: 0.0, remarks: 'Fail' },
                      ])
                    }
                    className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Load GPA 4.0 Scale
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGrades([
                        { grade: 'A', min: 80, max: 100, gpa: 4.0, remarks: 'Excellent' },
                        { grade: 'B', min: 70, max: 79, gpa: 3.0, remarks: 'Very Good' },
                        { grade: 'C', min: 60, max: 69, gpa: 2.0, remarks: 'Good' },
                        { grade: 'D', min: 50, max: 59, gpa: 1.0, remarks: 'Pass' },
                        { grade: 'F', min: 0, max: 49, gpa: 0.0, remarks: 'Fail' },
                      ])
                    }
                    className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Load Percentage Scale
                  </button>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">Grade</th>
                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">Min</th>
                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">Max</th>
                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">GPA</th>
                        <th className="px-4 py-3 text-sm font-semibold text-slate-700">Remarks</th>
                        <th className="px-4 py-3 text-sm font-semibold text-slate-700"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {grades.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">
                            <input
                              value={row.grade}
                              onChange={(e) => setGrades((c) => c.map((r, i) => (i === idx ? { ...r, grade: e.target.value } : r)))}
                              className="w-20 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-900"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={row.min}
                              onChange={(e) => setGrades((c) => c.map((r, i) => (i === idx ? { ...r, min: Number(e.target.value) } : r)))}
                              className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-900"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={row.max}
                              onChange={(e) => setGrades((c) => c.map((r, i) => (i === idx ? { ...r, max: Number(e.target.value) } : r)))}
                              className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-900"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step="0.1"
                              value={row.gpa}
                              onChange={(e) => setGrades((c) => c.map((r, i) => (i === idx ? { ...r, gpa: Number(e.target.value) } : r)))}
                              className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-900"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              value={row.remarks || ''}
                              onChange={(e) => setGrades((c) => c.map((r, i) => (i === idx ? { ...r, remarks: e.target.value } : r)))}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-slate-900"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => setGrades((c) => c.filter((_, i) => i !== idx))}
                              className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={() => setGrades((c) => [...c, { grade: '', min: 0, max: 0, gpa: 0, remarks: '' }])}
                  className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                >
                  + Add grade row
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                {calendar.map((sem, idx) => (
                  <div key={idx} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-5">
                    <input
                      value={sem.name}
                      onChange={(e) => setCalendar((c) => c.map((s, i) => (i === idx ? { ...s, name: e.target.value } : s)))}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-slate-900 md:col-span-2"
                      placeholder="Semester name"
                    />
                    <input
                      type="date"
                      value={sem.start}
                      onChange={(e) => setCalendar((c) => c.map((s, i) => (i === idx ? { ...s, start: e.target.value } : s)))}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-slate-900"
                    />
                    <input
                      type="date"
                      value={sem.end}
                      onChange={(e) => setCalendar((c) => c.map((s, i) => (i === idx ? { ...s, end: e.target.value } : s)))}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 outline-none focus:border-slate-900"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="current_semester"
                          checked={sem.is_current}
                          onChange={() => setCalendar((c) => c.map((s, i) => ({ ...s, is_current: i === idx })))}
                        />
                        Current
                      </label>
                      <button
                        type="button"
                        onClick={() => setCalendar((c) => c.filter((_, i) => i !== idx))}
                        className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setCalendar((c) => [...c, { name: '', start: '', end: '', is_current: c.length === 0 }])}
                  className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                >
                  + Add semester/term
                </button>
              </div>
            )}

            {canShowPayment && step === 6 && (
              <HasPermission permission="institutions.settings" fallback={<div className="text-sm text-slate-500">{t('institutions.form.paymentNoAccess')}</div>}>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-800">Stripe (Visa / Card)</div>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={payment.stripe.enabled}
                          onChange={(e) => setPayment((c) => ({ ...c, stripe: { ...c.stripe, enabled: e.target.checked } }))}
                        />
                        {t('institutions.form.enabled')}
                      </label>
                    </div>
                    {payment.stripe.enabled && (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">{t('institutions.form.publicKey')}</label>
                          <input
                            value={payment.stripe.publicKey}
                            onChange={(e) => setPayment((c) => ({ ...c, stripe: { ...c.stripe, publicKey: e.target.value } }))}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">{t('institutions.form.privateKey')}</label>
                          <input
                            type="password"
                            value={payment.stripe.secretKey}
                            onChange={(e) => setPayment((c) => ({ ...c, stripe: { ...c.stripe, secretKey: e.target.value } }))}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-800">Campay (Mobile Money)</div>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={payment.campay.enabled}
                          onChange={(e) => setPayment((c) => ({ ...c, campay: { ...c.campay, enabled: e.target.checked } }))}
                        />
                        {t('institutions.form.enabled')}
                      </label>
                    </div>
                    {payment.campay.enabled && (
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">{t('institutions.form.momoToken')}</label>
                          <input
                            type="password"
                            value={payment.campay.momoToken}
                            onChange={(e) => setPayment((c) => ({ ...c, campay: { ...c.campay, momoToken: e.target.value } }))}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">{t('institutions.form.momoAppId')}</label>
                          <input
                            value={payment.campay.momoAppId}
                            onChange={(e) => setPayment((c) => ({ ...c, campay: { ...c.campay, momoAppId: e.target.value } }))}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">{t('institutions.form.momoAppUsername')}</label>
                          <input
                            value={payment.campay.momoAppUsername}
                            onChange={(e) => setPayment((c) => ({ ...c, campay: { ...c.campay, momoAppUsername: e.target.value } }))}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">{t('institutions.form.momoAppPassword')}</label>
                          <input
                            type="password"
                            value={payment.campay.momoAppPassword}
                            onChange={(e) => setPayment((c) => ({ ...c, campay: { ...c.campay, momoAppPassword: e.target.value } }))}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700">{t('institutions.form.momoAppWebhook')}</label>
                          <input
                            value={payment.campay.momoAppWebhook}
                            onChange={(e) => setPayment((c) => ({ ...c, campay: { ...c.campay, momoAppWebhook: e.target.value } }))}
                            placeholder="https://your-domain.com/api/admissions/payment/campay/webhook"
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {simpleGatewayKeys.map((key) => {
                    const gateway = gateways.find((g) => g.key === key)!
                    return (
                    <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-800">{gateway.label}</div>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={payment[key].enabled}
                            onChange={(e) => setPayment((c) => ({ ...c, [key]: { ...c[key], enabled: e.target.checked } }))}
                          />
                          {t('institutions.form.enabled')}
                        </label>
                      </div>
                      {payment[key].enabled && (
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-slate-700">{t('institutions.form.apiKey')}</label>
                            <input
                              value={payment[key].apiKey}
                              onChange={(e) => setPayment((c) => ({ ...c, [key]: { ...c[key], apiKey: e.target.value } }))}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700">{t('institutions.form.secretKey')}</label>
                            <input
                              type="password"
                              value={payment[key].secretKey}
                              onChange={(e) => setPayment((c) => ({ ...c, [key]: { ...c[key], secretKey: e.target.value } }))}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    )
                  })}
                </div>
              </HasPermission>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                step === 0 ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {t('common.back')}
            </button>
            <div className="flex gap-2">
              {step < steps.length - 1 ? (
                <button type="button" onClick={next} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                  {t('common.next')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${saving ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-800'}`}
                >
                  {saving ? t('common.saving') : t('common.save')}
                </button>
              )}
              <button type="button" onClick={handleClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

