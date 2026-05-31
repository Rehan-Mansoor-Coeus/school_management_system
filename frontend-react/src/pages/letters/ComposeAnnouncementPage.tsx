import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  fetchAnnouncements,
  previewAnnouncement,
  searchAnnouncementRecipients,
} from '../../api/letters'
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

type RecipientRow = {
  id?: number
  name: string
  email?: string
  phone?: string
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
  { value: 'users', label: 'Users' },
  { value: 'customers', label: 'Customers' },
  { value: 'billers', label: 'Billers' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'students', label: 'Students' },
  { value: 'staff', label: 'Staff' },
  { value: 'custom', label: 'Custom Phone Number' },
]

const PLACEHOLDERS = ['{name}', '{email}', '{phone}', '{date}', '{institution_name}']

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

export default function ComposeAnnouncementPage() {
  const { pushToast } = useToast()
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [templates, setTemplates] = useState<any[]>([])
  const [templateKey, setTemplateKey] = useState('blank')
  const [category, setCategory] = useState('general')
  const [customCategory, setCustomCategory] = useState('')
  const [title, setTitle] = useState('')
  const [bodyHtml, setBodyHtml] = useState('Dear {name}')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [recipientTab, setRecipientTab] = useState('users')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<RecipientRow[]>([])
  const [recipients, setRecipients] = useState<RecipientRow[]>([])
  const [scheduleLater, setScheduleLater] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [preview, setPreview] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewConfirmed, setPreviewConfirmed] = useState(false)
  const [sendResults, setSendResults] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  const [customName, setCustomName] = useState('')
  const [customEmail, setCustomEmail] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [customAddress, setCustomAddress] = useState('')

  const resolvedCategory = category === 'custom' ? (customCategory.trim() || 'custom') : category

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetchAnnouncements({ status: 'draft', per_page: 50 })
      const rows = res.data?.data || res.data || []
      setTemplates(Array.isArray(rows) ? rows : [])
    } catch {
      setTemplates([])
    }
  }, [])

  useEffect(() => {
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
          const rows = (res.data || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            email: item.email,
            phone: item.phone_number || item.phone,
            address: item.address,
            recipient_type: item.recipient_type,
            recipient_id: item.id,
          }))
          setSearchResults(rows)
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
    setPreviewConfirmed(false)
    setPreview(null)
  }, [bodyHtml, title, recipients, attachment, scheduleLater, scheduledAt])

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
      return
    }
    const draft = templates.find(item => String(item.id) === key)
    if (draft) {
      setTitle(draft.title || '')
      setBodyHtml(draft.body_html || '')
      setCategory(draft.category || 'general')
    }
  }

  function addRecipient(row: RecipientRow) {
    const exists = row.recipient_id
      ? recipients.some(
          r => r.recipient_id === row.recipient_id && r.recipient_type === row.recipient_type,
        )
      : recipients.some(r => r.name === row.name && r.phone === row.phone)
    if (exists) return
    setRecipients(prev => [...prev, row])
    setSearchQuery('')
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

  function onAttachmentChange(file: File | null) {
    if (!file) {
      setAttachment(null)
      return
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      pushToast('Attachment must be 10MB or smaller.', 'error')
      return
    }
    setAttachment(file)
  }

  function buildPayload(extra: Record<string, boolean | string> = {}) {
    const payload = new FormData()
    payload.append('title', title.trim() || 'WhatsApp Announcement')
    payload.append('category', resolvedCategory)
    payload.append('body_html', bodyHtml)
    payload.append('audience_type', recipientTab === 'custom' ? 'custom' : recipientTab)
    payload.append(
      'recipients',
      JSON.stringify(
        recipients.map(r => ({
          name: r.name,
          email: r.email,
          phone: r.phone,
          address: r.address,
          recipient_type: r.recipient_type || recipientTab,
          recipient_id: r.recipient_id,
        })),
      ),
    )
    if (scheduleLater && scheduledAt) {
      payload.append('scheduled_at', scheduledAt)
      payload.append('schedule_for_later', '1')
    }
    if (attachment) payload.append('attachments[]', attachment)
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
        pushToast(error?.response?.data?.message || 'Unable to preview message', 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  function confirmPreview() {
    setPreviewConfirmed(true)
    setPreviewOpen(false)
    pushToast('Preview confirmed. You can send now.')
  }

  async function saveTemplate() {
    if (!bodyHtml.trim()) {
      pushToast('Message body is required.', 'error')
      return
    }
    setBusy(true)
    try {
      await createAnnouncement(buildPayload({ save_draft: true, save_as_template: true }))
      pushToast('Template saved as draft.')
      await loadTemplates()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to save template', 'error')
    } finally {
      setBusy(false)
    }
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
    if (scheduleLater && !scheduledAt) {
      pushToast('Choose a schedule date and time.', 'error')
      return
    }
    if (!scheduleLater && !previewConfirmed) {
      pushToast('Preview and confirm the message before sending.', 'error')
      return
    }

    setBusy(true)
    setSendResults(null)
    try {
      const payload = scheduleLater
        ? buildPayload({ save_draft: false, schedule_for_later: true })
        : buildPayload({ send_now: true })
      const res = await createAnnouncement(payload)
      const results = res.data?.results
      if (scheduleLater) {
        pushToast('Announcement scheduled successfully.')
      } else if (results) {
        setSendResults(results)
        const msg = `Sent ${results.sent} of ${results.total}. Failed: ${results.failed}`
        pushToast(msg, results.failed > 0 ? 'error' : 'success')
      } else {
        pushToast('Announcement processed.')
      }
      if (!scheduleLater) {
        setRecipients([])
        setPreview(null)
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        pushToast('Your session has expired. Please sign in again.', 'error')
      } else {
        pushToast(error?.response?.data?.message || 'Unable to send announcement', 'error')
      }
    } finally {
      setBusy(false)
    }
  }

  const emptyResultsLabel = `No ${RECIPIENT_TABS.find(t => t.value === recipientTab)?.label.toLowerCase()} found.`

  return (
    <div className="space-y-6">
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
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-[#1e3a5f]">Message Content</h2>
            <SelectInput
              value={templateKey}
              onChange={e => applyTemplate(e.target.value)}
              className="sm:max-w-[220px]"
            >
              <option value="blank">Blank Message</option>
              {templates.map(item => (
                <option key={item.id} value={String(item.id)}>
                  {item.title || `Draft #${item.id}`}
                </option>
              ))}
            </SelectInput>
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
                  const file = e.dataTransfer.files?.[0]
                  if (file) onAttachmentChange(file)
                }}
              >
                <Paperclip className="mb-2 h-8 w-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">
                  Attach PDFs, Documents or Images (Max 10MB)
                </p>
                {attachment ? (
                  <p className="mt-2 text-sm text-[#1e3a5f]">{attachment.name}</p>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">Drag and drop or browse files</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif"
                  className="hidden"
                  onChange={e => onAttachmentChange(e.target.files?.[0] || null)}
                />
                <SecondaryButton
                  type="button"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </SecondaryButton>
                {attachment && (
                  <button
                    type="button"
                    className="mt-2 text-xs text-rose-600 underline"
                    onClick={() => onAttachmentChange(null)}
                  >
                    Remove attachment
                  </button>
                )}
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
                Announcements are delivered through WhatsApp only.
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
              <div className="mb-5">
                <FieldLabel required>Schedule Date &amp; Time</FieldLabel>
                <TextInput
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                />
              </div>
            )}

            {previewConfirmed && !scheduleLater && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                Preview confirmed — ready to send.
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
                  onClick={saveTemplate}
                  disabled={busy}
                >
                  <Save className="h-4 w-4" />
                  Save Template
                </SecondaryButton>
                <PrimaryButton
                  type="button"
                  className="flex flex-1 items-center justify-center gap-2"
                  onClick={sendNow}
                  disabled={busy || (!scheduleLater && !previewConfirmed)}
                  title={!scheduleLater && !previewConfirmed ? 'Preview the message first' : undefined}
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
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <TextInput
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search name, email, phone..."
                  className="pl-9"
                />
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
              Confirm &amp; Enable Send
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
    </div>
  )
}
