import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Calendar,
  Info,
  Paperclip,
  Save,
  Search,
  Send,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  createAnnouncement,
  createAnnouncementTemplate,
  fetchAnnouncementTemplates,
  fetchLetterSettings,
  previewAnnouncement,
  searchAnnouncementRecipients,
} from '../../api/letters'
import { useLettersI18n } from '../../hooks/useLettersI18n'
import {
  FieldLabel,
  LettersCard,
  PrimaryButton,
  SecondaryButton,
  SelectInput,
  TextInput,
} from '../../components/letters/LettersUi'
import { useToast } from '../../components/ui/ToastProvider'
import Modal from '../../components/ui/Modal'
import SearchableSelect from '../../components/ui/SearchableSelect'

type RecipientRow = {
  id?: number
  name: string
  email?: string
  phone?: string
  additional_phone?: string
  address?: string
  recipient_type?: string
  recipient_id?: number
}

const MESSAGE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'academic', label: 'Academic' },
  { value: 'finance', label: 'Finance' },
  { value: 'events', label: 'Events' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'custom', label: 'Custom' },
]

const RECIPIENT_TABS = [
  { value: 'users', label: 'Users', selectAllLabel: 'All Users' },
  { value: 'students', label: 'Students', selectAllLabel: 'All Students' },
  { value: 'staff', label: 'Staff', selectAllLabel: 'All Staff' },
  { value: 'suppliers', label: 'Suppliers', selectAllLabel: 'All Suppliers' },
  { value: 'custom', label: 'Custom Phone Number', selectAllLabel: '' },
]

const PLACEHOLDERS = ['{name}', '{email}', '{phone}', '{address}', '{date}', '{institution_name}', '{reference}']

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

