import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCharacterCertificates } from '../../../api/characterCertificates'
import { useCharacterCertificatesI18n } from '../../../hooks/useCharacterCertificatesI18n'

export default function CertificatesListPage() {
  const { t } = useCharacterCertificatesI18n()
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetchCharacterCertificates({ search: search || undefined, status: status || undefined })
      .then((res) => setItems(res.data?.data?.data || res.data?.data || []))
      .catch(() => setItems([]))
  }, [search, status])

  const statusLabel = (value: string) => {
    const map: Record<string, string> = { draft: t('draft'), pending: t('pending'), issued: t('issued'), void: t('void') }
    return map[value] || value
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} className="rounded-xl border px-3 py-2 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="draft">{t('draft')}</option>
          <option value="pending">{t('pending')}</option>
          <option value="issued">{t('issued')}</option>
          <option value="void">{t('void')}</option>
        </select>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('certificateNumber')}</th>
              <th className="px-4 py-3">{t('student')}</th>
              <th className="px-4 py-3">{t('status')}</th>
              <th className="px-4 py-3">{t('financeClearance')}</th>
              <th className="px-4 py-3">{t('libraryClearance')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3 font-mono text-xs">{row.certificate_number}</td>
                <td className="px-4 py-3">{row.student?.user?.name}<br /><span className="text-xs text-slate-500">{row.student?.registration_number}</span></td>
                <td className="px-4 py-3 capitalize">{statusLabel(row.status)}</td>
                <td className="px-4 py-3">{row.finance_cleared ? t('cleared') : t('notCleared')}</td>
                <td className="px-4 py-3">{row.library_cleared ? t('cleared') : t('notCleared')}</td>
                <td className="px-4 py-3"><Link to={`/character-certificates/${row.id}`} className="text-[#1e3a5f] hover:underline">View</Link></td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('noRecords')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
