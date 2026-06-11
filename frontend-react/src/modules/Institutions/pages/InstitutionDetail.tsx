import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/ToastProvider'
import HasPermission from '../../../components/HasPermission'
import type { Institution } from '../types'
import { institutionFileUrl } from '../utils'
import { useInstitutions } from '../hooks/useInstitutions'

type Props = {
  institutionId: number
  onClose: () => void
  onEdit: () => void
}

const gatewayLabels: Record<string, string> = {
  stripe: 'Stripe (Visa / Card)',
  campay: 'Campay (Mobile Money)',
  flutterwave: 'Flutterwave',
  paystack: 'Paystack',
  pesapal: 'Pesapal',
  mtn_momo: 'MTN MoMo',
  airtel_money: 'Airtel Money',
  mpesa: 'M-Pesa',
  orange_money: 'Orange Money',
}

function institutionFeeLabel(fee: { key?: string; label?: string }): string {
  if (fee.label && fee.label !== 'Tuition Fee') {
    return fee.label
  }
  if (fee.key === 'registration_fee' || fee.key === 'tuition_fee') {
    return 'Registration Fee'
  }
  return fee.label || fee.key || '—'
}

export default function InstitutionDetail({ institutionId, onClose, onEdit }: Props) {
  const { pushToast } = useToast()
  const { t } = useTranslation()
  const { loading, fetchInstitution } = useInstitutions()
  const [institution, setInstitution] = useState<Institution | null>(null)

  useEffect(() => {
    fetchInstitution(institutionId)
      .then(setInstitution)
      .catch((error: any) => pushToast(error?.response?.data?.message || t('institutions.detail.loadError'), 'error'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId])

  const academicTree = useMemo(() => institution?.settings?.academic_structure?.faculties || [], [institution])
  const grades = useMemo(() => institution?.settings?.grading_system?.grades || [], [institution])
  const semesters = useMemo(() => institution?.settings?.academic_calendar?.semesters || [], [institution])
  const fees = useMemo(() => institution?.settings?.fee_structure?.fees || [], [institution])
  const gateways = useMemo(() => institution?.settings?.payment_settings?.gateways || {}, [institution])

  const gatewayEntries = useMemo(() => {
    const keys = new Set([...Object.keys(gatewayLabels), ...Object.keys(gateways)])
    return Array.from(keys).map((key) => ({
      key,
      label: gatewayLabels[key] || key,
      enabled: Boolean((gateways as any)[key]?.enabled),
    }))
  }, [gateways])

  const timelineRange = useMemo(() => {
    const dated = semesters.filter((s: any) => s.start && s.end)
    if (dated.length === 0) return null
    const starts = dated.map((s: any) => new Date(s.start).getTime())
    const ends = dated.map((s: any) => new Date(s.end).getTime())
    const min = Math.min(...starts)
    const max = Math.max(...ends)
    return { min, max, span: Math.max(max - min, 1) }
  }, [semesters])

  return (
    <Modal title={t('institutions.detail.title')} open={true} onClose={onClose} wide>
      {loading || !institution ? (
        <div className="flex items-center gap-2 p-4 text-slate-500">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
          {t('institutions.detail.loading')}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              {institutionFileUrl(institution, 'logo') ? (
                <img src={institutionFileUrl(institution, 'logo')!} alt={institution.name} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-600 ring-1 ring-slate-200">
                  {institution.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-xl font-semibold text-slate-900">{institution.name}</div>
                <div className="text-sm text-slate-500">
                  {institution.code} • {t(`institutions.types.${institution.type}` as any, { defaultValue: institution.type })} • {institution.country || '-'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${institution.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {institution.is_active ? t('institutions.status.active') : t('institutions.status.inactive')}
                  </span>
                  {institution.subscription_plan && (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{institution.subscription_plan}</span>
                  )}
                </div>
              </div>
            </div>

            <HasPermission permission="institutions.edit">
              <button onClick={onEdit} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                {t('institutions.edit')}
              </button>
            </HasPermission>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-3 text-sm font-semibold text-slate-900">{t('institutions.detail.contact')}</div>
              <div className="space-y-2 text-sm text-slate-700">
                <div><span className="font-medium">{t('institutions.detail.email')}:</span> {institution.email || '-'}</div>
                <div><span className="font-medium">{t('institutions.detail.phone')}:</span> {institution.phone || '-'}</div>
                <div><span className="font-medium">{t('institutions.detail.website')}:</span> {institution.website || '-'}</div>
                <div><span className="font-medium">{t('institutions.detail.address')}:</span> {institution.address || '-'}</div>
                <div><span className="font-medium">{t('institutions.detail.city')}:</span> {institution.city || '-'}</div>
                <div><span className="font-medium">{t('institutions.detail.countryLabel')}:</span> {institution.country || '-'}</div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-3 text-sm font-semibold text-slate-900">{t('institutions.detail.preferences')}</div>
              <div className="space-y-2 text-sm text-slate-700">
                <div><span className="font-medium">{t('institutions.detail.language')}:</span> {institution.language === 'fr' ? t('common.french') : t('common.english')}</div>
                <div><span className="font-medium">{t('institutions.detail.currency')}:</span> {institution.currency || '-'}</div>
                <div><span className="font-medium">{t('institutions.detail.timezone')}:</span> {institution.timezone || '-'}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-3 text-sm font-semibold text-slate-900">{t('institutions.detail.branding')}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { label: t('institutions.detail.letterhead'), field: 'letterhead' as const },
                    { label: t('institutions.detail.stamp'), field: 'official_stamp' as const },
                  ] as const
                ).map((item) => {
                  const url = institutionFileUrl(institution, item.field)
                  const path = institution[item.field]
                  return (
                    <div key={item.field} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs font-semibold text-slate-700">{item.label}</div>
                      {url ? (
                        path?.toLowerCase().endsWith('.pdf') ? (
                          <a className="mt-2 inline-block text-sm text-blue-700 underline" href={url} target="_blank" rel="noreferrer">
                            {t('institutions.detail.viewPdf')}
                          </a>
                        ) : (
                          <img className="mt-2 h-28 w-full rounded-xl object-cover ring-1 ring-slate-200" src={url} alt={item.label} />
                        )
                      ) : (
                        <div className="mt-2 text-sm text-slate-400">{t('institutions.detail.notSet')}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-3 text-sm font-semibold text-slate-900">{t('institutions.detail.gateways')}</div>
              {gatewayEntries.length === 0 ? (
                <div className="text-sm text-slate-400">{t('institutions.detail.noGateways')}</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {gatewayEntries.map(({ key, label, enabled }) => (
                    <span
                      key={key}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                    >
                      {label} — {enabled ? t('institutions.detail.gatewayActive') : t('institutions.detail.gatewayInactive')}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="mb-3 text-sm font-semibold text-slate-900">{t('institutions.detail.fees')}</div>
            {fees.length === 0 ? (
              <div className="text-sm text-slate-400">{t('institutions.detail.notConfigured')}</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">{t('institutions.name')}</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">{t('institutions.detail.amount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {fees.map((fee: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm text-slate-800">{institutionFeeLabel(fee)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {fee.amount} {institution.settings?.fee_structure?.currency || institution.currency || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-3 text-sm font-semibold text-slate-900">{t('institutions.detail.academic')}</div>
              {academicTree.length === 0 ? (
                <div className="text-sm text-slate-400">{t('institutions.detail.notConfigured')}</div>
              ) : (
                <div className="space-y-3">
                  {academicTree.map((f: any, idx: number) => (
                    <details key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-800">{f.name || 'Faculty'}</summary>
                      <div className="mt-2 space-y-2 pl-2">
                        {(f.departments || []).map((d: any, j: number) => (
                          <details key={j} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <summary className="cursor-pointer text-sm font-semibold text-slate-800">{d.name || 'Department'}</summary>
                            <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                              {(d.programmes || []).map((p: any, k: number) => (
                                <li key={k}>{p.name || 'Programme'}</li>
                              ))}
                            </ul>
                          </details>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-3 text-sm font-semibold text-slate-900">{t('institutions.detail.calendar')}</div>
              {semesters.length === 0 ? (
                <div className="text-sm text-slate-400">{t('institutions.detail.notConfigured')}</div>
              ) : (
                <div className="space-y-4">
                  {timelineRange && (
                    <div className="relative h-3 rounded-full bg-slate-100">
                      {semesters.map((s: any, idx: number) => {
                        if (!s.start || !s.end) return null
                        const start = new Date(s.start).getTime()
                        const end = new Date(s.end).getTime()
                        const left = ((start - timelineRange.min) / timelineRange.span) * 100
                        const width = Math.max(((end - start) / timelineRange.span) * 100, 2)
                        return (
                          <div
                            key={idx}
                            title={`${s.name}: ${s.start} → ${s.end}`}
                            className={`absolute top-0 h-3 rounded-full ${s.is_current ? 'bg-emerald-500' : 'bg-blue-400'}`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                          />
                        )
                      })}
                    </div>
                  )}
                  {semesters.map((s: any, idx: number) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-800">{s.name}</div>
                        {s.is_current && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{t('institutions.detail.current')}</span>}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {s.start || '-'} → {s.end || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="mb-3 text-sm font-semibold text-slate-900">{t('institutions.detail.grading')}</div>
            {grades.length === 0 ? (
              <div className="text-sm text-slate-400">{t('institutions.detail.notConfigured')}</div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">{t('institutions.detail.grade')}</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">{t('institutions.detail.min')}</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">{t('institutions.detail.max')}</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">{t('institutions.detail.gpa')}</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-700">{t('institutions.detail.remarks')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {grades.map((g: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{g.grade}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{g.min}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{g.max}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{g.gpa}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{g.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
