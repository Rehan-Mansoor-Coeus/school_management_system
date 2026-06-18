import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useHrI18n } from '../../../hooks/useHrI18n'

const tabs = [
  { path: '/hr', key: 'overview', end: true, permissions: ['hr.view', 'hr.manage'] },
  { path: '/hr/staff', key: 'staff', permissions: ['hr.view', 'hr.manage'] },
  { path: '/hr/categories', key: 'categories', permissions: ['hr.manage'] },
  { path: '/hr/jobs', key: 'jobs', permissions: ['hr.view', 'hr.manage'] },
  { path: '/hr/monthly-payroll', key: 'monthlyPayroll', permissions: ['hr.view', 'hr.manage'] },
  { path: '/hr/allowances', key: 'allowances', permissions: ['hr.manage'] },
  { path: '/hr/deductions', key: 'deductions', permissions: ['hr.manage'] },
  { path: '/hr/advances', key: 'advances', permissions: ['hr.view', 'hr.manage'] },
  { path: '/hr/payslips', key: 'payslips', permissions: ['hr.view', 'hr.manage'] },
  { path: '/hr/approvals', key: 'approvals', permissions: ['hr.manage'] },
  { path: '/hr/finance', key: 'finance', permissions: ['hr.manage'] },
  { path: '/hr/reports', key: 'reports', permissions: ['hr.view', 'hr.manage'] },
  { path: '/hr/letters', key: 'letters', permissions: ['hr.manage'] },
]

export default function HrLayout() {
  const { canAccess } = useAuth()
  const { t } = useHrI18n()

  const visibleTabs = tabs.filter((tab) => canAccess({ permissions: tab.permissions }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('moduleTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('moduleSubtitle')}</p>
      </div>

      {visibleTabs.length > 0 && (
        <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {visibleTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {t(tab.key)}
            </NavLink>
          ))}
        </nav>
      )}

      <Outlet />
    </div>
  )
}
