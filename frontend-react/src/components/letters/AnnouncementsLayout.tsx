import { Outlet, useLocation } from 'react-router-dom'
import { useLettersI18n } from '../../hooks/useLettersI18n'
import { useAuth } from '../../context/AuthContext'
import ModuleTabsNav from './ModuleTabsNav'
import { announcementTabItems, shouldHideAnnouncementTabs } from './lettersMenuConfig'

export default function AnnouncementsLayout() {
  const { t } = useLettersI18n()
  const { hasPermission } = useAuth()
  const location = useLocation()

  const canViewAnnouncements = hasPermission('view_announcements') || hasPermission('create_announcements')
  const showTabs = canViewAnnouncements && !shouldHideAnnouncementTabs(location.pathname)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('announcementsModuleTitle')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('announcementsModuleSubtitle')}</p>
      </div>

      {showTabs && <ModuleTabsNav items={announcementTabItems} t={t} />}

      <Outlet />
    </div>
  )
}
