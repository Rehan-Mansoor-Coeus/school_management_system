import { useEffect, useState } from 'react'
import { fetchPendingTaskAcceptances, formatTaskError, respondTaskInvite } from '../../../api/tasks'
import { useToast } from '../../../components/ui/ToastProvider'

export default function PendingAcceptancesPage() {
  const { pushToast } = useToast()
  const [rows, setRows] = useState<any[]>([])

  const load = async () => {
    try {
      setRows(await fetchPendingTaskAcceptances())
    } catch (error) {
      pushToast(formatTaskError(error, 'Failed to load pending acceptances'), 'error')
    }
  }

  useEffect(() => { load() }, [])

  const respond = async (token: string, action: 'accept' | 'decline') => {
    try {
      const response = await respondTaskInvite({ token, action })
      if (!response.success) {
        pushToast(response.message || 'Unable to submit response.', 'error')
        return
      }
      pushToast(`Task ${action === 'accept' ? 'accepted' : 'declined'}.`)
      load()
    } catch (error) {
      pushToast(formatTaskError(error, 'Unable to respond to task invite'), 'error')
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Task</th>
            <th className="px-4 py-3 font-semibold">Assignee</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No pending invitations.</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100">
              <td className="px-4 py-3">{row.task?.title || row.title || '-'}</td>
              <td className="px-4 py-3">{row.user?.name || row.assignee_name || '-'}</td>
              <td className="px-4 py-3">{row.status || '-'}</td>
              <td className="px-4 py-3">
                {row.invite_token ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => respond(String(row.invite_token), 'accept')} className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">Accept</button>
                    <button type="button" onClick={() => respond(String(row.invite_token), 'decline')} className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700">Decline</button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">Invite token unavailable</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
