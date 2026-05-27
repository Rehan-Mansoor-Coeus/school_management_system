import { useEffect, useState } from 'react'
import { fetchEntryApprovals, reviewTimesheetEntry } from '../api/timesheets'
import { useToast } from '../components/ui/ToastProvider'

export default function TimesheetApprovalsPage() {
  const [teachingItems, setTeachingItems] = useState<any[]>([])
  const [staffItems, setStaffItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { pushToast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchEntryApprovals()
      setTeachingItems(res.data?.teaching || [])
      setStaffItems(res.data?.staff || [])
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load approvals', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const doAction = async (entryId: number, timesheetType: 'teaching' | 'staff', action: 'approve' | 'reject' | 'request_correction') => {
    try {
      let comment = ''
      if (action !== 'approve') {
        const reason = window.prompt('Reason for rejection?')
        if (!reason) return
        comment = reason
      }
      await reviewTimesheetEntry({ timesheet_type: timesheetType, entry_id: entryId, action, comment })
      pushToast('Review action completed.')
      load()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Action failed', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Timesheet Approvals</h2>
        <p className="text-sm text-slate-500">Approve, reject, or request corrections for submitted timesheets.</p>
      </div>
      <div className="space-y-3">
        {loading ? <div className="text-sm text-slate-500">Loading...</div> : null}
        {!loading && teachingItems.length === 0 && staffItems.length === 0 ? <div className="text-sm text-slate-500">No pending items.</div> : null}
        {teachingItems.map((item) => (
          <ApprovalCard key={`te-${item.id}`} title={`Teaching • ${item.schedule?.course?.name || 'Course'} • ${item.date}`} subtitle={`Teacher: ${item.teacher_id}`} onAction={(action) => doAction(item.id, 'teaching', action)} />
        ))}
        {staffItems.map((item) => (
          <ApprovalCard key={`st-${item.id}`} title={`Staff • ${item.date}`} subtitle={`Staff ID: ${item.staff_id}`} onAction={(action) => doAction(item.id, 'staff', action)} />
        ))}
      </div>
    </div>
  )
}

function ApprovalCard({ title, subtitle, onAction }: { title: string; subtitle: string; onAction: (action: 'approve' | 'reject' | 'request_correction') => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onAction('approve')} className="rounded-xl bg-emerald-600 px-3 py-1 text-white">Approve</button>
          <button onClick={() => onAction('reject')} className="rounded-xl bg-rose-600 px-3 py-1 text-white">Reject</button>
          <button onClick={() => onAction('request_correction')} className="rounded-xl bg-amber-500 px-3 py-1 text-white">Request Correction</button>
        </div>
      </div>
    </div>
  )
}
