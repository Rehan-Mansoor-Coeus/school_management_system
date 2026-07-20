import { Outlet } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import ColoredModuleTabsNav from '../../../components/ui/ColoredModuleTabsNav'

const tabs = [
  { label: 'Student Report', path: '/reports/students', icon: GraduationCap, color: 'navy' as const },
]

export default function ReportsLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">Institutional reports and student records.</p>
      </div>

      <ColoredModuleTabsNav items={tabs} />
      <Outlet />
    </div>
  )
}
