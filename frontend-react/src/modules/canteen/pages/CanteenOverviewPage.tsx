import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UtensilsCrossed, Wallet, ClipboardList, Users } from 'lucide-react'
import { fetchCanteenDashboard } from '../../../api/canteen'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'
import DashboardStatCard from '../../../components/ui/DashboardStatCard'

export default function CanteenOverviewPage() {
  const { t } = useCanteenI18n()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchCanteenDashboard().then((res) => setStats(res.data?.data)).catch(() => setStats(null))
  }, [])

  const cards = [
    { label: t('mealsToday'), value: stats?.meals_today ?? '—', icon: UtensilsCrossed, to: '/canteen/attendance' },
    { label: t('activeMealPlans'), value: stats?.active_meal_plans ?? '—', icon: ClipboardList, to: '/canteen/meals' },
    { label: t('studentWallets'), value: stats?.student_wallets ?? '—', icon: Wallet, to: '/canteen/wallets' },
    { label: t('activeSubscriptions'), value: stats?.active_subscriptions ?? '—', icon: Users, to: '/canteen/feeding-plans' },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <DashboardStatCard
            key={card.label}
            label={card.label}
            value={card.value}
            to={card.to}
            icon={card.icon}
          />
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick links</h2>
        <ul className="space-y-2 text-sm">
          <li><Link className="text-[#1e3a5f] hover:underline" to="/canteen/pos">{t('pos')}</Link></li>
          <li><Link className="text-[#1e3a5f] hover:underline" to="/canteen/sales">{t('salesRecords')}</Link></li>
          <li><Link className="text-[#1e3a5f] hover:underline" to="/canteen/verify">{t('verifyMeal')}</Link></li>
          <li><Link className="text-[#1e3a5f] hover:underline" to="/canteen/my-wallet">{t('myWallet')}</Link></li>
          <li><Link className="text-[#1e3a5f] hover:underline" to="/canteen/reports">{t('reports')}</Link></li>
        </ul>
      </div>
    </div>
  )
}
