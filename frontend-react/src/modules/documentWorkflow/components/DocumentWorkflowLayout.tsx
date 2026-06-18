import { NavLink, Outlet } from 'react-router-dom'
import {
  ClipboardCheck,
  FileClock,
  FileText,
  FolderCheck,
  LayoutDashboard,
  PenLine,
  PlusCircle,
  Settings,
  Tags,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'

type Tab = { label: string; path: string; icon: typeof LayoutDashboard; end?: boolean; permissions: string[] }

const tabs: Tab[] = [
  { label: 'Dashboard', path: '/document-workflow', icon: LayoutDashboard, end: true, permissions: ['documents.view', 'documents.manage'] },
  { label: 'Templates', path: '/document-workflow/templates', icon: FileText, permissions: ['documents.view', 'documents.templates.manage', 'documents.manage'] },
  { label: 'Generate Document', path: '/document-workflow/generate', icon: PlusCircle, permissions: ['documents.generate', 'documents.manage'] },
  { label: 'Pending Signatures', path: '/document-workflow/pending-signatures', icon: PenLine, permissions: ['documents.view', 'documents.manage'] },
  { label: 'Pending Approvals', path: '/document-workflow/pending-approvals', icon: ClipboardCheck, permissions: ['documents.view', 'documents.approve', 'documents.manage'] },
  { label: 'Completed Documents', path: '/document-workflow/completed', icon: FolderCheck, permissions: ['documents.view', 'documents.manage'] },
  { label: 'Expired Documents', path: '/document-workflow/expired', icon: FileClock, permissions: ['documents.view', 'documents.manage'] },
  { label: 'Document Types', path: '/document-workflow/types', icon: Tags, permissions: ['documents.types.view', 'documents.view', 'documents.manage'] },
  { label: 'Settings', path: '/document-workflow/settings', icon: Settings, permissions: ['documents.settings.manage', 'documents.manage'] },
]

export default function DocumentWorkflowLayout() {
  const { canAccess } = useAuth()
  const visibleTabs = tabs.filter((tab) => canAccess({ permissions: tab.permissions }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Document Workflow</h1>
        <p className="text-sm text-slate-500">One engine to generate, sign, approve, store, and track institutional documents.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </NavLink>
          )
        })}
      </div>

      <Outlet />
    </div>
  )
}
