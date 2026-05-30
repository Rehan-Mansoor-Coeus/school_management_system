import { useEffect, useMemo, useState } from 'react'
import { createAnnouncement, deleteAnnouncement, fetchAnnouncements, previewAnnouncement, sendAnnouncement } from '../../api/letters'
import RecipientSelect, { type RecipientOption } from '../../components/letters/RecipientSelect'
import SimpleRichTextEditor from '../../components/letters/SimpleRichTextEditor'
import {
  FieldLabel, LettersCard, LettersPageHeader, PrimaryButton, SecondaryButton, StatusBadge, TextInput,
} from '../../components/letters/LettersUi'
import { useLettersI18n } from '../../hooks/useLettersI18n'
import { useToast } from '../../components/ui/ToastProvider'

const recipientSources = [
  { value: 'users', label: 'Users' },
  { value: 'customers', label: 'Customers' },
  { value: 'billers', label: 'Billers' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'all', label: 'All People' },
  { value: 'custom', label: 'Custom Phone Number' },
]

export default function AnnouncementsPage() {
  const { t } = useLettersI18n()
  const { pushToast } = useToast()
  const [tab, setTab] = useState<'list' | 'create'>('list')
  const [items, setItems] = useState<any[]>([])
  const [sendResults, setSendResults] = useState<any>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [form, setForm] = useState({
    title: '',
    body_html: '',
    audience_type: 'users',
    scheduled_at: '',
    recipients: [] as RecipientOption[],
  })

  const recipientSource = useMemo(() => {
    const match = recipientSources.find(item => item.value === form.audience_type)
    return match?.value === 'custom' ? 'custom' : (form.audience_type as any)
  }, [form.audience_type])

  async function load() {
    const res = await fetchAnnouncements()
    setItems(res.data?.data || res.data || [])
  }

  useEffect(() => { if (tab === 'list') load() }, [tab])

  function buildPayload(extra: Record<string, any> = {}) {
    const payload = new FormData()
    payload.append('title', form.title)
    payload.append('body_html', form.body_html)
    payload.append('audience_type', form.audience_type)
    payload.append('recipients', JSON.stringify(form.recipients.map(item => ({
      name: item.name,
      email: item.email,
      phone: item.phone,
      recipient_type: item.recipient_type || form.audience_type,
      recipient_id: item.recipient_id,
    }))))
    if (form.scheduled_at) payload.append('scheduled_at', form.scheduled_at)
    attachments.forEach(file => payload.append('attachments[]', file))
    Object.entries(extra).forEach(([key, value]) => payload.append(key, value ? '1' : '0'))
    return payload
  }

  async function saveDraft() {
    try {
      await createAnnouncement(buildPayload({ save_draft: true }))
      pushToast('Announcement saved as draft.')
      setTab('list')
      resetForm()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to save announcement', 'error')
    }
  }

  async function sendNow() {
    if (form.recipients.some(item => !item.phone?.trim())) {
      pushToast('All recipients must have a phone number before sending.', 'error')
      return
    }
    try {
      const res = await createAnnouncement(buildPayload({ send_now: true }))
      const results = res.data?.results
      setSendResults(results || null)
      if (results) {
        const msg = `Sent: ${results.sent}, Failed: ${results.failed}${results.skipped ? `, Skipped: ${results.skipped}` : ''}`
        pushToast(msg, results.failed > 0 ? 'error' : 'success')
      } else {
        pushToast('Announcement sent via WhatsApp.')
      }
      setTab('list')
      resetForm()
      await load()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to send announcement', 'error')
    }
  }

  async function handlePreview() {
    try {
      const res = await previewAnnouncement(buildPayload())
      setPreview(res.data.preview)
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to preview announcement', 'error')
    }
  }

  function resetForm() {
    setForm({ title: '', body_html: '', audience_type: 'users', scheduled_at: '', recipients: [] })
    setAttachments([])
    setPreview(null)
  }

  async function resend(item: any) {
    try {
      const res = await sendAnnouncement(item.id)
      const results = res.data?.results
      setSendResults(results || null)
      if (results) {
        pushToast(`Sent: ${results.sent}, Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success')
      } else {
        pushToast('Announcement sent.')
      }
      await load()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Send failed', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <LettersPageHeader
        title={t('announcements')}
        action={
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setTab('list')}>{t('announcementList')}</SecondaryButton>
            <PrimaryButton onClick={() => { setTab('create'); resetForm() }}>+ {t('createAnnouncement')}</PrimaryButton>
          </div>
        }
      />

      {tab === 'create' ? (
        <LettersCard>
          <form className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel required>Recipient Category</FieldLabel>
                <select
                  value={form.audience_type}
                  onChange={e => setForm({ ...form, audience_type: e.target.value, recipients: [] })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  {recipientSources.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div><FieldLabel required>{t('title')}</FieldLabel><TextInput value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            </div>

            <RecipientSelect
              label="To"
              required
              value={form.recipients}
              onChange={recipients => setForm({ ...form, recipients })}
              source={recipientSource}
              usePeopleSearch
            />

            <div><FieldLabel required>{t('body')}</FieldLabel><SimpleRichTextEditor value={form.body_html} onChange={v => setForm({ ...form, body_html: v })} /></div>
            <p className="text-xs text-slate-500">Placeholders: {'{name}'}, {'{phone_number}'}, {'{email}'}, {'{institution_name}'}</p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Schedule Date & Time</FieldLabel>
                <TextInput type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} />
              </div>
              <div>
                <FieldLabel>Attachment (optional)</FieldLabel>
                <input type="file" multiple onChange={e => setAttachments(Array.from(e.target.files || []))} className="block w-full text-sm" />
                {attachments.length > 0 && <ul className="mt-2 text-xs text-slate-500">{attachments.map(file => <li key={file.name}>{file.name}</li>)}</ul>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <SecondaryButton type="button" onClick={handlePreview}>Preview Message</SecondaryButton>
              <SecondaryButton type="button" onClick={saveDraft}>Save Draft</SecondaryButton>
              <PrimaryButton type="button" onClick={sendNow}>Send Now</PrimaryButton>
            </div>

            {preview && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-sm font-semibold text-slate-800">Preview</div>
                <div className="text-sm font-bold">{preview.title}</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: preview.body_html }} />
              </div>
            )}
          </form>
        </LettersCard>
      ) : (
        <>
        {sendResults && (
          <LettersCard>
            <div className="mb-2 text-sm font-semibold text-slate-800">Last Send Results</div>
            <div className="text-sm text-slate-600">Sent: {sendResults.sent} · Failed: {sendResults.failed}{sendResults.skipped ? ` · Skipped: ${sendResults.skipped}` : ''}</div>
            {sendResults.failed_recipients?.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm">
                {sendResults.failed_recipients.map((item: any, index: number) => (
                  <li key={`${item.name}-${index}`} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">
                    <strong>{item.name}</strong>{item.phone ? ` (${item.phone})` : ''}: {item.error}
                  </li>
                ))}
              </ul>
            )}
            <button className="mt-3 text-sm text-slate-500 underline" onClick={() => setSendResults(null)}>Dismiss</button>
          </LettersCard>
        )}
        <LettersCard>
          <table className="min-w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="py-3 pr-4">{t('title')}</th><th className="py-3 pr-4">{t('status')}</th><th className="py-3 pr-4">WhatsApp</th><th className="py-3">{t('actions')}</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="py-3 pr-4 font-semibold">{item.title}</td>
                  <td className="py-3 pr-4"><StatusBadge status={item.status} /></td>
                  <td className="py-3 pr-4 capitalize">{item.whatsapp_status?.replace(/_/g, ' ')}</td>
                  <td className="py-3">
                    {!['sent'].includes(item.status) && <PrimaryButton className="mr-2" onClick={() => resend(item)}>{t('send')}</PrimaryButton>}
                    <button className="text-red-600" onClick={async () => { await deleteAnnouncement(item.id); await load() }}>{t('delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </LettersCard>
        </>
      )}
    </div>
  )
}
