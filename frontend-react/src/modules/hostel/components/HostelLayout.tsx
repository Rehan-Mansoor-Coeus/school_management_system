import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useHostelI18n } from '../../../hooks/useHostelI18n'

const linkDefs = [
  { path: '/hostel', labelKey: 'overview', end: true, permissions: ['hostel.view', 'hostel.manage', 'hostel.allocate', 'hostel.payments', 'hostel.maintenance', 'hostel.clearance'] },
  { path: '/hostel/hostels', labelKey: 'hostels', permissions: ['hostel.manage'] },
  { path: '/hostel/rooms', labelKey: 'rooms', permissions: ['hostel.manage', 'hostel.allocate'] },
  { path: '/hostel/registrations', labelKey: 'registrations', permissions: ['hostel.manage', 'hostel.allocate'] },
  { path: '/hostel/allocations', labelKey: 'allocations', permissions: ['hostel.manage', 'hostel.allocate'] },
  { path: '/hostel/payments', labelKey: 'payments', permissions: ['hostel.manage', 'hostel.payments'] },
  { path: '/hostel/clearance', labelKey: 'clearance', permissions: ['hostel.manage', 'hostel.clearance'] },
  { path: '/hostel/maintenance', labelKey: 'maintenance', permissions: ['hostel.view', 'hostel.manage', 'hostel.maintenance'] },
  { path: '/hostel/my', labelKey: 'myHostel', permissions: ['hostel.view'] },
]

export default function HostelLayout() {
  const { canAccess } = useAuth()
  const { t } = useHostelI18n()

  const visibleLinks = linkDefs.filter((link) => canAccess({ permissions: link.permissions }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('moduleTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('moduleSubtitle')}</p>
      </div>

      {visibleLinks.length > 0 && (
        <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {t(link.labelKey)}
            </NavLink>
          ))}
        </nav>
      )}

      <Outlet />
    </div>
  )
}
