import { Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus2,
  FolderOpen,
  Files,
  BookOpen,
  ClipboardCheck,
  Building2,
  Stamp,
  Wallet,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n'
import ColoredModuleTabsNav, { type TabColor } from '../../../components/ui/ColoredModuleTabsNav'

const linkDefs = [
  {
    path: '/admissions',
    labelKey: 'overview',
    end: true,
    icon: LayoutDashboard,
    color: 'navy' as TabColor,
    permissions: [
      'admissions.apply',
      'admissions.view',
      'admissions.manage',
      'admissions.registry.review',
      'admissions.department.review',
      'admissions.registrar.admit',
      'admissions.finance.verify',
      'admissions.courses.register',
      'admissions.hod.approve',
    ],
  },
  { path: '/admissions/apply', labelKey: 'apply', permissions: ['admissions.apply'], icon: FilePlus2, color: 'emerald' as TabColor },
  { path: '/admissions/my-applications', labelKey: 'myApplications', permissions: ['admissions.apply'], icon: FolderOpen, color: 'amber' as TabColor },
  { path: '/admissions/applications', labelKey: 'allApplications', permissions: ['admissions.view', 'admissions.manage', 'admissions.registry.review', 'admissions.department.review', 'admissions.finance.verify', 'admissions.registrar.admit', 'admissions.hod.approve'], icon: Files, color: 'blue' as TabColor },
  { path: '/admissions/courses', labelKey: 'courseRegistration', permissions: ['admissions.courses.register'], icon: BookOpen, color: 'indigo' as TabColor },
  { path: '/admissions/registry', labelKey: 'registryReview', permissions: ['admissions.registry.review'], icon: ClipboardCheck, color: 'teal' as TabColor },
  { path: '/admissions/department', labelKey: 'departmentReview', permissions: ['admissions.department.review'], icon: Building2, color: 'purple' as TabColor },
  { path: '/admissions/registrar', labelKey: 'registrar', permissions: ['admissions.registrar.admit'], icon: Stamp, color: 'rose' as TabColor },
  { path: '/admissions/finance', labelKey: 'finance', permissions: ['admissions.finance.verify'], icon: Wallet, color: 'orange' as TabColor },
  { path: '/admissions/hod-courses', labelKey: 'hodApprovals', permissions: ['admissions.hod.approve'], icon: UserCheck, color: 'cyan' as TabColor },
]

export default function AdmissionsLayout() {
  const { canAccess } = useAuth()
  const { t } = useAdmissionsI18n()

  const tabs = linkDefs
    .filter((link) => canAccess({ permissions: link.permissions }))
    .map((link) => ({
      label: t(link.labelKey),
      path: link.path,
      end: link.end,
      icon: link.icon,
      color: link.color,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('moduleTitle')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('moduleSubtitle')}</p>
      </div>

      <ColoredModuleTabsNav items={tabs} />
      <Outlet />
    </div>
  )
}
