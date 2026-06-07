import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import api from '../../../api/client'
import {
  fetchCharacterCertificate, financeClearance, issueCharacterCertificate,
  libraryClearance, updateCharacterCertificate, voidCharacterCertificate, formatCharacterCertError,
} from '../../../api/characterCertificates'
import { useCharacterCertificatesI18n } from '../../../hooks/useCharacterCertificatesI18n'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../components/ui/ToastProvider'

async function openPdf(id: number) {
  const res = await api.get(`/character-certificates/${id}/pdf`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  window.open(url, '_blank')
}

export default function CertificateDetailPage() {
  const { id } = useParams()
  const { t } = useCharacterCertificatesI18n()
  const { canAccess } = useAuth()
  const { pushToast } = useToast()
  const [cert, setCert] = useState<any>(null)
  const [financeNotes, setFinanceNotes] = useState('')
  const [libraryNotes, setLibraryNotes] = useState('')

  const load = () => {
    fetchCharacterCertificate(Number(id)).then((res) => {
      setCert(res.data.data)
      setFinanceNotes(res.data.data.finance_clearance_notes || '')
      setLibraryNotes(res.data.data.library_clearance_notes || '')
    })
  }

  useEffect(() => { load() }, [id])

  if (!cert) return <p className="text-slate-500">{t('loading')}</p>

  const canFinance = canAccess({ permissions: ['character_certificates.finance_clear', 'character_certificates.manage'] })
  const canLibrary = canAccess({ permissions: ['character_certificates.library_clear', 'character_certificates.manage'] })
  const canIssue = canAccess({ permissions: ['character_certificates.issue', 'character_certificates.manage'] })

  const saveDetails = async () => {
    try {
      await updateCharacterCertificate(cert.id, {
        purpose: cert.purpose,
        conduct_remarks: cert.conduct_remarks,
        academic_standing: cert.academic_standing,
        academic_standing_notes: cert.academic_standing_notes,
      })
      pushToast('Saved.')
      load()
    } catch (err) {
      pushToast(formatCharacterCertError(err, 'Save failed'), 'error')
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/character-certificates" className="text-sm text-[#1e3a5f] hover:underline">{t('backToList')}</Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="font-semibold text-[#1e3a5f]">{cert.certificate_number}</h2>
          <p><strong>{t('student')}:</strong> {cert.student?.user?.name} ({cert.student?.registration_number})</p>
          <p><strong>{t('programme')}:</strong> {cert.student?.programme?.name || '—'}</p>
          <p><strong>{t('status')}:</strong> {cert.status}</p>

          {cert.status !== 'issued' && (
            <>
              <input value={cert.purpose || ''} onChange={(e) => setCert({ ...cert, purpose: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder={t('purpose')} />
              <textarea value={cert.conduct_remarks || ''} onChange={(e) => setCert({ ...cert, conduct_remarks: e.target.value })} rows={3} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder={t('conductRemarks')} />
              <input value={cert.academic_standing || ''} onChange={(e) => setCert({ ...cert, academic_standing: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder={t('academicStanding')} />
              <textarea value={cert.academic_standing_notes || ''} onChange={(e) => setCert({ ...cert, academic_standing_notes: e.target.value })} rows={2} className="w-full rounded-xl border px-3 py-2 text-sm" placeholder={t('academicNotes')} />
              <button type="button" onClick={saveDetails} className="rounded-xl bg-slate-800 px-4 py-2 text-sm text-white">{t('save')}</button>
            </>
          )}

          {cert.status === 'issued' && (
            <>
              <p className="text-sm">{cert.conduct_remarks}</p>
              <p className="text-sm"><strong>{t('academicStanding')}:</strong> {cert.academic_standing}</p>
              <button type="button" onClick={() => openPdf(cert.id)} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('viewPdf')}</button>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">{t('financeClearance')}</h3>
            <p className="mb-2 text-sm">{cert.finance_cleared ? t('cleared') : t('notCleared')}</p>
            {canFinance && cert.status !== 'issued' && (
              <>
                <textarea value={financeNotes} onChange={(e) => setFinanceNotes(e.target.value)} rows={2} className="mb-2 w-full rounded-xl border px-3 py-2 text-sm" placeholder={t('clearanceNotes')} />
                <button type="button" onClick={async () => { await financeClearance(cert.id, { cleared: true, notes: financeNotes }); load() }} className="mr-2 rounded-lg bg-emerald-100 px-3 py-1 text-sm text-emerald-800">{t('cleared')}</button>
                <button type="button" onClick={async () => { await financeClearance(cert.id, { cleared: false, notes: financeNotes }); load() }} className="rounded-lg bg-rose-100 px-3 py-1 text-sm text-rose-800">{t('notCleared')}</button>
              </>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">{t('libraryClearance')}</h3>
            <p className="mb-2 text-sm">{cert.library_cleared ? t('cleared') : t('notCleared')}</p>
            {canLibrary && cert.status !== 'issued' && (
              <>
                <textarea value={libraryNotes} onChange={(e) => setLibraryNotes(e.target.value)} rows={2} className="mb-2 w-full rounded-xl border px-3 py-2 text-sm" placeholder={t('clearanceNotes')} />
                <button type="button" onClick={async () => { await libraryClearance(cert.id, { cleared: true, notes: libraryNotes }); load() }} className="mr-2 rounded-lg bg-emerald-100 px-3 py-1 text-sm text-emerald-800">{t('cleared')}</button>
                <button type="button" onClick={async () => { await libraryClearance(cert.id, { cleared: false, notes: libraryNotes }); load() }} className="rounded-lg bg-rose-100 px-3 py-1 text-sm text-rose-800">{t('notCleared')}</button>
              </>
            )}
          </div>

          {canIssue && cert.status !== 'issued' && cert.status !== 'void' && (
            <div className="rounded-2xl border border-[#1e3a5f]/20 bg-slate-50 p-5">
              <p className="mb-3 text-sm text-slate-600">{t('readyHint')}</p>
              <button type="button" onClick={async () => {
                try {
                  await issueCharacterCertificate(cert.id)
                  pushToast('Certificate issued.')
                  load()
                } catch (err) {
                  pushToast(formatCharacterCertError(err, 'Issue failed'), 'error')
                }
              }} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">{t('issueCertificate')}</button>
            </div>
          )}

          {canIssue && cert.status !== 'void' && cert.status !== 'issued' && (
            <button type="button" onClick={async () => { await voidCharacterCertificate(cert.id); load() }} className="text-sm text-rose-600 hover:underline">{t('voidCertificate')}</button>
          )}
        </div>
      </div>
    </div>
  )
}
