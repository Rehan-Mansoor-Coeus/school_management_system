import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteAnnouncementTemplate, fetchAnnouncementTemplates } from '../../api/letters'
import {
  FieldLabel,
  LettersCard,
  LettersPageHeader,
  TextInput,
} from '../../components/letters/LettersUi'
import SearchableSelect from '../../components/ui/SearchableSelect'
import { useLettersI18n } from '../../hooks/useLettersI18n'
import { useToast } from '../../components/ui/ToastProvider'

export default function AnnouncementTemplatesPage() {
  const { t } = useLettersI18n()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('all')

  async function load() {
    const res = await fetchAnnouncementTemplates()
    setTemplates(res.data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const templateOptions = useMemo(
    () => [
      { value: 'all', label: 'All templates' },
      ...templates.map(item => ({
        value: String(item.id),
        label: `${item.name}${item.subject ? ` — ${item.subject}` : ''}`,
      })),
    ],
    [templates],
  )

  const visibleTemplates = useMemo(() => {
    if (selectedId === 'all') return templates
    return templates.filter(item => String(item.id) === selectedId)
  }, [templates, selectedId])

  return (
    <div className="space-y-6">
      <LettersPageHeader
        title={t('announcementTemplates')}
        action={
          <Link to="/letters/announcements/create" className="inline-flex rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a]">
            + {t('addTemplate')}
          </Link>
        }
      />

      <LettersCard>
        <div className="mb-4 max-w-md">
          <FieldLabel>{t('search')}</FieldLabel>
          <SearchableSelect
            value={selectedId}
            onChange={setSelectedId}
            options={templateOptions}
            placeholder="Search or select template..."
          />
        </div>

        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-3 pr-4">{t('templateName')}</th>
              <th className="py-3 pr-4">{t('subject')}</th>
              <th className="py-3 pr-4">{t('category')}</th>
              <th className="py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleTemplates.map(item => (
              <tr key={item.id} className="border-b">
                <td className="py-3 pr-4 font-semibold">{item.name}</td>
                <td className="py-3 pr-4">{item.subject || '—'}</td>
                <td className="py-3 pr-4 capitalize">{item.category || '—'}</td>
                <td className="py-3">
                  <button
                    className="mr-3 text-blue-600"
                    onClick={() => navigate(`/letters/announcements/create?template=${item.id}`)}
                  >
                    {t('edit')}
                  </button>
                  <button
                    className="text-red-600"
                    onClick={async () => {
                      if (!window.confirm(`Delete template "${item.name}"?`)) return
                      try {
                        await deleteAnnouncementTemplate(item.id)
                        pushToast('Template deleted.')
                        await load()
                      } catch (error: any) {
                        pushToast(error?.response?.data?.message || 'Unable to delete template', 'error')
                      }
                    }}
                  >
                    {t('delete')}
                  </button>
                </td>
              </tr>
            ))}
            {!visibleTemplates.length && (
              <tr><td colSpan={4} className="py-8 text-center text-slate-500">{t('noRecords')}</td></tr>
            )}
          </tbody>
        </table>
      </LettersCard>
    </div>
  )
}
