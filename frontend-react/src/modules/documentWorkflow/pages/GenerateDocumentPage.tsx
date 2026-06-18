import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchDocumentTypes, formatContractError, generateContract } from '../../../api/contracts'
import { useToast } from '../../../components/ui/ToastProvider'

type SignerCfg = { role: string; label?: string; required?: boolean }
type FieldCfg = { key: string; label: string; type?: string }
type DocType = {
  id: number
  name: string
  recipient_type: string
  default_template_id?: number | null
  required_signatories?: SignerCfg[]
  field_schema?: FieldCfg[]
}

export default function GenerateDocumentPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [types, setTypes] = useState<DocType[]>([])
  const [typeId, setTypeId] = useState('')
  const [recipient, setRecipient] = useState({ user_id: '', student_id: '', hr_staff_profile_id: '', recipient_name: '', recipient_email: '', recipient_phone: '' })
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const [signatories, setSignatories] = useState<Record<string, { name: string; email: string; phone: string }>>({})
  const [dates, setDates] = useState({ start_date: '', end_date: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchDocumentTypes().then((t) => setTypes(t as DocType[])).catch(() => {})
  }, [])

  const selectedType = useMemo(() => types.find((t) => String(t.id) === typeId), [types, typeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typeId) {
      pushToast('Select a document type.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        document_type_id: Number(typeId),
        start_date: dates.start_date || undefined,
        end_date: dates.end_date || undefined,
        metadata,
      }
      if (recipient.user_id) payload.user_id = Number(recipient.user_id)
      if (recipient.student_id) payload.student_id = Number(recipient.student_id)
      if (recipient.hr_staff_profile_id) payload.hr_staff_profile_id = Number(recipient.hr_staff_profile_id)
      if (recipient.recipient_name) payload.recipient_name = recipient.recipient_name
      if (recipient.recipient_email) payload.recipient_email = recipient.recipient_email
      if (recipient.recipient_phone) payload.recipient_phone = recipient.recipient_phone

      const sigList = Object.entries(signatories)
        .filter(([, v]) => v.name || v.email || v.phone)
        .map(([role, v]) => ({ role, ...v }))
      if (sigList.length) payload.signatories = sigList

      const doc = await generateContract(payload)
      pushToast('Document generated.')
      navigate(`/document-workflow/documents/${(doc as { id: number }).id}`)
    } catch (error) {
      pushToast(formatContractError(error, 'Failed to generate document'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Document Type</label>
        <select required value={typeId} onChange={(e) => { setTypeId(e.target.value); setMetadata({}); setSignatories({}) }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">Select document type</option>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {selectedType && !selectedType.default_template_id && (
          <p className="mt-1 text-xs text-amber-600">This type has no default template. Set one under Document Types.</p>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-800">Recipient</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <input placeholder="Student ID" value={recipient.student_id} onChange={(e) => setRecipient({ ...recipient, student_id: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="HR Staff Profile ID" value={recipient.hr_staff_profile_id} onChange={(e) => setRecipient({ ...recipient, hr_staff_profile_id: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="User ID" value={recipient.user_id} onChange={(e) => setRecipient({ ...recipient, user_id: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Recipient name (manual)" value={recipient.recipient_name} onChange={(e) => setRecipient({ ...recipient, recipient_name: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Recipient email" type="email" value={recipient.recipient_email} onChange={(e) => setRecipient({ ...recipient, recipient_email: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Recipient phone" value={recipient.recipient_phone} onChange={(e) => setRecipient({ ...recipient, recipient_phone: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <p className="mt-1 text-xs text-slate-500">Provide a student, staff, or user ID to auto-populate fields from existing records.</p>
      </div>

      {selectedType?.field_schema && selectedType.field_schema.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Document Fields</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {selectedType.field_schema.map((field) => (
              <div key={field.key}>
                <label className="mb-1 block text-xs text-slate-600">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea value={metadata[field.key] || ''} onChange={(e) => setMetadata({ ...metadata, [field.key]: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} />
                ) : (
                  <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={metadata[field.key] || ''} onChange={(e) => setMetadata({ ...metadata, [field.key]: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedType?.required_signatories && selectedType.required_signatories.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Signatories</h3>
          <div className="space-y-3">
            {selectedType.required_signatories.map((sig) => (
              <div key={sig.role} className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-xs font-medium text-slate-700">{sig.label || sig.role}{sig.required ? ' *' : ''}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <input placeholder="Name" value={signatories[sig.role]?.name || ''} onChange={(e) => setSignatories({ ...signatories, [sig.role]: { ...(signatories[sig.role] || { name: '', email: '', phone: '' }), name: e.target.value } })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input placeholder="Email" value={signatories[sig.role]?.email || ''} onChange={(e) => setSignatories({ ...signatories, [sig.role]: { ...(signatories[sig.role] || { name: '', email: '', phone: '' }), email: e.target.value } })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <input placeholder="Phone" value={signatories[sig.role]?.phone || ''} onChange={(e) => setSignatories({ ...signatories, [sig.role]: { ...(signatories[sig.role] || { name: '', email: '', phone: '' }), phone: e.target.value } })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">Each signatory receives their own secure signing link.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-600">Start Date</label>
          <input type="date" value={dates.start_date} onChange={(e) => setDates({ ...dates, start_date: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">End Date</label>
          <input type="date" value={dates.end_date} onChange={(e) => setDates({ ...dates, end_date: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {submitting ? 'Generating…' : 'Generate Document'}
      </button>
    </form>
  )
}
