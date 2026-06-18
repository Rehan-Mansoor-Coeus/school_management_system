import { useEffect, useState } from 'react'
import { fetchStudentAdmissionsDashboard } from '../../../api/admissions'
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n'
import { useFormatMoney } from '../../../hooks/useFormatMoney'
import DashboardStatCard from '../../../components/ui/DashboardStatCard'

type FeeRow = {
  id?: number
  semester_name?: string
  total_amount: number
  amount_paid: number
  balance: number
  payment_status: string
  expected_payment_date?: string | null
}

type DashboardData = {
  registration_fee_status?: { status: string; amount: number; paid: boolean }
  tuition_fee_status?: { status: string; amount: number; paid: boolean }
  enrollment?: {
    semester_fee?: number
    amount_paid?: number
    outstanding_balance?: number
    payment_status?: string
    fees?: FeeRow[]
  } | null
}

export default function StudentFeesPage() {
  const { t } = useAdmissionsI18n()
  const { formatMoney } = useFormatMoney()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudentAdmissionsDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="text-sm text-slate-500">{t('loading')}</p>
  }

  const reg = data?.registration_fee_status
  const tuition = data?.tuition_fee_status
  const enrollmentFees = data?.enrollment?.fees || []

  const totalPaid =
    (reg?.paid ? reg.amount : 0) +
    (tuition?.paid ? tuition.amount : 0) +
    enrollmentFees.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0)

  const pendingTotal =
    (!reg?.paid ? reg?.amount || 0 : 0) +
    (!tuition?.paid && tuition?.status === 'due' ? tuition.amount || 0 : 0) +
    enrollmentFees.reduce((sum, fee) => sum + (fee.balance > 0 ? fee.balance : 0), 0)

  const allFees: Array<{ label: string; amount: number; status: string; due?: string | null }> = []

  if (reg && reg.amount > 0) {
    allFees.push({
      label: t('registrationFee'),
      amount: reg.amount,
      status: reg.paid ? t('paid') : t('pending'),
    })
  }
  if (tuition && tuition.amount > 0) {
    allFees.push({
      label: t('tuitionFee'),
      amount: tuition.amount,
      status: tuition.paid ? t('paid') : tuition.status,
    })
  }
  enrollmentFees.forEach((fee) => {
    allFees.push({
      label: fee.semester_name || 'Semester fee',
      amount: fee.total_amount,
      status: fee.payment_status,
      due: fee.expected_payment_date,
    })
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-slate-900">{t('feesTab')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('feesTabSubtitle')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <DashboardStatCard label={t('totalFeesPaid')} value={formatMoney(totalPaid)} />
        <DashboardStatCard label={t('pendingFees')} value={formatMoney(pendingTotal)} />
        <DashboardStatCard label={t('feeItemsCount')} value={allFees.length} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">{t('feeType')}</th>
              <th className="px-4 py-3">{t('amount')}</th>
              <th className="px-4 py-3">{t('status')}</th>
              <th className="px-4 py-3">{t('dueDate')}</th>
            </tr>
          </thead>
          <tbody>
            {allFees.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  {t('noFeesYet')}
                </td>
              </tr>
            ) : (
              allFees.map((fee, index) => (
                <tr key={`${fee.label}-${index}`} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{fee.label}</td>
                  <td className="px-4 py-3">{formatMoney(fee.amount)}</td>
                  <td className="px-4 py-3 capitalize">{fee.status}</td>
                  <td className="px-4 py-3">{fee.due || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
