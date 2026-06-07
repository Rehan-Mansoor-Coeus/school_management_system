import { useEffect, useState } from 'react'
import api from '../../../api/client'
import { fetchMyCharacterCertificates } from '../../../api/characterCertificates'
import { useCharacterCertificatesI18n } from '../../../hooks/useCharacterCertificatesI18n'

async function openPdf(id: number) {
  const res = await api.get(`/character-certificates/${id}/pdf`, { responseType: 'blob' })
  window.open(URL.createObjectURL(res.data), '_blank')
}

export default function MyCertificatesPage() {
  const { t } = useCharacterCertificatesI18n()
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    fetchMyCharacterCertificates().then((res) => setItems(res.data?.data || [])).catch(() => setItems([]))
  }, [])

  return (
    <div className="space-y-4">
      {items.map((cert) => (
        <div key={cert.id} className="rounded-2xl border bg-white p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-[#1e3a5f]">{cert.certificate_number}</div>
            <div className="text-sm text-slate-500">{cert.purpose || '—'} · {cert.status}</div>
            {cert.issued_at && <div className="text-xs text-slate-400">{t('issuedAt')}: {new Date(cert.issued_at).toLocaleDateString()}</div>}
          </div>
          {cert.status === 'issued' && (
            <button type="button" onClick={() => openPdf(cert.id)} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm text-white">{t('viewPdf')}</button>
          )}
        </div>
      ))}
      {!items.length && <p className="text-slate-500">{t('noRecords')}</p>}
    </div>
  )
}
