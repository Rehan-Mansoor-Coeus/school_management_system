import { Outlet } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useHrI18n } from '../../../hooks/useHrI18n'
import ColoredModuleTabsNav from '../../../components/ui/ColoredModuleTabsNav'

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

  const visibleTabs = tabs
    .filter((tab) => canAccess({ permissions: tab.permissions }))
    .map((tab) => ({
      label: t(tab.key),
      path: tab.path,
      end: tab.end,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('moduleTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('moduleSubtitle')}</p>
      </div>

      <ColoredModuleTabsNav items={visibleTabs} />
      <Outlet />
    </div>
  )
}
