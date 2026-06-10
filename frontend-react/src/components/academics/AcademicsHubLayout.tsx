import { Outlet } from 'react-router-dom'
import { Building2, Network, BookOpen, Layers, GraduationCap, Award } from 'lucide-react'
import { useAdmissionsI18n } from '../../hooks/useAdmissionsI18n'
import { useAuth } from '../../context/AuthContext'
import { characterCertificatesHomePath } from '../../utils/accessControl'
import ColoredModuleTabsNav from '../ui/ColoredModuleTabsNav'

const tabDefs = [
  { label: 'Institutions', path: '/institutions', key: 'institutions', permissions: ['institutions.view'], icon: Building2, color: 'blue' as const },
  { label: 'Departments', path: '/departments', key: 'departments', permissions: ['academics.view', 'academics.manage'], icon: Network, color: 'violet' as const },
  { label: 'Programmes', path: '/academics/programmes', key: 'academics', permissions: ['academics.view', 'academics.manage'], icon: BookOpen, color: 'emerald' as const },
  { label: 'Subjects', path: '/academics/subjects', key: 'academics', permissions: ['academics.view', 'academics.manage'], icon: Layers, color: 'teal' as const },
  { labelKey: 'moduleTitle', path: '/admissions', key: 'admissions', permissions: ['admissions.view', 'admissions.apply', 'admissions.manage'], icon: GraduationCap, color: 'indigo' as const },
  { label: 'Character Certificates', path: '/character-certificates', key: 'character_certificates', permissions: ['character_certificates.view', 'character_certificates.manage'], icon: Award, color: 'amber' as const },
]

export default function AcademicsHubLayout() {
  const { canAccess, enabledModules } = useAuth()
  const { t: tAdmissions } = useAdmissionsI18n()
  const safeModules = Array.isArray(enabledModules) ? enabledModules : []

  const tabs = tabDefs
    .filter((tab) => safeModules.includes(tab.key))
    .filter((tab) => canAccess({ permissions: tab.permissions }))
    .map((tab) => ({
      label: tab.labelKey ? tAdmissions(tab.labelKey) : tab.label!,
      path: tab.key === 'character_certificates' ? characterCertificatesHomePath(canAccess) : tab.path,
      end: tab.path === '/admissions' || tab.path === '/institutions',
      icon: tab.icon,
      color: tab.color,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Academics</h1>
        <p className="mt-1 text-sm text-slate-500">Institutions, programmes, admissions, and related modules.</p>
      </div>

      <ColoredModuleTabsNav items={tabs} />
      <Outlet />
    </div>
  )
}
