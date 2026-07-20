import { Outlet } from 'react-router-dom'
import { FileStack, FileText, LayoutDashboard, PlusCircle } from 'lucide-react'
import ColoredModuleTabsNav, { type TabColor } from '../../../components/ui/ColoredModuleTabsNav'

const tabs = [
  { label: 'Dashboard', path: '/contracts', icon: LayoutDashboard, end: true, color: 'navy' as TabColor },
  { label: 'All Contracts', path: '/contracts/list', icon: FileStack, color: 'blue' as TabColor },
  { label: 'Templates', path: '/contracts/templates', icon: FileText, color: 'amber' as TabColor },
  { label: 'Generate', path: '/contracts/generate', icon: PlusCircle, color: 'emerald' as TabColor },
]

export default function ContractsLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Contract Management</h1>
        <p className="text-sm text-slate-500">Digital contract generation, signing, approval, and storage.</p>
      </div>

      <ColoredModuleTabsNav items={tabs} />
      <Outlet />
    </div>
  )
}