export default function ComposeAnnouncementPage() {
  const { pushToast } = useToast()
  const { t } = useLettersI18n()
  const [searchParams] = useSearchParams()
  const editingTemplateId = searchParams.get('template')
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formTopRef = useRef<HTMLDivElement>(null)

  const [templates, setTemplates] = useState<any[]>([])
  const [templateKey, setTemplateKey] = useState('blank')
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [category, setCategory] = useState('general')
  const [customCategory, setCustomCategory] = useState('')
  const [title, setTitle] = useState('')
  const [headerHtml, setHeaderHtml] = useState('')
  const [bodyHtml, setBodyHtml] = useState('Dear {name}')
  const [attachments, setAttachments] = useState<File[]>([])
  const [recipientTab, setRecipientTab] = useState('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<RecipientRow[]>([])
  const [recipients, setRecipients] = useState<RecipientRow[]>([])
  const [scheduleLater, setScheduleLater] = useState(false)
  const [scheduleTimes, setScheduleTimes] = useState<string[]>([''])
  const [preview, setPreview] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sendResults, setSendResults] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [selectingAll, setSelectingAll] = useState(false)

  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [customAddress, setCustomAddress] = useState('')

  const resolvedCategory = category === 'custom' ? (customCategory.trim() || 'custom') : category
  const activeTab = RECIPIENT_TABS.find(t => t.value === recipientTab)

  const loadTemplates = useCallback(async (search = '') => {
    try {
      const res = await fetchAnnouncementTemplates(search.trim() || undefined)
      setTemplates(Array.isArray(res.data) ? res.data : [])
    } catch {
      setTemplates([])
    }
  }, [])

  const templateOptions = useMemo(
    () => [
      { value: 'blank', label: 'Blank Message' },
      ...templates.map(item => ({
        value: String(item.id),
        label: `${item.name}${item.subject ? ` — ${item.subject}` : ''}`,
      })),
    ],
    [templates],
  )

  useEffect(() => {
    if (!editingTemplateId || !templates.length) return
    const key = editingTemplateId === 'blank' ? 'blank' : editingTemplateId
    setTemplateKey(key)
    if (key === 'blank') return
    const tmpl = templates.find(item => String(item.id) === key)
    if (!tmpl) return
    setTitle(tmpl.subject || '')
    setHeaderHtml(tmpl.header_html || '')
    setBodyHtml(tmpl.body_html || 'Dear {name}')
    setCategory(tmpl.category || 'general')
  }, [editingTemplateId, templates])

  function loadDefaultHeader() {
    fetchLetterSettings()
      .then(res => {
        const company = res.data?.company_name
        if (company) setHeaderHtml(company)
      })
      .catch(() => {})
  }

  function resetForm() {
    setTemplateKey('blank')
    setTemplateName('')
    setCategory('general')
    setCustomCategory('')
    setTitle('')
    setHeaderHtml('')
    setBodyHtml('Dear {name}')
    setAttachments([])
    setRecipients([])
    setScheduleLater(false)
    setScheduleTimes([''])
    setSendResults(null)
    setPreview(null)
    setCustomName('')
    setCustomEmail('')
    setCustomPhone('')
    setCustomAddress('')
    setSearchQuery('')
    setSearchResults([])
    loadDefaultHeader()
    loadTemplates()
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function mapSearchRow(item: any): RecipientRow {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone_number || item.phone,
      additional_phone: item.additional_phone_number || undefined,
      address: item.address,
      recipient_type: item.recipient_type,
      recipient_id: item.id,
    }
  }

  function formatApiError(error: any, fallback: string) {
    const validation = error?.response?.data?.errors
    if (validation) {
      return Object.values(validation).flat().join(' ')
    }
    return error?.response?.data?.message || fallback
  }

  useEffect(() => {
    loadDefaultHeader()
    loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    if (recipientTab === 'custom') {
      setSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      searchAnnouncementRecipients(recipientTab, searchQuery.trim())
        .then(res => {
          setSearchResults((res.data || []).map(mapSearchRow))
        })
        .catch(() => setSearchResults([]))
    }, searchQuery.trim() ? 250 : 0)
    return () => clearTimeout(timer)
  }, [recipientTab, searchQuery])

  const missingPhone = useMemo(
    () => recipients.filter(r => !r.phone?.trim()),
    [recipients],
  )

  useEffect(() => {
    setPreview(null)
  }, [bodyHtml, title, headerHtml, recipients, attachments, scheduleLater, scheduleTimes])

  function insertPlaceholder(token: string) {
    const el = bodyRef.current
    if (!el) {
      setBodyHtml(prev => prev + token)
      return
    }
    const start = el.selectionStart ?? bodyHtml.length
    const end = el.selectionEnd ?? bodyHtml.length
    const next = bodyHtml.slice(0, start) + token + bodyHtml.slice(end)
    setBodyHtml(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  }

  function applyTemplate(key: string) {
    setTemplateKey(key)
    if (key === 'blank') {
      setTitle('')
      setBodyHtml('Dear {name}')
      setCategory('general')
      setCustomCategory('')
      loadDefaultHeader()
      return
    }
    const tmpl = templates.find(item => String(item.id) === key)
    if (tmpl) {
      setTitle(tmpl.subject || '')
      setHeaderHtml(tmpl.header_html || '')
      setBodyHtml(tmpl.body_html || 'Dear {name}')
      setCategory(tmpl.category || 'general')
      pushToast(`Template "${tmpl.name}" loaded.`)
    }
  }

  function addRecipient(row: RecipientRow) {
    setRecipients(prev => {
      const exists = row.recipient_id
        ? prev.some(
            r => r.recipient_id === row.recipient_id && r.recipient_type === row.recipient_type,
          )
        : prev.some(r => r.name === row.name && r.phone === row.phone)
      if (exists) return prev
      return [...prev, row]
    })
    setSearchQuery('')
  }

  async function selectAllInCategory() {
    if (recipientTab === 'custom') return
    setSelectingAll(true)
    try {
      const res = await searchAnnouncementRecipients(recipientTab, '', true)
      const rows = (res.data || []).map(mapSearchRow)
      if (!rows.length) {
        pushToast(`No ${activeTab?.label.toLowerCase() || 'recipients'} found.`, 'error')
        return
      }
      setRecipients(prev => {
        const next = [...prev]
        rows.forEach(row => {
          const exists = row.recipient_id
            ? next.some(r => r.recipient_id === row.recipient_id && r.recipient_type === row.recipient_type)
            : next.some(r => r.name === row.name && r.phone === row.phone)
          if (!exists) next.push(row)
        })
        return next
      })
      pushToast(`Added ${rows.length} recipient(s) from ${activeTab?.selectAllLabel || 'category'}.`)
    } catch (error: any) {
      pushToast(formatApiError(error, 'Unable to load recipients'), 'error')
    } finally {
      setSelectingAll(false)
    }
  }

  function addCustomRecipient() {
    if (!customName.trim()) {
      pushToast('Enter a name for the custom recipient.', 'error')
      return
    }
    addRecipient({
      name: customName.trim(),
      email: customEmail.trim() || undefined,
      phone: customPhone.trim() || undefined,
      address: customAddress.trim() || undefined,
      recipient_type: 'custom',
    })
    setCustomName('')
    setCustomEmail('')
    setCustomPhone('')
    setCustomAddress('')
  }

  function removeRecipient(index: number) {
    setRecipients(prev => prev.filter((_, i) => i !== index))
  }

  function addAttachments(files: FileList | File[]) {
    const incoming = Array.from(files)
    const valid: File[] = []
    for (const file of incoming) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        pushToast(`${file.name} exceeds 10MB and was skipped.`, 'error')
        continue
      }
      valid.push(file)
    }
    if (!valid.length) return
    setAttachments(prev => {
      const next = [...prev]
      valid.forEach(file => {
        const exists = next.some(f => f.name === file.name && f.size === file.size)
        if (!exists) next.push(file)
      })
      return next
    })
  }

  function removeAttachment(index: number) {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  function addScheduleSlot() {
    setScheduleTimes(prev => [...prev, ''])
  }

  function updateScheduleSlot(index: number, value: string) {
    setScheduleTimes(prev => prev.map((item, i) => (i === index ? value : item)))
  }

  function removeScheduleSlot(index: number) {
    setScheduleTimes(prev => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)))
  }

  function buildPayload(extra: Record<string, boolean | string> = {}) {
    const payload = new FormData()
    payload.append('title', title.trim() || 'WhatsApp Announcement')
    payload.append('category', resolvedCategory)
    payload.append('header_html', headerHtml.trim())
    payload.append('body_html', bodyHtml)
    payload.append('audience_type', recipientTab === 'custom' ? 'custom' : recipientTab)
    payload.append(
      'recipients',
      JSON.stringify(
        recipients.map(r => ({
          name: r.name,
          email: r.email,
          phone: r.phone,
          additional_phone: r.additional_phone,
          address: r.address,
          recipient_type: r.recipient_type || recipientTab,
          recipient_id: r.recipient_id,
        })),
      ),
    )
    if (scheduleLater) {
      const times = scheduleTimes.filter(t => t.trim())
      if (times.length) {
        payload.append('schedules', JSON.stringify(times))
        payload.append('scheduled_at', times[0])
        payload.append('schedule_for_later', '1')
      }
    }
    attachments.forEach(file => payload.append('attachments[]', file))
    Object.entries(extra).forEach(([key, value]) => {
      payload.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : value)
    })
    return payload
  }

  async function handlePreview() {
    if (!bodyHtml.trim()) {
      pushToast('Message body is required.', 'error')
      return
    }
    if (recipients.length === 0) {
      pushToast('Select at least one recipient to preview.', 'error')
      return
    }
    if (missingPhone.length > 0) {
      pushToast('All recipients must have a phone number before previewing.', 'error')
      return
    }
    setBusy(true)
    try {
      const res = await previewAnnouncement(buildPayload())
      setPreview(res.data.preview)
      setPreviewOpen(true)
    } catch (error: any) {
      if (error?.response?.status === 401) {
        pushToast('Your session has expired. Please sign in again.', 'error')
      } else {
        pushToast(formatApiError(error, 'Unable to preview message'), 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  function confirmPreview() {
    setPreviewOpen(false)
    pushToast('Preview confirmed.')
  }

  async function confirmSaveTemplate() {
    if (!templateName.trim()) {
      pushToast('Enter a template name.', 'error')
      return
    }
    if (!bodyHtml.trim()) {
      pushToast('Message body is required.', 'error')
      return
    }
    setBusy(true)
    try {
      await createAnnouncementTemplate({
        name: templateName.trim(),
        category: resolvedCategory,
        subject: title.trim(),
        header_html: headerHtml.trim(),
        body_html: bodyHtml,
      })
      pushToast(`Template "${templateName.trim()}" saved.`)
      setSaveTemplateOpen(false)
      setTemplateName('')
      await loadTemplates()
    } catch (error: any) {
      pushToast(formatApiError(error, 'Unable to save template'), 'error')
    } finally {
      setBusy(false)
    }
  }

  function openSaveTemplateModal() {
    if (!bodyHtml.trim()) {
      pushToast('Message body is required.', 'error')
      return
    }
    setTemplateName(title.trim() || '')
    setSaveTemplateOpen(true)
  }

  async function sendNow() {
    if (!bodyHtml.trim()) {
      pushToast('Message body is required.', 'error')
      return
    }
    if (recipients.length === 0) {
      pushToast('Select at least one recipient.', 'error')
      return
    }
    if (missingPhone.length > 0) {
      pushToast('All recipients must have a phone number before sending.', 'error')
      return
    }
    if (scheduleLater && !scheduleTimes.some(t => t.trim())) {
      pushToast('Add at least one schedule date and time.', 'error')
      return
    }

    setBusy(true)
    setSendResults(null)
    try {
      const payload = scheduleLater
        ? buildPayload({ save_draft: '0', schedule_for_later: '1' })
        : buildPayload({ send_now: '1' })
      const res = await createAnnouncement(payload)
      const results = res.data?.results
      if (scheduleLater) {
        const ref = res.data?.announcement?.reference
        pushToast(ref ? `Scheduled successfully. Serial: ${ref}` : 'Announcement scheduled successfully.')
        resetForm()
      } else if (results) {
        setSendResults(results)
        const ref = res.data?.announcement?.reference
        const msg = ref
          ? `Sent ${results.sent} of ${results.total}. Serial: ${ref}. Failed: ${results.failed}`
          : `Sent ${results.sent} of ${results.total}. Failed: ${results.failed}`
        pushToast(msg, results.failed > 0 ? 'error' : 'success')
        resetForm()
      } else {
        pushToast('Announcement processed.')
        resetForm()
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        pushToast('Your session has expired. Please sign in again.', 'error')
      } else {
        pushToast(formatApiError(error, 'Unable to send announcement'), 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  const emptyResultsLabel = `No ${RECIPIENT_TABS.find(t => t.value === recipientTab)?.label.toLowerCase()} found.`

  return (
    <div className="space-y-6" ref={formTopRef}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3a5f]">Compose Message</h1>
          <p className="mt-1 text-sm text-slate-500">
            Send personalized WhatsApp announcements and generated documents.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Users className="h-5 w-5 text-[#1e3a5f]" />
          <div>
            <div className="text-xs text-slate-500">Selected Recipients</div>
            <div className="text-lg font-bold text-[#1e3a5f]">{recipients.length}</div>
          </div>
        </div>
      </div>

      {sendResults && (
        <LettersCard className="border-emerald-200 bg-emerald-50/40">
          <div className="mb-2 text-sm font-semibold text-slate-800">Send Summary</div>
          <div className="text-sm text-slate-700">
            Total: {sendResults.total} · Sent: {sendResults.sent} · Failed: {sendResults.failed}
          </div>
          {sendResults.failed_recipients?.length > 0 && (
            <ul className="mt-3 space-y-2 text-sm">
              {sendResults.failed_recipients.map((item: any, index: number) => (
                <li
                  key={`${item.name}-${index}`}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800"
                >
                  <strong>{item.name}</strong>
                  {item.phone ? ` (${item.phone})` : ''}: {item.error}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="mt-3 text-sm text-slate-500 underline"
            onClick={() => setSendResults(null)}
          >
            Dismiss
          </button>
        </LettersCard>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <LettersCard>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-lg font-bold text-[#1e3a5f]">Message Content</h2>
            <div className="w-full sm:max-w-xs">
              <FieldLabel>{t('selectTemplate')}</FieldLabel>
              <SearchableSelect
                value={templateKey}
                onChange={applyTemplate}
                options={templateOptions}
                placeholder="Search or select template..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>Category</FieldLabel>
                <SelectInput value={category} onChange={e => setCategory(e.target.value)}>
                  {MESSAGE_CATEGORIES.map(item => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </SelectInput>
              </div>
              {category === 'custom' && (
                <div>
                  <FieldLabel>Custom Category</FieldLabel>
                  <TextInput
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category"
                  />
                </div>
              )}
            </div>

            <div>
              <FieldLabel>Header (appears at top of WhatsApp message)</FieldLabel>
              <TextInput
                value={headerHtml}
                onChange={e => setHeaderHtml(e.target.value)}
                placeholder="e.g. Alpha Bridge Technologies"
              />
              <p className="mt-1 text-xs text-slate-500">
                Recipients see this first — usually your company or institution name. A serial number from Letter Settings (e.g. ABT/ADMIN/L-000001) is automatically added to every message.
              </p>
            </div>

            <div>
              <FieldLabel required>Subject</FieldLabel>
              <TextInput
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter message subject"
              />
              <p className="mt-1 text-xs text-slate-500">Internal subject/title for tracking only.</p>
            </div>

            <div>
              <FieldLabel required>Message Body</FieldLabel>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Insert Variables:</span>
                {PLACEHOLDERS.map(token => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => insertPlaceholder(token)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {token}
                  </button>
                ))}
              </div>
              <textarea
                ref={bodyRef}
                rows={10}
                value={bodyHtml}
                onChange={e => setBodyHtml(e.target.value)}
                placeholder="Write your WhatsApp message..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm leading-6"
              />
            </div>

            <div>
              <FieldLabel>Attachments</FieldLabel>
              <div
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  if (e.dataTransfer.files?.length) addAttachments(e.dataTransfer.files)
                }}
              >
                <Paperclip className="mb-2 h-8 w-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">
                  Attach PDFs, Documents or Images (Max 10MB each)
                </p>
                {attachments.length > 0 ? (
                  <ul className="mt-3 w-full space-y-1 text-left text-sm text-[#1e3a5f]">
                    {attachments.map((file, index) => (
                      <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                        <span className="truncate pr-2">{file.name}</span>
                        <button
                          type="button"
                          className="shrink-0 text-xs text-rose-600 underline"
                          onClick={() => removeAttachment(index)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Drag and drop or browse files</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.length) addAttachments(e.target.files)
                    e.target.value = ''
                  }}
                />
                <SecondaryButton
                  type="button"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </SecondaryButton>
              </div>
            </div>
          </div>
        </LettersCard>

        <div className="space-y-6">
          <LettersCard>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1e3a5f]">Sending Options</h2>
              <Info className="h-4 w-4 text-slate-400" title="WhatsApp delivery via WasenderAPI" />
            </div>

            <div className="mb-4 rounded-xl bg-sky-50 px-4 py-3">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <input type="checkbox" checked disabled readOnly className="rounded" />
                Send via WhatsApp
              </label>
              <p className="mt-1 pl-6 text-xs text-slate-500">
                Announcements are delivered through WhatsApp only. Multiple recipients are sent one every 6 seconds.
              </p>
            </div>

            <label className="mb-5 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={scheduleLater}
                onChange={e => setScheduleLater(e.target.checked)}
                className="rounded"
              />
              <Calendar className="h-4 w-4 text-slate-500" />
              Schedule for later
            </label>

            {scheduleLater && (
              <div className="mb-5 space-y-3">
                <FieldLabel required>Schedule Date &amp; Time</FieldLabel>
                {scheduleTimes.map((time, index) => (
                  <div key={`schedule-${index}`} className="flex gap-2">
                    <TextInput
                      type="datetime-local"
                      value={time}
                      onChange={e => updateScheduleSlot(index, e.target.value)}
                      className="flex-1"
                    />
                    {scheduleTimes.length > 1 && (
                      <button
                        type="button"
                        className="rounded-xl px-3 text-sm text-rose-600 hover:bg-rose-50"
                        onClick={() => removeScheduleSlot(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm font-semibold text-[#1e3a5f]"
                  onClick={addScheduleSlot}
                >
                  + Add another schedule
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <SecondaryButton
                type="button"
                className="w-full"
                onClick={handlePreview}
                disabled={busy}
              >
                Preview Message
              </SecondaryButton>

              <div className="flex flex-col gap-2 sm:flex-row">
                <SecondaryButton
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2"
                  onClick={openSaveTemplateModal}
                  disabled={busy}
                >
                  <Save className="h-4 w-4" />
                  Save Template
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2"
                  onClick={sendNow}
                  disabled={busy}
                >
                  <Send className="h-4 w-4" />
                  {scheduleLater ? 'Schedule Send' : 'Send Now'}
                </PrimaryButton>
              </div>
            </div>
          </LettersCard>

          <LettersCard>
            <div className="mb-1 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#1e3a5f]" />
              <h2 className="text-lg font-bold text-[#1e3a5f]">Select Recipients</h2>
            </div>
            <p className="mb-4 text-sm text-slate-500">Choose who will receive this message.</p>

            <div className="mb-3 flex flex-wrap gap-2">
              {RECIPIENT_TABS.map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setRecipientTab(tab.value)
                    setSearchQuery('')
                    if (tab.value !== 'custom') setSearchResults([])
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    recipientTab === tab.value
                      ? 'bg-[#1e3a5f] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {recipientTab !== 'custom' && (
              <div className="relative mb-3 flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <TextInput
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search name, email, phone..."
                    className="pl-9"
                  />
                </div>
                {activeTab?.selectAllLabel && (
                  <SecondaryButton
                    type="button"
                    onClick={selectAllInCategory}
                    disabled={selectingAll || busy}
                    className="whitespace-nowrap text-xs"
                  >
                    {selectingAll ? 'Loading...' : activeTab.selectAllLabel}
                  </SecondaryButton>
                )}
              </div>
            )}

            {recipientTab === 'custom' ? (
              <div className="space-y-2 rounded-xl border border-dashed border-slate-300 p-3">
                <TextInput
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="Name *"
                />
                <TextInput
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  placeholder="Email"
                />
                <TextInput
                  value={customPhone}
                  onChange={e => setCustomPhone(e.target.value)}
                  placeholder="Phone *"
                />
                <TextInput
                  value={customAddress}
                  onChange={e => setCustomAddress(e.target.value)}
                  placeholder="Address"
                />
                <button
                  type="button"
                  onClick={addCustomRecipient}
                  className="text-sm font-semibold text-[#1e3a5f]"
                >
                  + Add recipient
                </button>
              </div>
            ) : (
              <div className="max-h-48 overflow-auto rounded-xl border border-slate-200">
                {searchResults.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-slate-500">{emptyResultsLabel}</div>
                ) : (
                  searchResults.map(item => (
                    <button
                      key={`${item.recipient_type}-${item.id}-${item.name}`}
                      type="button"
                      onClick={() => addRecipient(item)}
                      className="block w-full border-b border-slate-100 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                    >
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-500">
                        {[item.email, item.phone].filter(Boolean).join(' · ') || '—'}
                        {item.address ? ` · ${item.address}` : ''}
                      </div>
                      {!item.phone?.trim() && (
                        <div className="mt-1 text-xs text-amber-700">No phone number on file</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {recipients.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {recipients.map((item, index) => (
                  <span
                    key={`${item.name}-${index}`}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                      item.phone
                        ? 'bg-[#1e3a5f]/10 text-[#1e3a5f]'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span>
                      {item.name}
                      {item.phone ? ` (${item.phone})` : ' (no phone)'}
                    </span>
                    <button type="button" onClick={() => removeRecipient(index)} className="text-red-500">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {missingPhone.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {missingPhone.length} selected recipient(s) have no phone number. WhatsApp delivery
                requires a phone number.
              </div>
            )}
          </LettersCard>
        </div>
      </div>

      <Modal
        title="Message Preview"
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        wide
        footer={(
          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setPreviewOpen(false)}>
              Edit Message
            </SecondaryButton>
            <PrimaryButton type="button" onClick={confirmPreview}>
              Close Preview
            </PrimaryButton>
          </div>
        )}
      >
        {preview && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <div><span className="font-semibold text-slate-700">Subject:</span> {preview.subject || preview.title || '—'}</div>
              {preview.attachment_name && (
                <div className="mt-1">
                  <span className="font-semibold text-slate-700">Attachment:</span> {preview.attachment_name}
                </div>
              )}
              <div className="mt-1">
                <span className="font-semibold text-slate-700">Recipients:</span> {preview.recipients?.length || 0}
              </div>
            </div>

            {(preview.recipients || []).map((item: any, index: number) => (
              <div key={`${item.name}-${index}`} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#1e3a5f]">{item.name}</span>
                  {item.phone && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {item.phone}
                    </span>
                  )}
                </div>
                {item.email && <div className="text-xs text-slate-500">{item.email}</div>}
                {item.address && <div className="text-xs text-slate-500">{item.address}</div>}
                <div className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                  {item.personalized_message || item.body_html?.replace(/<[^>]+>/g, '')}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        title="Save Template"
        open={saveTemplateOpen}
        onClose={() => setSaveTemplateOpen(false)}
        footer={(
          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={() => setSaveTemplateOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="button" onClick={confirmSaveTemplate} disabled={busy}>Save Template</PrimaryButton>
          </div>
        )}
      >
        <div className="space-y-4">
          <div>
            <FieldLabel required>{t('templateName')}</FieldLabel>
            <TextInput
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="e.g. Welcome Message"
              autoFocus
            />
          </div>
          <p className="text-sm text-slate-500">
            Saves the current header, subject, category, and message body for quick reuse when composing announcements.
          </p>
        </div>
      </Modal>
    </div>
  )
}
