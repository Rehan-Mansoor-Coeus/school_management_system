import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BedDouble, Building2, ClipboardList, Users } from 'lucide-react'
import { fetchHostelDashboard } from '../../../api/hostel'
import { useHostelI18n } from '../../../hooks/useHostelI18n'
import DashboardStatCard from '../../../components/ui/DashboardStatCard'

export default function HostelOverviewPage() {
  const { t } = useHostelI18n()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchHostelDashboard().then((res) => setStats(res.data?.data)).catch(() => setStats(null))
  }, [])

  const cards = [
    { label: t('hostelsCount'), value: stats?.hostels_count ?? '—', icon: Building2, to: '/hostel/hostels' },
    { label: t('availableBeds'), value: stats?.available_beds ?? '—', icon: BedDouble, to: '/hostel/rooms' },
    { label: t('pendingRegistrations'), value: stats?.pending_registrations ?? '—', icon: ClipboardList, to: '/hostel/registrations' },
    { label: t('activeAllocations'), value: stats?.active_allocations ?? '—', icon: Users, to: '/hostel/allocations' },
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
        <h2 className="mb-2 text-lg font-semibold text-slate-900">{t('occupancyRate')}</h2>
        <p className="text-4xl font-bold text-[#1e3a5f]">{stats?.occupancy_rate != null ? `${stats.occupancy_rate}%` : '—'}</p>
        <p className="mt-2 text-sm text-slate-500">
          {stats?.occupied_beds ?? 0} / {stats?.total_capacity ?? 0} {t('occupiedBeds').toLowerCase()}
        </p>
        <ul className="mt-6 space-y-2 text-sm">
          <li><Link className="text-[#1e3a5f] hover:underline" to="/hostel/registrations">{t('registrations')}</Link></li>
          <li><Link className="text-[#1e3a5f] hover:underline" to="/hostel/allocations">{t('allocations')}</Link></li>
          <li><Link className="text-[#1e3a5f] hover:underline" to="/hostel/my">{t('myHostel')}</Link></li>
        </ul>
      </div>
    </div>
  )
}
