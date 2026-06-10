import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import UploadProgressBar from '../ui/UploadProgressBar'
import { useAcademicInstitution } from '../../context/AcademicInstitutionContext'
import {
  fetchAcademicUnits,
  fetchDepartments,
  fetchInstitutions,
  fetchPrograms,
  fetchSemesters,
  fetchSubjects,
} from '../../api/admin'

type StepKey =
  | 'institutions'
  | 'units'
  | 'departments'
  | 'programs'
  | 'semesters'
  | 'subjects'
  | 'organization'

const STEPS: { key: StepKey; label: string; path: string }[] = [
  { key: 'institutions', label: 'Institutions', path: '/institutions' },
  { key: 'units', label: 'Academic Units', path: '/academics/units' },
  { key: 'departments', label: 'Departments', path: '/departments' },
  { key: 'programs', label: 'Programs', path: '/academics/programmes' },
  { key: 'semesters', label: 'Semesters', path: '/academics/semesters' },
  { key: 'subjects', label: 'Subjects', path: '/academics/subjects' },
  { key: 'organization', label: 'Organization', path: '/academics/organization' },
]

export default function AcademicSetupProgress() {
  const location = useLocation()
  const { institutionId, requiresSelection } = useAcademicInstitution()
  const [counts, setCounts] = useState<Record<StepKey, number>>({
    institutions: 0,
    units: 0,
    departments: 0,
    programs: 0,
    semesters: 0,
    subjects: 0,
    organization: 0,
  })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const instParams = institutionId ? { institution_id: institutionId } : undefined
        const [instRes, unitsRes, deptRes, progRes, semRes, subjRes] = await Promise.all([
          fetchInstitutions({ per_page: 1 }),
          institutionId ? fetchAcademicUnits(instParams) : Promise.resolve({ data: [] }),
          institutionId ? fetchDepartments(instParams) : Promise.resolve({ data: [] }),
          institutionId ? fetchPrograms(instParams) : Promise.resolve({ data: [] }),
          institutionId ? fetchSemesters(instParams) : Promise.resolve({ data: [] }),
          institutionId ? fetchSubjects(instParams) : Promise.resolve({ data: [] }),
        ])

        if (cancelled) return

        const instTotal = instRes.data?.total ?? (instRes.data?.data?.length ?? 0)
        const units = Array.isArray(unitsRes.data) ? unitsRes.data.length : 0
        const departments = Array.isArray(deptRes.data) ? deptRes.data.length : 0
        const programs = Array.isArray(progRes.data) ? progRes.data.length : 0
        const semesters = Array.isArray(semRes.data) ? semRes.data.length : 0
        const subjects = Array.isArray(subjRes.data) ? subjRes.data.length : 0
        const orgReady = units > 0 && departments > 0 && programs > 0 ? 1 : 0

        setCounts({
          institutions: instTotal,
          units,
          departments,
          programs,
          semesters,
          subjects,
          organization: orgReady,
        })
      } catch {
        if (!cancelled) {
          setCounts({
            institutions: 0,
            units: 0,
            departments: 0,
            programs: 0,
            semesters: 0,
            subjects: 0,
            organization: 0,
          })
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [institutionId, location.pathname])

  const completed = useMemo(
    () =>
      STEPS.filter((step) => {
        if (step.key === 'organization') return counts.organization > 0
        return counts[step.key] > 0
      }).length,
    [counts]
  )

  const percent = Math.round((completed / STEPS.length) * 100)
  const currentIndex = STEPS.findIndex((step) => location.pathname.startsWith(step.path))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Academic setup progress</p>
          <p className="text-xs text-slate-500">
            {completed} of {STEPS.length} sections configured
            {requiresSelection && !institutionId ? ' — select an institution to track hierarchy progress' : ''}
          </p>
        </div>
        <span className="text-sm font-semibold text-slate-700">{percent}%</span>
      </div>

      <UploadProgressBar progress={percent} />

      <div className="mt-3 flex flex-wrap gap-2">
        {STEPS.map((step, idx) => {
          const done = step.key === 'organization' ? counts.organization > 0 : counts[step.key] > 0
          const active = idx === currentIndex
          return (
            <span
              key={step.key}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                done
                  ? 'bg-emerald-100 text-emerald-800'
                  : active
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              {done ? '✓ ' : ''}
              {step.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
