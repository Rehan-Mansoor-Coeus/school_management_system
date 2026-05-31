import AnnouncementsPage from './AnnouncementsPage'
import ComposeAnnouncementPage from './ComposeAnnouncementPage'
import { useLettersI18n } from '../../hooks/useLettersI18n'

export function CreateAnnouncementPage() {
  return <ComposeAnnouncementPage />
}

export function AnnouncementListPage() {
  const { t } = useLettersI18n()
  return <AnnouncementsPage mode="list" title={t('announcementList')} />
}

export function ScheduledAnnouncementsPage() {
  const { t } = useLettersI18n()
  return <AnnouncementsPage mode="scheduled" title={t('scheduledAnnouncements')} />
}
