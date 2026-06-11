import { Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ColoredModuleTabsNav from '../ui/ColoredModuleTabsNav'
import { libraryMenuItems } from './libraryMenuConfig'

export default function LibraryLayout() {
  const { hasPermission } = useAuth()
  const tabs = libraryMenuItems
    .filter((item) => item.perms.some((p) => hasPermission(p)))
    .map((item) => ({
      label: item.label,
      path: item.path,
      end: item.path === '/library',
      icon: item.icon,
      color: item.color,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Library</h1>
        <p className="mt-1 text-sm text-slate-500">Manage books, borrowing, and library settings.</p>
      </div>

      <ColoredModuleTabsNav items={tabs} />
      <Outlet />
    </div>
  )
}
