import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/ToastProvider'
import { useAuth } from '../context/AuthContext'
import { useFormatMoney } from '../hooks/useFormatMoney'
import {
  assignSemesterSubject,
  createProgram,
  createSubject,
  deleteProgram,
  deleteSemesterSubject,
  deleteSubject,
  fetchDepartments,
  fetchPrograms,
  fetchSubjects,
  updateProgram,
  updateSemester,
  updateSemesterSubject,
  updateSubject,
} from '../api/admin'

const programmeLevels = [
  { value: 'certificate', label: 'Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'degree', label: 'Degree' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
  { value: 'crash_course', label: 'Crash Course' },
  { value: 'other', label: 'Other' },
]

interface Department {
  id: number
  name: string
  code?: string
  institution_id?: number
}

interface ProgrammeSemesterSubject {
  id: number
  programme_semester_id: number
  subject_id: number
  contact_hours: number
  is_active: boolean
  subject: Subject
}

interface ProgrammeSemester {
  id: number
  programme_id: number
  semester_number: number
  name: string
  is_active: boolean
  assignments: ProgrammeSemesterSubject[]
}

interface Programme {
  id: number
  name: string
  code: string
  description?: string
  duration_years: number
  level: string
  semester_count: number
  tuition_fee?: number
  application_fee?: number
  is_active: boolean
  department_id: number
  department?: Department
  semesters: ProgrammeSemester[]
}

interface Subject {
  id: number
  name: string
  code: string
  description?: string
  default_contact_hours: number
  is_active: boolean
}

const initialProgrammeForm = {
  name: '',
  code: '',
  description: '',
  duration_years: 1,
  level: 'degree',
  semester_count: 2,
  tuition_fee: 0,
  application_fee: 0,
  department_id: undefined as number | undefined,
  is_active: true,
}

const initialSubjectForm = {
  name: '',
  code: '',
  description: '',
  default_contact_hours: 0,
  is_active: true,
}

const initialAssignmentForm = {
  programme_semester_id: undefined as number | undefined,
  subject_id: undefined as number | undefined,
  contact_hours: 0,
  is_active: true,
}

export default function AcademicsPage({ initialTab = 'programmes' }: { initialTab?: 'programmes' | 'subjects' }) {
  const { user } = useAuth()
  const { formatMoney } = useFormatMoney()
  const { pushToast } = useToast()

  const [activeTab, setActiveTab] = useState<'programmes' | 'subjects'>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])
  const [loading, setLoading] = useState(false)
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [search, setSearch] = useState('')

  const [programmeModalOpen, setProgrammeModalOpen] = useState(false)
  const [subjectModalOpen, setSubjectModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)

  const [activeProgramme, setActiveProgramme] = useState<Programme | null>(null)
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<ProgrammeSemesterSubject | null>(null)
  const [programmeForm, setProgrammeForm] = useState(initialProgrammeForm)
  const [subjectForm, setSubjectForm] = useState(initialSubjectForm)
  const [assignmentForm, setAssignmentForm] = useState(initialAssignmentForm)
  const [semesterNameUpdates, setSemesterNameUpdates] = useState<Record<number, string>>({})

  useEffect(() => {
    loadPageData()
  }, [])

  const loadPageData = async () => {
    setLoading(true)
    try {
      const [programmesRes, subjectsRes, departmentsRes] = await Promise.all([
        fetchPrograms({ search }),
        fetchSubjects({ search }),
        fetchDepartments(),
      ])
      setProgrammes(programmesRes.data)
      setSubjects(subjectsRes.data)
      setDepartments(departmentsRes.data)
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load academic data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadProgrammes = async () => {
    setLoading(true)
    try {
      const response = await fetchPrograms({ search })
      setProgrammes(response.data)
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load programmes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    setLoading(true)
    try {
      const response = await fetchSubjects({ search })
      setSubjects(response.data)
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Failed to load subjects', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openCreateProgrammeModal = () => {
    setSelectedProgramme(null)
    setProgrammeForm({
      ...initialProgrammeForm,
      department_id: departments[0]?.id,
    })
    setProgrammeModalOpen(true)
  }

  const openEditProgrammeModal = (programme: Programme) => {
    setSelectedProgramme(programme)
    setProgrammeForm({
      name: programme.name,
      code: programme.code,
      description: programme.description || '',
      duration_years: programme.duration_years,
      level: programme.level,
      semester_count: programme.semester_count,
      tuition_fee: programme.tuition_fee ?? 0,
      application_fee: programme.application_fee ?? 0,
      department_id: programme.department_id,
      is_active: programme.is_active,
    })
    setProgrammeModalOpen(true)
  }

  const openCreateSubjectModal = () => {
    setSelectedSubject(null)
    setSubjectForm(initialSubjectForm)
    setSubjectModalOpen(true)
  }

  const openEditSubjectModal = (subject: Subject) => {
    setSelectedSubject(subject)
    setSubjectForm({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      default_contact_hours: subject.default_contact_hours,
      is_active: subject.is_active,
    })
    setSubjectModalOpen(true)
  }

  const openProgrammeDetails = (programme: Programme) => {
    setActiveProgramme(programme)
    const initialNames: Record<number, string> = {}
    programme.semesters.forEach((semester) => {
      initialNames[semester.id] = semester.name
    })
    setSemesterNameUpdates(initialNames)
    setDetailModalOpen(true)
  }

  const openAssignSubjectModal = (programme: Programme, semester: ProgrammeSemester) => {
    setActiveProgramme(programme)
    setAssignmentForm({
      programme_semester_id: semester.id,
      subject_id: undefined,
      contact_hours: semester.assignments.length ? semester.assignments[0].contact_hours : 0,
      is_active: true,
    })
    setSelectedAssignment(null)
    setAssignmentModalOpen(true)
  }

  const openEditAssignmentModal = (programme: Programme, assignment: ProgrammeSemesterSubject) => {
    setActiveProgramme(programme)
    setSelectedAssignment(assignment)
    setAssignmentForm({
      programme_semester_id: assignment.programme_semester_id,
      subject_id: assignment.subject_id,
      contact_hours: assignment.contact_hours,
      is_active: assignment.is_active,
    })
    setAssignmentModalOpen(true)
  }

  const handleProgrammeSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (selectedProgramme) {
        await updateProgram(selectedProgramme.id, programmeForm)
        pushToast('Programme updated successfully.')
      } else {
        await createProgram(programmeForm)
        pushToast('Programme created successfully.')
      }
      setProgrammeModalOpen(false)
      loadProgrammes()
    } catch (error: any) {
      const validation = error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(' ') : null
      pushToast(validation || error?.response?.data?.message || 'Unable to save programme', 'error')
    }
  }

  const handleSubjectSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      if (selectedSubject) {
        await updateSubject(selectedSubject.id, subjectForm)
        pushToast('Subject updated successfully.')
      } else {
        await createSubject(subjectForm)
        pushToast('Subject created successfully.')
      }
      setSubjectModalOpen(false)
      loadSubjects()
    } catch (error: any) {
      const validation = error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(' ') : null
      pushToast(validation || error?.response?.data?.message || 'Unable to save subject', 'error')
    }
  }

  const handleAssignmentSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeProgramme || !assignmentForm.programme_semester_id || !assignmentForm.subject_id) {
      pushToast('Please fill all fields.', 'error')
      return
    }

    try {
      if (selectedAssignment) {
        await updateSemesterSubject(selectedAssignment.id, {
          contact_hours: assignmentForm.contact_hours,
          is_active: assignmentForm.is_active,
        })
        pushToast('Assignment updated successfully.')
      } else {
        await assignSemesterSubject(activeProgramme.id, assignmentForm)
        pushToast('Subject assigned successfully.')
      }
      setAssignmentModalOpen(false)
      const refreshed = await fetchPrograms({ search })
      const updatedProgrammes = refreshed.data
      setProgrammes(updatedProgrammes)
      if (activeProgramme) {
        const updated = updatedProgrammes.find((item) => item.id === activeProgramme.id)
        setActiveProgramme(updated || null)
      }
    } catch (error: any) {
      const validation = error?.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(' ') : null
      pushToast(validation || error?.response?.data?.message || 'Unable to save assignment', 'error')
    }
  }

  const handleDeleteProgramme = async (programme: Programme) => {
    if (!window.confirm('Delete this programme?')) return
    try {
      await deleteProgram(programme.id)
      pushToast('Programme deleted successfully.')
      loadProgrammes()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to delete programme', 'error')
    }
  }

  const handleDeleteSubject = async (subject: Subject) => {
    if (!window.confirm('Delete this subject?')) return
    try {
      await deleteSubject(subject.id)
      pushToast('Subject deleted successfully.')
      loadSubjects()
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to delete subject', 'error')
    }
  }

  const handleUpdateSemester = async (semester: ProgrammeSemester) => {
    try {
      await updateSemester(semester.id, {
        name: semesterNameUpdates[semester.id] || semester.name,
        is_active: semester.is_active,
      })
      pushToast('Semester saved successfully.')
      const refreshed = await fetchPrograms({ search })
      setProgrammes(refreshed.data)
      const updated = refreshed.data.find((item) => item.id === activeProgramme?.id)
      setActiveProgramme(updated || null)
    } catch (error: any) {
      pushToast(error?.response?.data?.message || 'Unable to save semester', 'error')
    }
  }

  const activeProgrammes = useMemo(() => programmes, [programmes])
  const activeSubjects = useMemo(() => subjects, [subjects])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Academics</h2>
          <p className="text-sm text-slate-500">Manage programmes, semesters, subjects, and semester assignments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('programmes')}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${activeTab === 'programmes' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Programmes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subjects')}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${activeTab === 'subjects' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            Subjects
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">Found {activeTab === 'programmes' ? activeProgrammes.length : activeSubjects.length} {activeTab === 'programmes' ? 'programme' : 'subject'}{activeTab === 'programmes' ? (activeProgrammes.length === 1 ? '' : 's') : (activeSubjects.length === 1 ? '' : 's')}.</div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && (activeTab === 'programmes' ? loadProgrammes() : loadSubjects())}
              placeholder={`Search ${activeTab === 'programmes' ? 'programmes' : 'subjects'}...`}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-900 sm:w-80"
            />
            <button
              type="button"
              onClick={activeTab === 'programmes' ? openCreateProgrammeModal : openCreateSubjectModal}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              New {activeTab === 'programmes' ? 'programme' : 'subject'}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            {activeTab === 'programmes' ? (
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Name</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Code</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Department</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Level</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Duration</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Reg. fee</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Tuition</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            ) : (
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Name</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Code</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Default Hours</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={activeTab === 'programmes' ? 9 : 5} className="px-6 py-10 text-center text-slate-500">
                  Loading {activeTab === 'programmes' ? 'programmes' : 'subjects'}...
                </td>
              </tr>
            ) : (activeTab === 'programmes' ? (
              activeProgrammes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-slate-500">
                    No programmes found.
                  </td>
                </tr>
              ) : (
                activeProgrammes.map((programme) => (
                  <tr key={programme.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{programme.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{programme.code}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{programme.department?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{programmeLevels.find((item) => item.value === programme.level)?.label || programme.level}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{programme.duration_years} year{programme.duration_years === 1 ? '' : 's'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatMoney(programme.application_fee ?? 0)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatMoney(programme.tuition_fee ?? 0)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{programme.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => openEditProgrammeModal(programme)} className="rounded-xl bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200">
                          Edit
                        </button>
                        <button onClick={() => openProgrammeDetails(programme)} className="rounded-xl bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200">
                          Manage
                        </button>
                        <button onClick={() => handleDeleteProgramme(programme)} className="rounded-xl bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-200">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )
            ) : (
              activeSubjects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                    No subjects found.
                  </td>
                </tr>
              ) : (
                activeSubjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{subject.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{subject.code}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{subject.default_contact_hours}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{subject.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => openEditSubjectModal(subject)} className="rounded-xl bg-slate-100 px-3 py-1 text-slate-700 hover:bg-slate-200">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteSubject(subject)} className="rounded-xl bg-rose-100 px-3 py-1 text-rose-700 hover:bg-rose-200">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )
            ))}
          </tbody>
        </table>
      </div>

      <Modal title={selectedProgramme ? 'Edit programme' : 'Create programme'} open={programmeModalOpen} onClose={() => setProgrammeModalOpen(false)}>
        <form onSubmit={handleProgrammeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={programmeForm.name}
              onChange={(event) => setProgrammeForm((prev) => ({ ...prev, name: event.target.value }))}
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Code</label>
            <input
              value={programmeForm.code}
              onChange={(event) => setProgrammeForm((prev) => ({ ...prev, code: event.target.value }))}
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Department</label>
            <select
              value={programmeForm.department_id ?? ''}
              onChange={(event) => setProgrammeForm((prev) => ({ ...prev, department_id: Number(event.target.value) || undefined }))}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name} {department.code ? `(${department.code})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Level</label>
            <select
              value={programmeForm.level}
              onChange={(event) => setProgrammeForm((prev) => ({ ...prev, level: event.target.value }))}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            >
              {programmeLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Duration (years)</label>
              <input
                value={programmeForm.duration_years}
                onChange={(event) => setProgrammeForm((prev) => ({ ...prev, duration_years: Number(event.target.value) }))}
                type="number"
                min={1}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Semester count</label>
              <input
                value={programmeForm.semester_count}
                onChange={(event) => setProgrammeForm((prev) => ({ ...prev, semester_count: Number(event.target.value) }))}
                type="number"
                min={1}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Registration fee</label>
              <input
                value={programmeForm.application_fee}
                onChange={(event) => setProgrammeForm((prev) => ({ ...prev, application_fee: Number(event.target.value) }))}
                type="number"
                min={0}
                step="0.01"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              />
              <p className="mt-1 text-xs text-slate-500">One-time fee required before application submission.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Tuition fee</label>
              <input
                value={programmeForm.tuition_fee}
                onChange={(event) => setProgrammeForm((prev) => ({ ...prev, tuition_fee: Number(event.target.value) }))}
                type="number"
                min={0}
                step="0.01"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
              />
              <p className="mt-1 text-xs text-slate-500">Program tuition fee. Semester installments can be configured per level/semester.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={programmeForm.description}
              onChange={(event) => setProgrammeForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="programme_is_active"
              type="checkbox"
              checked={programmeForm.is_active}
              onChange={(event) => setProgrammeForm((prev) => ({ ...prev, is_active: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="programme_is_active" className="text-sm text-slate-700">
              Active programme
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setProgrammeModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Save
            </button>
          </div>
        </form>
      </Modal>

      <Modal title={selectedSubject ? 'Edit subject' : 'Create subject'} open={subjectModalOpen} onClose={() => setSubjectModalOpen(false)}>
        <form onSubmit={handleSubjectSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={subjectForm.name}
              onChange={(event) => setSubjectForm((prev) => ({ ...prev, name: event.target.value }))}
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Code</label>
            <input
              value={subjectForm.code}
              onChange={(event) => setSubjectForm((prev) => ({ ...prev, code: event.target.value }))}
              type="text"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Default contact hours</label>
            <input
              value={subjectForm.default_contact_hours}
              onChange={(event) => setSubjectForm((prev) => ({ ...prev, default_contact_hours: Number(event.target.value) }))}
              type="number"
              min={0}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={subjectForm.description}
              onChange={(event) => setSubjectForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="subject_is_active"
              type="checkbox"
              checked={subjectForm.is_active}
              onChange={(event) => setSubjectForm((prev) => ({ ...prev, is_active: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="subject_is_active" className="text-sm text-slate-700">
              Active subject
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setSubjectModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Save
            </button>
          </div>
        </form>
      </Modal>

      <Modal title={activeProgramme ? `${activeProgramme.name} — Semesters` : 'Programme details'} open={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
        {activeProgramme ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm text-slate-500">{activeProgramme.description || 'No description provided.'}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Level</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{programmeLevels.find((item) => item.value === activeProgramme.level)?.label || activeProgramme.level}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Semesters</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{activeProgramme.semesters.length}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {activeProgramme.semesters.map((semester) => (
                <div key={semester.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-slate-900">{semester.name}</div>
                      <div className="text-sm text-slate-600">Status: {semester.is_active ? 'Active' : 'Inactive'}</div>
                      <div className="text-sm text-slate-600">Subjects assigned: {semester.assignments.length}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openAssignSubjectModal(activeProgramme, semester)} className="rounded-xl bg-slate-900 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-800">
                        Assign subject
                      </button>
                      <button onClick={() => handleUpdateSemester(semester)} className="rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">
                        Save semester
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Semester name</label>
                      <input
                        value={semesterNameUpdates[semester.id] ?? semester.name}
                        onChange={(event) => setSemesterNameUpdates((prev) => ({ ...prev, [semester.id]: event.target.value }))}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-900"
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={semester.is_active}
                          onChange={(event) => {
                            const updated = activeProgramme.semesters.map((item) =>
                              item.id === semester.id ? { ...item, is_active: event.target.checked } : item
                            )
                            setActiveProgramme({ ...activeProgramme, semesters: updated })
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        Active semester
                      </label>
                    </div>
                  </div>

                  {semester.assignments.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {semester.assignments.map((assignment) => (
                        <div key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{assignment.subject.name}</div>
                              <div className="text-sm text-slate-600">Code: {assignment.subject.code}</div>
                              <div className="text-sm text-slate-600">Contact hours: {assignment.contact_hours}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => openEditAssignmentModal(activeProgramme, assignment)} className="rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200">
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Remove this subject assignment?')) return
                                  try {
                                    await deleteSemesterSubject(assignment.id)
                                    pushToast('Subject assignment removed.')
                                    const refreshed = await fetchPrograms({ search })
                                    setProgrammes(refreshed.data)
                                    const updated = refreshed.data.find((item) => item.id === activeProgramme.id)
                                    setActiveProgramme(updated || null)
                                  } catch (error: any) {
                                    pushToast(error?.response?.data?.message || 'Unable to remove assignment', 'error')
                                  }
                                }}
                                className="rounded-xl bg-rose-100 px-3 py-1 text-sm text-rose-700 hover:bg-rose-200"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                      No subjects assigned yet.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-slate-500">Select a programme to inspect semesters and assignments.</div>
        )}
      </Modal>

      <Modal title={selectedAssignment ? 'Edit assignment' : 'Assign subject to semester'} open={assignmentModalOpen} onClose={() => setAssignmentModalOpen(false)}>
        <form onSubmit={handleAssignmentSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Semester</label>
            <select
              value={assignmentForm.programme_semester_id ?? ''}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, programme_semester_id: Number(event.target.value) || undefined }))}
              required
              disabled={Boolean(selectedAssignment)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            >
              <option value="">Select semester</option>
              {activeProgramme?.semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>{semester.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Subject</label>
            <select
              value={assignmentForm.subject_id ?? ''}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, subject_id: Number(event.target.value) || undefined }))}
              required
              disabled={Boolean(selectedAssignment)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Contact hours</label>
            <input
              value={assignmentForm.contact_hours}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, contact_hours: Number(event.target.value) }))}
              type="number"
              min={0}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="assignment_is_active"
              type="checkbox"
              checked={assignmentForm.is_active}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, is_active: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <label htmlFor="assignment_is_active" className="text-sm text-slate-700">
              Active assignment
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setAssignmentModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              {selectedAssignment ? 'Save' : 'Assign'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
