import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchContractTemplates, formatContractError, generateContract } from '../../../api/contracts'
import { useToast } from '../../../components/ui/ToastProvider'

type Template = { id: number; name: string; recipient_type: string }

export default function GenerateContractPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [form, setForm] = useState({
    template_id: '',
    user_id: '',
    student_id: '',
    hr_staff_profile_id: '',
    recipient_name: '',
    recipient_email: '',
    recipient_phone: '',
    start_date: '',
    end_date: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchContractTemplates().then((items) => setTemplates(items as Template[])).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.template_id) {
      pushToast('Select a template.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        template_id: Number(form.template_id),
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      }
      if (form.user_id) payload.user_id = Number(form.user_id)
      if (form.student_id) payload.student_id = Number(form.student_id)
      if (form.hr_staff_profile_id) payload.hr_staff_profile_id = Number(form.hr_staff_profile_id)
      if (form.recipient_name) payload.recipient_name = form.recipient_name
      if (form.recipient_email) payload.recipient_email = form.recipient_email
      if (form.recipient_phone) payload.recipient_phone = form.recipient_phone

      const contract = await generateContract(payload)
      pushToast('Contract generated.')
      navigate(`/contracts/list/${(contract as { id: number }).id}`)
    } catch (error) {
      pushToast(formatContractError(error, 'Failed to generate contract'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Template</label>
        <select
          required
          value={form.template_id}
          onChange={(e) => setForm({ ...form, template_id: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Select template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.recipient_type})</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-slate-600">User ID</label>
          <input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">Student ID</label>
          <input value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">HR Staff Profile ID</label>
          <input value={form.hr_staff_profile_id} onChange={(e) => setForm({ ...form, hr_staff_profile_id: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <input placeholder="Recipient name (manual)" value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input placeholder="Recipient email" type="email" value={form.recipient_email} onChange={(e) => setForm({ ...form, recipient_email: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input placeholder="Recipient phone" value={form.recipient_phone} onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      <p className="text-xs text-slate-500">Provide a user, student, or HR staff profile ID to auto-populate merge fields from existing records.</p>

      <button type="submit" disabled={submitting} className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {submitting ? 'Generating…' : 'Generate Contract'}
      </button>
    </form>
  )
}
