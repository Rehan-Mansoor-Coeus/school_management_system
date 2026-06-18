import { useEffect, useState } from 'react'
import { fetchStudentReport, searchStudentReports, type StudentReport, type StudentReportSummary } from '../../../api/reports'
import { formInputClass } from '../../../components/ui/FormField'
import { useToast } from '../../../components/ui/ToastProvider'

function InfoCard({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value || '—'}</p>
    </div>
  )
}

export default function StudentReportPage() {
  const { pushToast } = useToast()
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState<StudentReportSummary[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [report, setReport] = useState<StudentReport | null>(null)
  const [loading, setLoading] = useState(false)

  const search = async () => {
    setLoading(true)
    try {
      setStudents(await searchStudentReports(query))
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to search students', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    search()
  }, [])

  const loadReport = async (studentId: number) => {
    setSelectedId(studentId)
    setLoading(true)
    try {
      setReport(await fetchStudentReport(studentId))
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load student report', 'error')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }

  const student = report?.student as Record<string, any> | undefined
  const application = report?.application as Record<string, any> | null | undefined
  const programme = student?.programme as Record<string, any> | undefined

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          search()
        }}
        className="flex flex-wrap gap-3"
      >
        <input
          className={`${formInputClass} min-w-[260px]`}
          placeholder="Search by name, email, or registration number…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Students</div>
          <div className="max-h-[520px] overflow-y-auto">
            {loading && !students.length ? <p className="p-4 text-sm text-slate-500">Loading…</p> : null}
            {students.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => loadReport(row.id)}
                className={`block w-full border-b border-slate-100 px-4 py-3 text-left text-sm transition hover:bg-slate-50 ${
                  selectedId === row.id ? 'bg-[#1e3a5f]/5' : ''
                }`}
              >
                <p className="font-semibold text-slate-900">{row.user?.name || row.registration_number}</p>
                <p className="text-xs text-slate-500">{row.registration_number} · {row.programme?.name || 'No programme'}</p>
              </button>
            ))}
            {!loading && students.length === 0 ? <p className="p-4 text-sm text-slate-500">No students found.</p> : null}
          </div>
        </div>

        <div className="space-y-6">
          {!report ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Select a student to view their full report.
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-[#1e3a5f]">{student?.name}</h2>
                <p className="text-sm text-slate-500">{student?.registration_number} · {programme?.name}</p>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Application & Admission</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoCard label="Date of Application" value={application?.applied_at} />
                  <InfoCard label="Application Accepted" value={application?.accepted_at} />
                  <InfoCard label="Date Approved" value={application?.approved_at} />
                  <InfoCard label="Date of Admission" value={application?.admitted_at || student?.admission_date} />
                  <InfoCard label="Application Status" value={application?.status} />
                  <InfoCard label="Application Number" value={application?.application_number} />
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Fees</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoCard label="Total Billed" value={report.fees.total_billed} />
                  <InfoCard label="Total Paid" value={report.fees.total_paid} />
                  <InfoCard label="Total Owing" value={report.fees.total_owing} />
                  <InfoCard label="Application Payments" value={report.fees.application_payments} />
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Registered Subjects</div>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.registered_subjects as any[]).length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">No registered subjects.</td></tr>
                    ) : (report.registered_subjects as any[]).map((row) => (
                      <tr key={row.id} className="border-b border-slate-100">
                        <td className="px-4 py-3">{row.subject?.name || row.course?.name || '—'}</td>
                        <td className="px-4 py-3">{row.subject?.code || row.course?.code || '—'}</td>
                        <td className="px-4 py-3">{row.status || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Results & Marks</div>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">CA</th>
                      <th className="px-4 py-3">Exam</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.results as any[]).length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No results recorded yet.</td></tr>
                    ) : (report.results as any[]).map((row) => (
                      <tr key={row.id} className="border-b border-slate-100">
                        <td className="px-4 py-3">{row.course?.name || '—'}</td>
                        <td className="px-4 py-3">{row.continuous_assessment ?? '—'}</td>
                        <td className="px-4 py-3">{row.exam_score ?? '—'}</td>
                        <td className="px-4 py-3">{row.total_score ?? '—'}</td>
                        <td className="px-4 py-3">{row.grade ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
