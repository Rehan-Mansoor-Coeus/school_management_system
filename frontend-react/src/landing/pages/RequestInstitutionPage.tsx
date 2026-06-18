import { useState } from 'react'
import { submitInstitutionRequest } from '../../api/landing'
import { LandingPageHeader } from '../LandingShell'
import { FormField, formInputClass } from '../../components/ui/FormField'

export default function RequestInstitutionPage() {
  const [form, setForm] = useState({
    institution_name: '', country: '', city: '', contact_person: '', phone: '', email: '', student_population: '', website: '', message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await submitInstitutionRequest({
        ...form,
        student_population: form.student_population ? Number(form.student_population) : undefined,
      })
      setDone(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h1 className="text-2xl font-bold text-emerald-900">Request Submitted</h1>
        <p className="mt-3 text-emerald-800">Our team will review your institution registration request and contact you. Approval is manual — not automatic.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <LandingPageHeader
        title="Request Institution Registration"
        subtitle="Submit your institution for review. Alpha Bridge will contact you after approval."
      />
      {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <form onSubmit={submit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <FormField label="Institution Name" required><input required className={formInputClass} value={form.institution_name} onChange={(e) => setForm({ ...form, institution_name: e.target.value })} /></FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Country"><input className={formInputClass} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></FormField>
          <FormField label="City"><input className={formInputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></FormField>
        </div>
        <FormField label="Contact Person" required><input required className={formInputClass} value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Phone" required><input required className={formInputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></FormField>
          <FormField label="Email" required><input required type="email" className={formInputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Student Population"><input type="number" min="1" className={formInputClass} value={form.student_population} onChange={(e) => setForm({ ...form, student_population: e.target.value })} /></FormField>
          <FormField label="Website"><input className={formInputClass} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></FormField>
        </div>
        <FormField label="Message"><textarea rows={4} className={formInputClass} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></FormField>
        <button type="submit" disabled={submitting} className="w-full rounded-xl bg-[#1e3a5f] py-3 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-60">
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}
