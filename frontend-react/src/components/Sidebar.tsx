import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [{ label: 'Dashboard', path: '/' }]
const accessItems = [
  { label: 'Users', path: '/users' },
  { label: 'Roles', path: '/roles' },
  { label: 'Permissions', path: '/permissions' },
]
const timesheetItems = [
  { label: 'Timesheet Dashboard', path: '/timesheets/dashboard' },
  { label: 'Shift Types', path: '/timesheets/shift-types' },
  { label: 'Teacher Availability', path: '/timesheets/teacher-availability' },
  { label: 'Course Planning', path: '/timesheets/course-planning' },
  { label: 'Timetable Suggestion', path: '/timesheets/timetable-suggestion' },
  { label: 'Teacher Assignment', path: '/timesheets/teacher-assignment' },
  { label: 'My Teaching Schedule', path: '/timesheets/my-teaching-schedule' },
  { label: 'Submit Teaching', path: '/timesheets/submit-teaching' },
  { label: 'My Staff Timesheet', path: '/timesheets/my-staff-timesheet' },
  { label: 'My Timesheets', path: '/timesheets/my' },
  { label: 'Add Timesheet Entry', path: '/timesheets/add-entry' },
  { label: 'Submit Weekly', path: '/timesheets/submit' },
  { label: 'Approvals', path: '/timesheets/approvals' },
  { label: 'Reports', path: '/timesheets/reports' },
  { label: 'Working Schedules', path: '/timesheets/schedules' },
]

export default function Sidebar() {
  const [accessOpen, setAccessOpen] = useState(true)
  const [timesheetOpen, setTimesheetOpen] = useState(true)

  return (
    <aside className="h-full w-full border-b border-gray-200 bg-white px-4 py-6 sm:w-72 sm:border-b-0 sm:border-r">
      <div className="mb-10">
        <div className="text-2xl font-bold tracking-tight text-slate-900">Admin Panel</div>
        <div className="mt-1 text-sm text-slate-500">Role-based access control</div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `block rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}

        <button
          type="button"
          onClick={() => setAccessOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <span>Access Control</span>
          <span className={`transition ${accessOpen ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>

        {accessOpen && (
          <div className="space-y-1 pl-4">
            {accessItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setTimesheetOpen((current) => !current)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <span>Timesheets</span>
          <span className={`transition ${timesheetOpen ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>

        {timesheetOpen && (
          <div className="space-y-1 pl-4">
            {timesheetItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `block rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </aside>
  )
}
