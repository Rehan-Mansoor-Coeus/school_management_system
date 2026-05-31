import { useEffect, useState } from 'react'
import { fetchMessageLogs } from '../../api/letters'
import { LettersCard, LettersPageHeader, StatusBadge, TextInput } from '../../components/letters/LettersUi'

export default function MessageLogsPage() {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [module, setModule] = useState('')
  const [status, setStatus] = useState('')

  async function load() {
    const res = await fetchMessageLogs({
      search: search || undefined,
      module: module || undefined,
      status: status || undefined,
      per_page: 50,
    })
    setItems(res.data?.data || [])
  }

  useEffect(() => {
    load().catch(() => setItems([]))
  }, [search, module, status])

  return (
    <div className="space-y-6">
      <LettersPageHeader
        title="Message Logs"
        subtitle="WhatsApp delivery history for letters and announcements."
      />

      <LettersCard>
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <TextInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipient, phone, message..." />
          <select value={module} onChange={e => setModule(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            <option value="">All modules</option>
            <option value="letter">Letters</option>
            <option value="announcement">Announcements</option>
            <option value="otp">OTP</option>
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
            <option value="">All statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-3 pr-4">Recipient</th>
                <th className="py-3 pr-4">Phone</th>
                <th className="py-3 pr-4">Module</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Sent At</th>
                <th className="py-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b align-top">
                  <td className="py-3 pr-4 font-medium">{item.recipient_name || '—'}</td>
                  <td className="py-3 pr-4">{item.phone_number || '—'}</td>
                  <td className="py-3 pr-4 capitalize">{item.module || '—'}</td>
                  <td className="py-3 pr-4 capitalize">{item.message_type || '—'}</td>
                  <td className="py-3 pr-4"><StatusBadge status={item.status} /></td>
                  <td className="py-3 pr-4">{item.sent_at ? new Date(item.sent_at).toLocaleString() : '—'}</td>
                  <td className="py-3 text-xs text-rose-700">{item.error_message || '—'}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">No message logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </LettersCard>
    </div>
  )
}
