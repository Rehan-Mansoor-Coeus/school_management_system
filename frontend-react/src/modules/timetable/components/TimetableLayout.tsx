import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'

type Tab = { to: string; label: string; permissions: string[]; end?: boolean }

const TABS: Tab[] = [
  { to: '/timetable/courses', label: 'Course Management', permissions: ['timetable.courses.view', 'timetable.view', 'timetable.manage'] },
  { to: '/timetable/assignments', label: 'Course Assignment', permissions: ['timetable.assignments.view', 'timetable.view', 'timetable.manage'] },
  { to: '/timetable/workload', label: 'Teacher Workload', permissions: ['timetable.workload.view', 'timetable.view', 'timetable.manage'] },
  { to: '/timetable/availability', label: 'Teacher Availability', permissions: ['timetable.availability.view', 'timetable.manage'] },
  { to: '/timetable/schedule', label: 'Timetable', permissions: ['timetable.view', 'timetable.manage'] },
  { to: '/timetable/generate', label: 'Auto Generate', permissions: ['timetable.generate', 'timetable.manage'] },
  { to: '/timetable/classrooms', label: 'Classrooms', permissions: ['timetable.classrooms.view', 'timetable.manage'] },
  { to: '/timetable/lessons', label: 'Lesson Logging', permissions: ['timetable.lessons.log', 'timetable.lessons.view', 'timetable.manage'] },
  { to: '/timetable/my', label: 'My Timetable', permissions: ['timetable.student.view'] },
  { to: '/timetable/reports', label: 'Reports', permissions: ['timetable.reports.view', 'timetable.view', 'timetable.manage'] },
  { to: '/timetable/settings', label: 'Settings', permissions: ['timetable.settings.manage', 'timetable.manage'] },
]

export default function TimetableLayout() {
  const { canAccess } = useAuth()
  const visible = TABS.filter((tab) => canAccess({ permissions: tab.permissions }))

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Timetable &amp; Course Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage courses, allocations, classrooms, teacher availability and generate conflict-free academic timetables.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {visible.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
