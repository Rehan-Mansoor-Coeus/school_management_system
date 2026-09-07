import { Link } from 'react-router-dom'
import { BookOpen, Building2, CircleHelp, ExternalLink } from 'lucide-react'
import { useTimesheetI18n } from '../../hooks/useTimesheetI18n'
import { helpT } from '../../i18n/help'

const STEPS: Array<{
  id: string
  titleKey: string
  bodyKey: string
  tipKey: string
  to: string
  image?: string
  imageAlt: string
}> = [
  { id: 'sign-in', titleKey: 'step1Title', bodyKey: 'step1Body', tipKey: 'step1Tip', to: '/admin', image: '/help/01-signin.png', imageAlt: 'Sign in' },
  { id: 'dashboard', titleKey: 'step2Title', bodyKey: 'step2Body', tipKey: 'step2Tip', to: '/dashboard', image: '/help/02-dashboard.png', imageAlt: 'Dashboard' },
  { id: 'profile', titleKey: 'step3Title', bodyKey: 'step3Body', tipKey: 'step3Tip', to: '/institutions', image: '/help/03-school-profile.png', imageAlt: 'School profile' },
  { id: 'units', titleKey: 'step4Title', bodyKey: 'step4Body', tipKey: 'step4Tip', to: '/academics/units', imageAlt: 'Units' },
  { id: 'programmes', titleKey: 'step5Title', bodyKey: 'step5Body', tipKey: 'step5Tip', to: '/academics/programmes', image: '/help/04-programmes.png', imageAlt: 'Programmes' },
  { id: 'subjects', titleKey: 'step6Title', bodyKey: 'step6Body', tipKey: 'step6Tip', to: '/academics/organization', imageAlt: 'Organization' },
  { id: 'users', titleKey: 'step7Title', bodyKey: 'step7Body', tipKey: 'step7Tip', to: '/users', image: '/help/05-users.png', imageAlt: 'Users' },
  { id: 'modules', titleKey: 'step8Title', bodyKey: 'step8Body', tipKey: 'step8Tip', to: '/modules', imageAlt: 'Modules' },
  { id: 'admissions', titleKey: 'step9Title', bodyKey: 'step9Body', tipKey: 'step9Tip', to: '/admissions', image: '/help/06-admissions.png', imageAlt: 'Admissions' },
  { id: 'operations', titleKey: 'step10Title', bodyKey: 'step10Body', tipKey: 'step10Tip', to: '/fees', imageAlt: 'Fees' },
]

export default function SchoolAdminHelpPage() {
  const { locale } = useTimesheetI18n()
  const t = (key: string) => helpT(key, locale)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-[#1e3a5f] to-[#2d4a73] p-6 text-white shadow-sm">
        <p className="flex items-center gap-2 text-sm text-blue-100">
          <CircleHelp className="h-4 w-4" /> {t('menu')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{t('title')}</h1>
        <p className="mt-2 max-w-3xl text-sm text-blue-100">{t('subtitle')}</p>
      </div>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-[#1e3a5f]">
          <Building2 className="h-5 w-5" /> {t('exampleSchool')}
        </h2>
        <p className="mt-2 text-lg font-semibold text-slate-900">{t('exampleSchoolName')}</p>
        <p className="text-sm text-slate-600">{t('exampleSchoolMeta')}</p>
        <p className="mt-2 text-sm text-slate-700">{t('exampleAdmin')}</p>
        <p className="text-sm text-slate-700">{t('exampleContact')}</p>
      </section>

      <nav className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <BookOpen className="h-5 w-5 text-[#1e3a5f]" /> {t('contents')}
        </h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {STEPS.map((step) => (
            <li key={step.id}>
              <a href={`#${step.id}`} className="text-sm font-medium text-[#1e3a5f] hover:underline">
                {t(step.titleKey)}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {STEPS.map((step) => (
        <article key={step.id} id={step.id} className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{t(step.titleKey)}</h2>
            <Link
              to={step.to}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2d4a73]"
            >
              {t('openScreen')} <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{t(step.bodyKey)}</p>
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <span className="font-semibold text-[#1e3a5f]">{t('tip')}: </span>
            {t(step.tipKey)}
          </p>
          {step.image && (
            <figure className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <img src={step.image} alt={step.imageAlt} className="w-full object-cover" />
            </figure>
          )}
        </article>
      ))}
    </div>
  )
}
