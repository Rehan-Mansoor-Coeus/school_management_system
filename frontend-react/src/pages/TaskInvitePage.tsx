import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchTaskInvite, formatTaskError, respondTaskInvite } from '../api/tasks'
import { useToast } from '../components/ui/ToastProvider'

export default function TaskInvitePage() {
  const { token } = useParams<{ token: string }>()
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!token) return
      setLoading(true)
      try {
        setInvite(await fetchTaskInvite(token))
      } catch (error) {
        pushToast(formatTaskError(error, 'Unable to load invite'), 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const respond = async (action: 'accept' | 'decline') => {
    if (!token) return
    try {
      const result = await respondTaskInvite({ token, action })
      if (!result.success) {
        pushToast(result.message || 'Unable to submit response.', 'error')
        return
      }
      pushToast(`Invite ${action === 'accept' ? 'accepted' : 'declined'}.`)
      setInvite(result.data)
    } catch (error) {
      pushToast(formatTaskError(error, 'Unable to respond to invite'), 'error')
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Loading invitation...</p>
        ) : invite ? (
          <>
            <h1 className="text-xl font-bold text-slate-900">Task Invitation</h1>
            <p className="mt-2 text-sm text-slate-600">Task: {invite.task?.title || '-'}</p>
            <p className="mt-1 text-sm text-slate-600">Status: {invite.status || '-'}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => respond('accept')} className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">Accept</button>
              <button type="button" onClick={() => respond('decline')} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Decline</button>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600">Invitation not available or expired.</p>
        )}
      </div>
    </div>
  )
}
