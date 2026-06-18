import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Building2, Search, GraduationCap, BookOpen, CheckCircle2, ChevronRight } from 'lucide-react'
import { fetchPublicInstitution, fetchPublicInstitutions, fetchPublicProgrammeCourses, type PublicInstitutionSummary } from '../../api/landing'
import { LandingPageHeader } from '../LandingShell'
import { formInputClass } from '../../components/ui/FormField'

type ProgrammeCourse = {
  id: number
  name: string
  code?: string
  description?: string
  is_required?: boolean
  semester?: { semester_number?: number; level_number?: number } | null
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const preselected = searchParams.get('institution')
  const preselectedProgramme = searchParams.get('programme')
  const [search, setSearch] = useState('')
  const [institutions, setInstitutions] = useState<PublicInstitutionSummary[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(preselected ? Number(preselected) : null)
  const [detail, setDetail] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expandedProgrammeId, setExpandedProgrammeId] = useState<number | null>(preselectedProgramme ? Number(preselectedProgramme) : null)
  const [programmeCourses, setProgrammeCourses] = useState<ProgrammeCourse[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchPublicInstitutions({ search, per_page: 50 })
      .then((res) => setInstitutions(res.data?.data || res.data || []))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    fetchPublicInstitution(selectedId).then((res) => setDetail(res.data)).catch(() => setDetail(null))
  }, [selectedId])

  useEffect(() => {
    if (!selectedId || !expandedProgrammeId) {
      setProgrammeCourses([])
      return
    }
    setCoursesLoading(true)
    fetchPublicProgrammeCourses(selectedId, expandedProgrammeId)
      .then((res) => setProgrammeCourses(res.data?.courses || []))
      .catch(() => setProgrammeCourses([]))
      .finally(() => setCoursesLoading(false))
  }, [selectedId, expandedProgrammeId])

  const applyUrl = (programmeId: number) =>
    `/admin?redirect=${encodeURIComponent(`/admissions/apply?programme=${programmeId}`)}`

  return (
    <div>
      <LandingPageHeader
        title="Register as Student"
        subtitle="Select your institution, review programmes and fees, then apply through Admissions after signing in."
      />

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-slate-800">Select Institution</label>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search institution…"
              className={`${formInputClass} pl-10`}
            />
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {loading ? <p className="p-4 text-sm text-slate-500">Loading…</p> : institutions.map((inst) => (
              <button
                key={inst.id}
                type="button"
                onClick={() => {
                  setSelectedId(inst.id)
                  setExpandedProgrammeId(null)
                }}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                  selectedId === inst.id ? 'border-[#1e3a5f] bg-[#1e3a5f]/5' : 'border-transparent hover:bg-slate-50'
                }`}
              >
                {inst.logo_url ? (
                  <img src={inst.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f]"><Building2 className="h-5 w-5" /></div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">{inst.name}</p>
                  <p className="text-xs text-slate-500">{[inst.city, inst.country].filter(Boolean).join(', ') || inst.code}</p>
                </div>
              </button>
            ))}
            {!loading && !institutions.length && <p className="p-4 text-sm text-slate-500">No institutions found.</p>}
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selectedId || !detail ? (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Select an institution to view registration details.
            </div>
          ) : (
            <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                {detail.institution.logo_url ? (
                  <img src={detail.institution.logo_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1e3a5f] text-2xl font-bold text-[#f0c14b]">A</div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-[#1e3a5f]">{detail.institution.name}</h2>
                  <p className="text-sm text-slate-500">{detail.institution.description || 'Educational institution on ASSMS'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-800">Registration Fee</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-900">
                    {detail.registration_fee?.currency} {detail.registration_fee?.amount ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-800">Programmes</p>
                  <p className="mt-1 text-2xl font-bold text-blue-900">{detail.programmes?.length || 0}</p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><GraduationCap className="h-4 w-4" /> Available Programmes</h3>
                <p className="mb-3 text-sm text-slate-500">Click a programme to view its courses and apply.</p>
                <ul className="space-y-2">
                  {(detail.programmes || []).map((p: any) => {
                    const isExpanded = expandedProgrammeId === p.id
                    return (
                      <li key={p.id} className="overflow-hidden rounded-xl border border-slate-100">
                        <button
                          type="button"
                          onClick={() => setExpandedProgrammeId(isExpanded ? null : p.id)}
                          className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition hover:bg-slate-50 ${
                            isExpanded ? 'bg-[#1e3a5f]/5' : ''
                          }`}
                        >
                          <span>
                            <span className="font-medium text-[#1e3a5f]">{p.name}</span>
                            {p.code ? <span className="text-slate-500"> · {p.code}</span> : null}
                          </span>
                          <ChevronRight className={`h-4 w-4 text-slate-400 transition ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50 px-3 py-3">
                            {coursesLoading ? (
                              <p className="text-sm text-slate-500">Loading courses…</p>
                            ) : programmeCourses.length ? (
                              <div className="mb-3 flex flex-wrap gap-2">
                                {programmeCourses.map((course) => (
                                  <span key={course.id} className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 shadow-sm">
                                    {course.name}{course.code ? ` (${course.code})` : ''}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="mb-3 text-sm text-slate-500">No courses listed for this programme yet.</p>
                            )}
                            <Link
                              to={applyUrl(p.id)}
                              className="inline-flex items-center rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#162d4a]"
                            >
                              Apply for {p.name}
                            </Link>
                          </div>
                        )}
                      </li>
                    )
                  })}
                  {!detail.programmes?.length && <li className="text-sm text-slate-500">Contact the institution for programme details.</li>}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><BookOpen className="h-4 w-4" /> All Institution Courses</h3>
                <div className="flex flex-wrap gap-2">
                  {(detail.courses || []).slice(0, 12).map((c: any) => (
                    <span key={c.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{c.name}</span>
                  ))}
                  {!detail.courses?.length && <span className="text-sm text-slate-500">Courses listed after enrollment.</span>}
                </div>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-slate-900"><CheckCircle2 className="h-4 w-4" /> Admission Requirements</h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  {(detail.admission_requirements || []).map((req: string) => <li key={req}>{req}</li>)}
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Students must apply through Admissions, pay the registration fee, and await approval before receiving login credentials.
              </div>

              <Link
                to={expandedProgrammeId ? applyUrl(expandedProgrammeId) : `/admin?redirect=${encodeURIComponent('/admissions/apply')}`}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#1e3a5f] px-5 py-3 text-sm font-semibold text-white hover:bg-[#162d4a] sm:w-auto"
              >
                Sign in to Apply
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
