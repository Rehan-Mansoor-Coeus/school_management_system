import { useEffect, useState } from 'react'
import { fetchGeneralSettings, updateGeneralSettings } from '../api/landing'
import { FormField, formInputClass } from '../components/ui/FormField'
import { useToast } from '../components/ui/ToastProvider'

export default function GeneralSettingsPage() {
  const { pushToast } = useToast()
  const [form, setForm] = useState({
    per_student_license_fee: '0',
    per_student_license_currency: 'USD',
    per_student_license_period: 'per_semester',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchGeneralSettings()
      .then((res) => {
        const d = res.data
        setForm({
          per_student_license_fee: String(d.per_student_license_fee ?? d.student_registration_fee ?? 0),
          per_student_license_currency: d.per_student_license_currency || d.registration_fee_currency || 'USD',
          per_student_license_period: d.per_student_license_period || d.registration_fee_period || 'per_semester',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateGeneralSettings({
        per_student_license_fee: Number(form.per_student_license_fee),
        per_student_license_currency: form.per_student_license_currency,
        per_student_license_period: form.per_student_license_period,
      })
      pushToast('Platform settings saved.', 'success')
    } catch {
      pushToast('Unable to save settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">General Settings</h1>
        <p className="text-sm text-slate-500">
          Platform-wide licensing fee shown on the public landing page. Student registration fees are set per institution.
        </p>
      </div>
      <form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <FormField label="Per student license Fee" required>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            className={formInputClass}
            value={form.per_student_license_fee}
            onChange={(e) => setForm({ ...form, per_student_license_fee: e.target.value })}
          />
        </FormField>
        <FormField label="Currency">
          <input
            className={formInputClass}
            value={form.per_student_license_currency}
            onChange={(e) => setForm({ ...form, per_student_license_currency: e.target.value })}
          />
        </FormField>
        <FormField label="Fee Period Label" hint="e.g. per_semester displays as Per Semester">
          <input
            className={formInputClass}
            value={form.per_student_license_period}
            onChange={(e) => setForm({ ...form, per_student_license_period: e.target.value })}
          />
        </FormField>
        <button type="submit" disabled={saving} className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
