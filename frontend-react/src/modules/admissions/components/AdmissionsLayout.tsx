import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';

const linkDefs = [
  {
    path: '/admissions',
    labelKey: 'overview',
    end: true,
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
  { path: '/admissions/apply', labelKey: 'apply', permissions: ['admissions.apply'] },
  { path: '/admissions/my-applications', labelKey: 'myApplications', permissions: ['admissions.apply'] },
  { path: '/admissions/applications', labelKey: 'allApplications', permissions: ['admissions.view', 'admissions.manage'] },
  { path: '/admissions/courses', labelKey: 'courseRegistration', permissions: ['admissions.courses.register'] },
  { path: '/admissions/registry', labelKey: 'registryReview', permissions: ['admissions.registry.review'] },
  { path: '/admissions/department', labelKey: 'departmentReview', permissions: ['admissions.department.review'] },
  { path: '/admissions/registrar', labelKey: 'registrar', permissions: ['admissions.registrar.admit'] },
  { path: '/admissions/finance', labelKey: 'finance', permissions: ['admissions.finance.verify'] },
  { path: '/admissions/hod-courses', labelKey: 'hodApprovals', permissions: ['admissions.hod.approve'] },
];

export default function AdmissionsLayout() {
  const { canAccess } = useAuth();
  const { t } = useAdmissionsI18n();

  const visibleLinks = linkDefs.filter((link) => canAccess({ permissions: link.permissions }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('moduleTitle')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('moduleSubtitle')}</p>
      </div>

      {visibleLinks.length > 0 && (
        <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {visibleLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {t(link.labelKey)}
            </NavLink>
          ))}
        </nav>
      )}

      <Outlet />
    </div>
  );
}
