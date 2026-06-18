import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Search } from 'lucide-react'
import { fetchPublicInstitutions, type PublicInstitutionSummary } from '../../api/landing'
import { LandingPageHeader } from '../LandingShell'
import { formInputClass } from '../../components/ui/FormField'

export default function PublicInstitutionsPage() {
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<PublicInstitutionSummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchPublicInstitutions({ search, per_page: 100 })
      .then((res) => setItems(res.data?.data || res.data || []))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div>
      <LandingPageHeader title="Institutions" subtitle="Browse institutions registered on ASSMS." />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className={`${formInputClass} pl-10`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? <p className="text-slate-500">Loading…</p> : items.map((inst) => (
          <Link
            key={inst.id}
            to={`/register?institution=${inst.id}`}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              {inst.logo_url ? (
                <img src={inst.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e3a5f]/10 text-[#1e3a5f]"><Building2 className="h-6 w-6" /></div>
              )}
              <div>
                <p className="font-semibold text-slate-900">{inst.name}</p>
                <p className="text-xs text-slate-500">{inst.city || inst.code}</p>
              </div>
            </div>
            {inst.registration_fee ? (
              <p className="mt-3 text-sm text-slate-600">
                Registration: {inst.registration_fee.currency} {inst.registration_fee.amount}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  )
}
