import { Outlet } from 'react-router-dom'
import { CreditCard, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ColoredModuleTabsNav, { type TabColor } from '../ui/ColoredModuleTabsNav'

const tabDefs = [
  {
    label: 'General Settings',
    path: '/system/general-settings',
    end: true,
    permissions: ['manage_modules', 'modules.view'],
    roles: ['super-admin', 'system-super-admin'],
    icon: Settings,
    color: 'navy' as TabColor,
  },
  {
    label: 'Platform Settings',
    path: '/system/institution-settings',
    end: true,
    permissions: ['institutions.edit', 'institutions.settings', 'institutions.view'],
    icon: Settings,
    color: 'amber' as TabColor,
  },
  {
    label: 'Subscription & Billing',
    path: '/system/billing',
    end: true,
    permissions: ['institutions.edit', 'institutions.settings', 'institutions.view'],
    icon: CreditCard,
    color: 'teal' as TabColor,
  },
]

export default function SystemLayout() {
  const { canAccess, hasAnyRole, isPlatformContext, isPlatformSuperAdmin } = useAuth()
  const tabs = tabDefs
    .filter((tab) => {
      if (tab.path === '/system/general-settings') {
        return isPlatformSuperAdmin || hasAnyRole(['super-admin', 'system-super-admin'])
      }
      if (tab.path === '/system/institution-settings' || tab.path === '/system/billing') {
        if (isPlatformContext && isPlatformSuperAdmin) return false
        return canAccess({ permissions: tab.permissions })
      }
      return canAccess({ permissions: tab.permissions })
    })
    .map((tab) => ({
      label: tab.label,
      path: tab.path,
      end: tab.end,
      icon: tab.icon,
      color: tab.color,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System</h1>
        <p className="mt-1 text-sm text-slate-500">Platform configuration and global settings.</p>
      </div>

      <ColoredModuleTabsNav items={tabs} />
      <Outlet />
    </div>
  )
}
