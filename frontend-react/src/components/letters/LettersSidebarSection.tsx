import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Mail, Megaphone } from 'lucide-react'
import { fetchLetterCounts } from '../../api/letters'
import { useLettersI18n } from '../../hooks/useLettersI18n'
import { useAuth } from '../../context/AuthContext'
import { announcementMenuItems, letterMenuItems, type LettersMenuItem } from './lettersMenuConfig'

type Counts = Record<string, number>

function nestedLinkClass(isActive: boolean) {
  return [
    'flex items-center justify-between gap-2 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium transition',
    isActive ? 'bg-[#2a4a73] text-[#eab308]' : 'text-white hover:bg-[#2a4a73]/70',
  ].join(' ')
}

function countBadgeClass(tone: 'teal' | 'pink' | 'purple') {
  const tones = {
    teal: 'bg-teal-500/20 text-teal-200',
    pink: 'bg-rose-500/20 text-rose-200',
    purple: 'bg-purple-500/20 text-purple-200',
  }
  return `shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${tones[tone]}`
}

function MenuLink({
  item,
  counts,
  t,
}: {
  item: LettersMenuItem
  counts: Counts
  t: (key: string) => string
}) {
  const Icon = item.icon

  return (
    <NavLink to={item.path} className={({ isActive }) => nestedLinkClass(isActive)}>
      {({ isActive }) => (
        <>
          <span className="flex min-w-0 items-center gap-2">
            <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#eab308]' : 'text-blue-200'}`} aria-hidden="true" />
            <span className="truncate">{t(item.labelKey)}</span>
          </span>
          {item.countKey && typeof counts[item.countKey] === 'number' && counts[item.countKey] > 0 ? (
            <span
              className={countBadgeClass(
                item.countKey === 'rejected' ? 'pink' : item.countKey === 'all' ? 'teal' : 'purple'
              )}
            >
              {counts[item.countKey]}
            </span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}

export default function LettersSidebarSection() {
  const { t } = useLettersI18n()
  const { hasPermission } = useAuth()
  const location = useLocation()
  const [counts, setCounts] = useState<Counts>({})
  const [announcementsOpen, setAnnouncementsOpen] = useState(false)
  const [lettersOpen, setLettersOpen] = useState(false)

  const canViewLetters = hasPermission('view_letters_menu') || hasPermission('create_letters')
  const canViewAnnouncements = hasPermission('view_announcements') || hasPermission('create_announcements')

  useEffect(() => {
    if (location.pathname.startsWith('/letters/announcements')) setAnnouncementsOpen(true)
    if (location.pathname.startsWith('/letters') && !location.pathname.startsWith('/letters/announcements')) {
      setLettersOpen(true)
    }
  }, [location.pathname])

  async function loadCounts() {
    if (!canViewLetters) return
    try {
      const res = await fetchLetterCounts()
      const data = res.data || {}
      setCounts({
        ...data,
        pending:
          (data.awaiting_editing || 0) +
          (data.awaiting_approval || 0) +
          (data.awaiting_signature || 0) +
          (data.ready_to_send || 0),
      })
    } catch {
      setCounts({})
    }
  }

  useEffect(() => {
    loadCounts()
    const handler = () => loadCounts()
    window.addEventListener('letters:refresh-counts', handler)
    return () => window.removeEventListener('letters:refresh-counts', handler)
  }, [canViewLetters])

  if (!canViewLetters && !canViewAnnouncements) return null

  return (
    <>
      <div className="pt-4 text-xs font-semibold uppercase tracking-wider text-blue-200">
        {t('moduleTitle')}
      </div>

      {canViewAnnouncements && (
        <>
          <button
            type="button"
            onClick={() => setAnnouncementsOpen(v => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-[#2a4a73] px-4 py-3 text-left text-sm font-semibold text-white"
          >
            <span className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
              {t('announcementsSection')}
            </span>
            <span className={`transition ${announcementsOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {announcementsOpen &&
            announcementMenuItems.map(item => (
              <MenuLink key={item.path} item={item} counts={counts} t={t} />
            ))}
        </>
      )}

      {canViewLetters && (
        <>
          <button
            type="button"
            onClick={() => setLettersOpen(v => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-[#2a4a73] px-4 py-3 text-left text-sm font-semibold text-white"
          >
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#eab308]" aria-hidden="true" />
              {t('lettersSection')}
            </span>
            <span className={`transition ${lettersOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {lettersOpen && letterMenuItems.map(item => (
            <MenuLink key={item.path} item={item} counts={counts} t={t} />
          ))}
        </>
      )}
    </>
  )
}
