import { Outlet, useLocation } from 'react-router-dom'
import { Megaphone, Mail } from 'lucide-react'
import { useLettersI18n } from '../../hooks/useLettersI18n'
import { useAuth } from '../../context/AuthContext'
import ModuleTabsNav from './ModuleTabsNav'
import ColoredModuleTabsNav from '../ui/ColoredModuleTabsNav'
import { announcementTabItems, letterTabItems, shouldHideLetterTabs } from './lettersMenuConfig'

export default function LettersModuleLayout() {
  const { t } = useLettersI18n()
  const { hasPermission } = useAuth()
  const location = useLocation()

  const isAnnouncements = location.pathname.startsWith('/letters/announcements') || location.pathname === '/letters/message-logs' || location.pathname === '/letters/whatsapp-settings'
  const canViewLetters = hasPermission('view_letters_menu') || hasPermission('create_letters')
  const canViewAnnouncements = hasPermission('view_announcements') || hasPermission('create_announcements')

  const showLetterTabs = canViewLetters && !isAnnouncements && !shouldHideLetterTabs(location.pathname)
  const showAnnouncementTabs = canViewAnnouncements && isAnnouncements

  const sectionTabs = [
    ...(canViewAnnouncements
      ? [{ label: t('announcementsSection'), path: '/letters/announcements', icon: Megaphone, color: 'blue' as const, end: false }]
      : []),
    ...(canViewLetters
      ? [{ label: t('lettersSection'), path: '/letters/listing', icon: Mail, color: 'indigo' as const, end: false }]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isAnnouncements ? t('announcementsModuleTitle') : t('lettersSection')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isAnnouncements ? t('announcementsModuleSubtitle') : t('lettersModuleSubtitle')}
        </p>
      </div>

      {(canViewLetters || canViewAnnouncements) && sectionTabs.length > 1 && (
        <ColoredModuleTabsNav
          items={sectionTabs.map((tab) => ({
            ...tab,
            end: tab.path === '/letters/announcements' ? isAnnouncements : !isAnnouncements,
          }))}
        />
      )}

      {showAnnouncementTabs && <ModuleTabsNav items={announcementTabItems} t={t} />}
      {showLetterTabs && <ModuleTabsNav items={letterTabItems} t={t} />}

      <Outlet />
    </div>
  )
}
