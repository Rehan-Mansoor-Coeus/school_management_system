import { useEffect, useState } from 'react'
import {
  createDocumentType,
  deleteDocumentType,
  fetchContractTemplates,
  fetchDocumentTypes,
  formatContractError,
  updateDocumentType,
} from '../../../api/contracts'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../components/ui/ToastProvider'

type DocType = {
  id: number
  key: string
  name: string
  description?: string
  category: string
  recipient_type: string
  default_template_id?: number | null
  required_signatories?: unknown[]
  required_approvers?: unknown[]
  required_uploads?: unknown[]
  field_schema?: unknown[]
  supports_expiry: boolean
  is_active: boolean
  is_system: boolean
}

type Template = { id: number; name: string }

const empty = {
  name: '',
  description: '',
  category: 'general',
  recipient_type: 'staff',
  default_template_id: '',
  supports_expiry: false,
  required_signatories: '[\n  { "role": "recipient", "label": "Recipient", "required": true }\n]',
  required_approvers: '[\n  { "role": "hr-officer", "label": "HR Officer" }\n]',
  required_uploads: '[]',
  field_schema: '[]',
}

export default function DocumentTypesPage() {
  const { canAccess } = useAuth()
  const { pushToast } = useToast()
  const canManage = canAccess({ permissions: ['documents.types.manage', 'documents.edit', 'documents.manage'] })
  const canDelete = canAccess({ permissions: ['documents.types.manage', 'documents.delete', 'documents.manage'] })

  const [types, setTypes] = useState<DocType[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...empty })

  const load = async () => {
    setLoading(true)
    try {
      const [t, tpl] = await Promise.all([fetchDocumentTypes({}), fetchContractTemplates()])
      setTypes(t as DocType[])
      setTemplates(tpl as Template[])
    } catch (error) {
      pushToast(formatContractError(error, 'Failed to load document types'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...empty })
    setShowForm(true)
  }

  const openEdit = (t: DocType) => {
    setEditingId(t.id)
    setForm({
      name: t.name,
      description: t.description || '',
      category: t.category,
      recipient_type: t.recipient_type,
      default_template_id: t.default_template_id ? String(t.default_template_id) : '',
      supports_expiry: t.supports_expiry,
      required_signatories: JSON.stringify(t.required_signatories || [], null, 2),
      required_approvers: JSON.stringify(t.required_approvers || [], null, 2),
      required_uploads: JSON.stringify(t.required_uploads || [], null, 2),
      field_schema: JSON.stringify(t.field_schema || [], null, 2),
    })
    setShowForm(true)
  }

  const parseJson = (label: string, value: string): unknown[] => {
    try {
      const parsed = JSON.parse(value || '[]')
      if (!Array.isArray(parsed)) throw new Error('not array')
      return parsed
    } catch {
      throw new Error(`${label} must be a valid JSON array`)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    let payload: Record<string, unknown>
    try {
      payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        recipient_type: form.recipient_type,
        default_template_id: form.default_template_id ? Number(form.default_template_id) : null,
        supports_expiry: form.supports_expiry,
        required_signatories: parseJson('Signatories', form.required_signatories),
        required_approvers: parseJson('Approvers', form.required_approvers),
        required_uploads: parseJson('Uploads', form.required_uploads),
        field_schema: parseJson('Field schema', form.field_schema),
      }
    } catch (err) {
      pushToast((err as Error).message, 'error')
      return
    }

    try {
      if (editingId) {
        await updateDocumentType(editingId, payload)
        pushToast('Document type updated.')
      } else {
        await createDocumentType(payload)
        pushToast('Document type created.')
      }
      setShowForm(false)
      load()
    } catch (error) {
      pushToast(formatContractError(error, 'Save failed'), 'error')
    }
  }

  const toggleActive = async (t: DocType) => {
    try {
      await updateDocumentType(t.id, { is_active: !t.is_active })
      load()
    } catch (error) {
      pushToast(formatContractError(error, 'Update failed'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <button type="button" onClick={openCreate} className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">New Document Type</button>
        </div>
      )}

      {showForm && canManage && (
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select value={form.default_template_id} onChange={(e) => setForm({ ...form, default_template_id: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">Default template…</option>
              {templates.map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
            </select>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {['student', 'staff', 'general'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.recipient_type} onChange={(e) => setForm({ ...form, recipient_type: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {['student', 'teacher', 'staff', 'contract_staff', 'daily_paid', 'temporary', 'other'].map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={2} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.supports_expiry} onChange={(e) => setForm({ ...form, supports_expiry: e.target.checked })} />
            Supports expiry / renewal tracking
          </label>
          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Required Signatories (JSON)</label>
              <textarea value={form.required_signatories} onChange={(e) => setForm({ ...form, required_signatories: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" rows={5} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Required Approvers (JSON)</label>
              <textarea value={form.required_approvers} onChange={(e) => setForm({ ...form, required_approvers: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" rows={5} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Required Uploads (JSON)</label>
              <textarea value={form.required_uploads} onChange={(e) => setForm({ ...form, required_uploads: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" rows={4} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Custom Fields (JSON)</label>
              <textarea value={form.field_schema} onChange={(e) => setForm({ ...form, field_schema: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs" rows={4} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">{editingId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : types.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{t.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{t.key} · {t.category} · {t.recipient_type}{t.is_system ? ' · system' : ''}</p>
                {t.description && <p className="mt-2 text-xs text-slate-600">{t.description}</p>}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${t.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {t.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>{(t.required_signatories || []).length} signatories</span>
              <span>{(t.required_approvers || []).length} approvers</span>
              <span>{(t.required_uploads || []).length} uploads</span>
            </div>
            {canManage && (
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => openEdit(t)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700">Edit</button>
                <button type="button" onClick={() => toggleActive(t)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700">{t.is_active ? 'Deactivate' : 'Activate'}</button>
                {canDelete && !t.is_system && (
                  <button type="button" onClick={async () => { await deleteDocumentType(t.id); pushToast('Deleted.'); load() }} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700">Delete</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
