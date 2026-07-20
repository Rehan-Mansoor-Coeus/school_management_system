import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, FileText, Layers, Loader2, School } from 'lucide-react'
import {
  fetchInstitutionLicenses,
  fetchLicensePlans,
  fetchLicensingOverviewKpis,
  type LicensingOverviewKpis,
} from '../../../api/licensing'
import { fetchPlatformOverview } from '../../../api/superadmin'
import { formatApiError } from '../../../utils/apiError'

export default function LicensingOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    plans: 0,
    institutions: 0,
    activeLicenses: 0,
    unpaid: 0,
    overdue: 0,
    expired: 0,
  })
  const [kpis, setKpis] = useState<LicensingOverviewKpis | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [plansRes, licensesRes, overviewRes, kpiRes] = await Promise.all([
          fetchLicensePlans(),
          fetchInstitutionLicenses(),
          fetchPlatformOverview(),
          fetchLicensingOverviewKpis().catch(() => ({ data: { data: null } })),
        ])
        if (cancelled) return
        const licenses = licensesRes.data.data || []
        setStats({
          plans: (plansRes.data.data || []).length,
          institutions: overviewRes.data.total_schools || licenses.length,
          activeLicenses: licenses.filter((l) => l.license_status === 'active').length,
          unpaid: licenses.filter((l) => ['unpaid', 'pending', 'partially_paid'].includes(l.payment_status)).length,
          overdue: licenses.filter((l) => l.license_status === 'overdue' || l.payment_status === 'overdue').length,
          expired: overviewRes.data.expired_licenses || licenses.filter((l) => l.license_status === 'expired').length,
        })
        setKpis(kpiRes.data.data)
      } catch (err) {
        if (!cancelled) setError(formatApiError(err, 'Unable to load licensing overview.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const cards = [
    { label: 'License plans', value: stats.plans, icon: Layers, to: '/super-admin/licensing/plans' },
    { label: 'Institutions', value: stats.institutions, icon: School, to: '/super-admin/institutions' },
    { label: 'Active licenses', value: stats.activeLicenses, icon: FileText, to: '/super-admin/licensing/institution-licenses' },
    { label: 'Unpaid / partial', value: stats.unpaid, icon: CreditCard, to: '/super-admin/licensing/institution-licenses?payment_status=unpaid' },
    { label: 'Overdue', value: stats.overdue, icon: CreditCard, to: '/super-admin/licensing/institution-licenses' },
    { label: 'Expired', value: stats.expired, icon: FileText, to: '/super-admin/licensing/institution-licenses' },
  ]

  const semesterCards = kpis ? [
    { label: 'Semester licenses', value: kpis.semester_licenses, to: '/super-admin/licensing/semester-licenses' },
    { label: 'Awaiting down payment', value: kpis.awaiting_down_payment, to: '/super-admin/licensing/semester-licenses?status=awaiting_down_payment' },
    { label: 'Awaiting lock', value: kpis.awaiting_lock, to: '/super-admin/licensing/semester-licenses' },
    { label: 'Awaiting reconciliation', value: kpis.awaiting_reconciliation, to: '/super-admin/licensing/semester-licenses' },
    { label: 'Estimated revenue', value: Number(kpis.estimated_revenue).toLocaleString(), to: '/super-admin/licensing/reports' },
    { label: 'Locked revenue', value: Number(kpis.locked_revenue).toLocaleString(), to: '/super-admin/licensing/reports' },
    { label: 'Down payments received', value: Number(kpis.down_payments_received).toLocaleString(), to: '/super-admin/licensing/payments' },
    { label: 'Outstanding balances', value: Number(kpis.outstanding_balances).toLocaleString(), to: '/super-admin/licensing/invoices' },
    { label: 'Pending payment proofs', value: kpis.payments_pending_verification, to: '/super-admin/licensing/payments' },
    { label: 'Unpaid invoices', value: kpis.invoices_unpaid, to: '/super-admin/licensing/invoices' },
  ] : []

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Licenses &amp; Billing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform licensing overview including per-student semester billing, invoices, and payments.
        </p>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading overview…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <Link
                  key={card.label}
                  to={card.to}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#1e3a5f]/30 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{card.label}</p>
                    <Icon className="h-5 w-5 text-[#1e3a5f]" />
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
                </Link>
              )
            })}
          </div>

          {semesterCards.length > 0 && (
            <div>
              <h2 className="mb-3 font-semibold text-slate-900">Per-student semester KPIs</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {semesterCards.map((card) => (
                  <Link
                    key={card.label}
                    to={card.to}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#1e3a5f]/30"
                  >
                    <p className="text-xs text-slate-500">{card.label}</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{card.value}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Quick links</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ['License Plans', '/super-admin/licensing/plans'],
            ['Module Pricing', '/super-admin/licensing/module-pricing'],
            ['Assign License', '/super-admin/licensing/assign'],
            ['Institution Licenses', '/super-admin/licensing/institution-licenses'],
            ['Semester Licenses', '/super-admin/licensing/semester-licenses'],
            ['Invoices', '/super-admin/licensing/invoices'],
            ['Payments', '/super-admin/licensing/payments'],
            ['Reports', '/super-admin/licensing/reports'],
            ['Payments (verify proofs)', '/super-admin/licensing/payments'],
          ].map(([label, to]) => (
            <Link key={to} to={to} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
