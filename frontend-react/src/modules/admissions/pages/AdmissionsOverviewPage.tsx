import { Link } from 'react-router-dom';
import { GraduationCap, ClipboardList, Building2, Wallet, UserCheck, BookOpen } from 'lucide-react';
import { useAdmissionsI18n } from '../../../hooks/useAdmissionsI18n';
import { useAuth } from '../../../context/AuthContext';
import StudentAdmissionsStats from '../components/StudentAdmissionsStats';

export default function AdmissionsOverviewPage() {
  const { t } = useAdmissionsI18n();
  const { canAccess, hasAnyRole } = useAuth();
  const canViewAllApplications = canAccess({ permissions: ['admissions.view', 'admissions.manage'] });
  const isStudent = hasAnyRole(['student']) || canAccess({ permissions: ['admissions.apply'] });

  const steps = [
    { n: 1, titleKey: 'step1Title', descKey: 'step1Desc', icon: GraduationCap },
    { n: 3, titleKey: 'step3Title', descKey: 'step3Desc', icon: ClipboardList },
    { n: 4, titleKey: 'step4Title', descKey: 'step4Desc', icon: Wallet },
    { n: 5, titleKey: 'step5Title', descKey: 'step5Desc', icon: UserCheck },
    { n: 6, titleKey: 'step6Title', descKey: 'step6Desc', icon: Building2 },
    { n: 7, titleKey: 'step7Title', descKey: 'step7Desc', icon: UserCheck },
    { n: 8, titleKey: 'step8Title', descKey: 'step8Desc', icon: ClipboardList },
    { n: 9, titleKey: 'step9Title', descKey: 'step9Desc', icon: ClipboardList },
    { n: 10, titleKey: 'step10Title', descKey: 'step10Desc', icon: UserCheck },
    { n: 11, titleKey: 'step11Title', descKey: 'step11Desc', icon: Wallet },
    { n: 12, titleKey: 'step12Title', descKey: 'step12Desc', icon: Wallet },
    { n: 13, titleKey: 'step13Title', descKey: 'step13Desc', icon: GraduationCap },
    { n: 14, titleKey: 'step14Title', descKey: 'step14Desc', icon: BookOpen },
    { n: 15, titleKey: 'step15Title', descKey: 'step15Desc', icon: Building2 },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {isStudent && (
        <div className="lg:col-span-3">
          <StudentAdmissionsStats />
        </div>
      )}

      <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('workflowTitle')}</h2>
        <ol className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.n} className="flex gap-3 items-start">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-bold text-white">
                  {step.n}
                </span>
                <div>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <Icon className="h-4 w-4 text-[#1e3a5f]" />
                    {t(step.titleKey)}
                  </div>
                  <p className="text-sm text-slate-500">{t(step.descKey)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-2">{t('quickLinks')}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-[#1e3a5f] hover:underline" to="/admissions/apply">{t('submitApplication')}</Link></li>
            <li><Link className="text-[#1e3a5f] hover:underline" to="/admissions/my-applications">{t('trackApplication')}</Link></li>
            {canViewAllApplications && (
              <li><Link className="text-[#1e3a5f] hover:underline" to="/admissions/applications">{t('allApplications')}</Link></li>
            )}
            <li><Link className="text-[#1e3a5f] hover:underline" to="/users/students">{t('manageStudentAccounts')}</Link></li>
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>{t('testAccountsTitle')}</strong> {t('testAccountsHint')}
        </div>
      </div>
    </div>
  );
}
