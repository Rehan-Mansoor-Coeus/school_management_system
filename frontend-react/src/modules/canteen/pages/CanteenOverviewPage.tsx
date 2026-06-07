import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UtensilsCrossed, Wallet, ClipboardList, Users } from 'lucide-react'
import { fetchCanteenDashboard } from '../../../api/canteen'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'

export default function CanteenOverviewPage() {
  const { t } = useCanteenI18n()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchCanteenDashboard().then((res) => setStats(res.data?.data)).catch(() => setStats(null))
  }, [])

  const cards = [
    { label: t('mealsToday'), value: stats?.meals_today ?? '—', icon: UtensilsCrossed },
    { label: t('activeMealPlans'), value: stats?.active_meal_plans ?? '—', icon: ClipboardList },
    { label: t('studentWallets'), value: stats?.student_wallets ?? '—', icon: Wallet },
    { label: t('activeSubscriptions'), value: stats?.active_subscriptions ?? '—', icon: Users },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-slate-500">
                <Icon className="h-4 w-4" />
                <span className="text-sm">{card.label}</span>
              </div>
              <div className="text-3xl font-bold text-[#1e3a5f]">{card.value}</div>
            </div>
          )
        })}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick links</h2>
        <ul className="space-y-2 text-sm">
          <li><Link className="text-[#1e3a5f] hover:underline" to="/canteen/verify">{t('verifyMeal')}</Link></li>
          <li><Link className="text-[#1e3a5f] hover:underline" to="/canteen/my-wallet">{t('myWallet')}</Link></li>
          <li><Link className="text-[#1e3a5f] hover:underline" to="/canteen/reports">{t('reports')}</Link></li>
        </ul>
      </div>
    </div>
  )
}
