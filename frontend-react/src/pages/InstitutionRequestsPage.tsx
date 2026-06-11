import { useEffect, useState } from 'react'
import { approveInstitutionRequest, fetchInstitutionRequests, rejectInstitutionRequest } from '../api/landing'
import { useToast } from '../components/ui/ToastProvider'

type RequestRow = {
  id: number
  institution_name: string
  contact_person: string
  email: string
  phone: string
  status: string
  created_at: string
}

export default function InstitutionRequestsPage() {
  const { pushToast } = useToast()
  const [items, setItems] = useState<RequestRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetchInstitutionRequests({ status: 'pending' })
      setItems(res.data?.data || res.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function approve(id: number) {
    await approveInstitutionRequest(id)
    pushToast('Request approved.')
    load()
  }

  async function reject(id: number) {
    await rejectInstitutionRequest(id)
    pushToast('Request rejected.')
    load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Institution Registration Requests</h1>
        <p className="text-sm text-slate-500">Review and approve institution onboarding requests from the landing page.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Institution</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Loading…</td></tr> : items.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-4 py-3 font-medium">{row.institution_name}</td>
                <td className="px-4 py-3">{row.contact_person}<br /><span className="text-slate-500">{row.email}</span></td>
                <td className="px-4 py-3 capitalize">{row.status}</td>
                <td className="px-4 py-3">
                  <button className="mr-2 rounded-lg bg-emerald-100 px-3 py-1 text-emerald-800" onClick={() => approve(row.id)}>Approve</button>
                  <button className="rounded-lg bg-rose-100 px-3 py-1 text-rose-800" onClick={() => reject(row.id)}>Reject</button>
                </td>
              </tr>
            ))}
            {!loading && !items.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No pending requests.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
