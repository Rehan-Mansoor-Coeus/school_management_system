import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCharacterCertificate, fetchCharacterCertificateReference, formatCharacterCertError } from '../../../api/characterCertificates'
import { useCharacterCertificatesI18n } from '../../../hooks/useCharacterCertificatesI18n'
import { useToast } from '../../../components/ui/ToastProvider'

const standings = ['Excellent', 'Good', 'Satisfactory']

export default function CreateCertificatePage() {
  const { t } = useCharacterCertificatesI18n()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [students, setStudents] = useState<any[]>([])
  const [form, setForm] = useState({
    student_id: '', purpose: '', conduct_remarks: '', academic_standing: 'Good', academic_standing_notes: '',
  })

  useEffect(() => {
    fetchCharacterCertificateReference().then((res) => setStudents(res.data?.data?.students || []))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await createCharacterCertificate({ ...form, student_id: Number(form.student_id) })
      pushToast('Certificate request created.')
      navigate(`/character-certificates/${res.data.data.id}`)
    } catch (err) {
      pushToast(formatCharacterCertError(err, 'Unable to create certificate'), 'error')
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
      <div>
        <label className="text-sm font-medium">{t('selectStudent')}</label>
        <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2">
          <option value="">—</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.registration_number})</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">{t('purpose')}</label>
        <input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2" placeholder="e.g. Employment, Further studies" />
      </div>
      <div>
        <label className="text-sm font-medium">{t('conductRemarks')}</label>
        <textarea required value={form.conduct_remarks} onChange={(e) => setForm({ ...form, conduct_remarks: e.target.value })} rows={4} className="mt-1 w-full rounded-xl border px-3 py-2" />
      </div>
      <div>
        <label className="text-sm font-medium">{t('academicStanding')}</label>
        <select value={form.academic_standing} onChange={(e) => setForm({ ...form, academic_standing: e.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2">
          {standings.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">{t('academicNotes')}</label>
        <textarea value={form.academic_standing_notes} onChange={(e) => setForm({ ...form, academic_standing_notes: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border px-3 py-2" />
      </div>
      <button type="submit" className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white">{t('create')}</button>
    </form>
  )
}
