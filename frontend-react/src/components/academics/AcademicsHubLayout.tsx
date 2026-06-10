import { Outlet } from 'react-router-dom'
import { Building2, Network, BookOpen, Layers, GraduationCap, Award, School, Calendar, GitBranch } from 'lucide-react'
import { useAdmissionsI18n } from '../../hooks/useAdmissionsI18n'
import { useAuth } from '../../context/AuthContext'
import { AcademicInstitutionProvider, useAcademicInstitution } from '../../context/AcademicInstitutionContext'
import { characterCertificatesHomePath } from '../../utils/accessControl'
import ColoredModuleTabsNav from '../ui/ColoredModuleTabsNav'
import FormSelect from '../ui/FormSelect'
import AcademicSetupProgress from './AcademicSetupProgress'

const tabDefs = [
  { label: 'Institutions', path: '/institutions', key: 'institutions', permissions: ['institutions.view'], icon: Building2, color: 'blue' as const },
  { label: 'Academic Units', path: '/academics/units', key: 'academics', permissions: ['academics.units.view', 'academics.view', 'academics.manage'], icon: School, color: 'indigo' as const },
  { label: 'Departments', path: '/departments', key: 'departments', permissions: ['academics.departments.view', 'academics.view', 'academics.manage'], icon: Network, color: 'violet' as const },
  { label: 'Programs', path: '/academics/programmes', key: 'academics', permissions: ['academics.programs.view', 'academics.view', 'academics.manage'], icon: BookOpen, color: 'emerald' as const },
  { label: 'Semesters', path: '/academics/semesters', key: 'academics', permissions: ['academics.semesters.view', 'academics.view', 'academics.manage'], icon: Calendar, color: 'cyan' as const },
  { label: 'Subjects', path: '/academics/subjects', key: 'academics', permissions: ['academics.subjects.view', 'academics.view', 'academics.manage'], icon: Layers, color: 'teal' as const },
  { label: 'Organization', path: '/academics/organization', key: 'academics', permissions: ['academics.organization.manage', 'academics.manage'], icon: GitBranch, color: 'amber' as const },
  { labelKey: 'moduleTitle', path: '/admissions', key: 'admissions', permissions: ['admissions.view', 'admissions.apply', 'admissions.manage'], icon: GraduationCap, color: 'rose' as const },
  { label: 'Character Certificates', path: '/character-certificates', key: 'character_certificates', permissions: ['character_certificates.view', 'character_certificates.manage'], icon: Award, color: 'orange' as const },
]

function AcademicsHubContent() {
  const { canAccess, enabledModules } = useAuth()
  const { t: tAdmissions } = useAdmissionsI18n()
  const { requiresSelection, institutionId, setInstitutionId, institutions, loadingInstitutions } = useAcademicInstitution()
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
        <p className="mt-1 text-sm text-slate-500">Institutions, academic hierarchy, admissions, and related modules.</p>
      </div>

      <AcademicSetupProgress />

      {requiresSelection && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Working institution</label>
          <FormSelect
            value={institutionId ? String(institutionId) : ''}
            onChange={(value) => setInstitutionId(value ? Number(value) : null)}
            options={institutions.map((inst) => ({
              value: String(inst.id),
              label: inst.code ? `${inst.name} (${inst.code})` : inst.name,
            }))}
            placeholder={loadingInstitutions ? 'Loading institutions…' : 'Select institution'}
          />
          <p className="mt-2 text-xs text-slate-500">
            Academic units, departments, programs, and related data are scoped to the selected institution.
          </p>
        </div>
      )}

      <ColoredModuleTabsNav items={tabs} />
      <Outlet />
    </div>
  )
}

export default function AcademicsHubLayout() {
  return (
    <AcademicInstitutionProvider>
      <AcademicsHubContent />
    </AcademicInstitutionProvider>
  )
}
