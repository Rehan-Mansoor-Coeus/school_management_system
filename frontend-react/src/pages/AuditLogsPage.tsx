import AuditLogsPanel from '../components/AuditLogsPanel'

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">Track every activity carried out in the system.</p>
      </div>
      <AuditLogsPanel />
    </div>
  )
}
