import { useEffect, useState } from 'react'
import { fetchRegistrations, formatHostelError, reviewRegistration } from '../../../api/hostel'
import { useToast } from '../../../components/ui/ToastProvider'
import { useHostelI18n } from '../../../hooks/useHostelI18n'

export default function RegistrationsPage() {
  const { t } = useHostelI18n()
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])
  const [status, setStatus] = useState('')

  const load = () => {
    fetchRegistrations(status ? { status } : undefined)
      .then((res) => setRows(res.data?.data?.data || res.data?.data || []))
      .catch(() => setRows([]))
  }

  useEffect(() => { load() }, [status])

  const review = async (id: number, nextStatus: string) => {
    try {
      await reviewRegistration(id, { status: nextStatus })
      pushToast('Updated.')
      load()
    } catch (err) {
      pushToast(formatHostelError(err, 'Review failed'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-3 py-2 text-sm">
        <option value="">All statuses</option>
        {['pending', 'approved', 'rejected', 'allocated'].map((s) => <option key={s} value={s}>{t(s)}</option>)}
      </select>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('student')}</th>
              <th className="px-4 py-3">{t('registrationNumber')}</th>
              <th className="px-4 py-3">{t('academicYear')}</th>
              <th className="px-4 py-3">{t('preferredHostel')}</th>
              <th className="px-4 py-3">{t('status')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.student?.user?.name}</td>
                <td className="px-4 py-3">{r.student?.registration_number}</td>
                <td className="px-4 py-3">{r.academic_year?.name}</td>
                <td className="px-4 py-3">{r.preferred_hostel?.name || '—'}</td>
                <td className="px-4 py-3">{t(r.status)}</td>
                <td className="px-4 py-3 space-x-2">
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => review(r.id, 'approved')} className="rounded-lg bg-green-50 px-3 py-1 text-green-800">{t('approve')}</button>
                      <button onClick={() => review(r.id, 'rejected')} className="rounded-lg bg-red-50 px-3 py-1 text-red-700">{t('reject')}</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('noRecords')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
