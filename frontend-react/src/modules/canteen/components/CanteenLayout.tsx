import { Outlet } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useCanteenI18n } from '../../../hooks/useCanteenI18n'
import ColoredModuleTabsNav from '../../../components/ui/ColoredModuleTabsNav'

const linkDefs = [
  { path: '/canteen', labelKey: 'overview', end: true, permissions: ['canteen.view', 'canteen.manage', 'canteen.verify', 'canteen.reports'] },
  { path: '/canteen/meals', labelKey: 'mealPlans', permissions: ['canteen.manage'] },
  { path: '/canteen/feeding-plans', labelKey: 'feedingPlans', permissions: ['canteen.manage'] },
  { path: '/canteen/wallets', labelKey: 'wallets', permissions: ['canteen.manage'] },
  { path: '/canteen/my-wallet', labelKey: 'myWallet', permissions: ['canteen.view'] },
  { path: '/canteen/pos', labelKey: 'pos', permissions: ['canteen.verify', 'canteen.manage'] },
  { path: '/canteen/sales', labelKey: 'salesRecords', permissions: ['canteen.view', 'canteen.manage', 'canteen.reports'] },
  { path: '/canteen/verify', labelKey: 'verifyMeal', permissions: ['canteen.verify', 'canteen.manage'] },
  { path: '/canteen/attendance', labelKey: 'attendance', permissions: ['canteen.view', 'canteen.manage', 'canteen.reports'] },
  { path: '/canteen/reports', labelKey: 'reports', permissions: ['canteen.reports', 'canteen.manage'] },
]

export default function CanteenLayout() {
  const { canAccess } = useAuth()
  const { t } = useCanteenI18n()

  const tabs = linkDefs
    .filter((link) => canAccess({ permissions: link.permissions }))
    .map((link) => ({
      label: t(link.labelKey),
      path: link.path,
      end: link.end,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('moduleTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('moduleSubtitle')}</p>
      </div>

      <ColoredModuleTabsNav items={tabs} />
      <Outlet />
    </div>
  )
}
