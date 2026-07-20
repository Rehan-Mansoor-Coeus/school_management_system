import { Outlet } from 'react-router-dom'
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
import ColoredModuleTabsNav, { type TabColor } from '../../../components/ui/ColoredModuleTabsNav'

type Tab = {
  label: string
  path: string
  icon: typeof LayoutDashboard
  end?: boolean
  permissions: string[]
  color: TabColor
}

const tabs: Tab[] = [
  { label: 'Dashboard', path: '/document-workflow', icon: LayoutDashboard, end: true, permissions: ['documents.view', 'documents.manage'], color: 'navy' },
  { label: 'Templates', path: '/document-workflow/templates', icon: FileText, permissions: ['documents.view', 'documents.templates.manage', 'documents.manage'], color: 'blue' },
  { label: 'Generate Document', path: '/document-workflow/generate', icon: PlusCircle, permissions: ['documents.generate', 'documents.manage'], color: 'emerald' },
  { label: 'Pending Signatures', path: '/document-workflow/pending-signatures', icon: PenLine, permissions: ['documents.view', 'documents.manage'], color: 'amber' },
  { label: 'Pending Approvals', path: '/document-workflow/pending-approvals', icon: ClipboardCheck, permissions: ['documents.view', 'documents.approve', 'documents.manage'], color: 'purple' },
  { label: 'Completed Documents', path: '/document-workflow/completed', icon: FolderCheck, permissions: ['documents.view', 'documents.manage'], color: 'teal' },
  { label: 'Expired Documents', path: '/document-workflow/expired', icon: FileClock, permissions: ['documents.view', 'documents.manage'], color: 'rose' },
  { label: 'Document Types', path: '/document-workflow/types', icon: Tags, permissions: ['documents.types.view', 'documents.view', 'documents.manage'], color: 'indigo' },
  { label: 'Settings', path: '/document-workflow/settings', icon: Settings, permissions: ['documents.settings.manage', 'documents.manage'], color: 'slate' },
]

export default function DocumentWorkflowLayout() {
  const { canAccess } = useAuth()
  const visibleTabs = tabs
    .filter((tab) => canAccess({ permissions: tab.permissions }))
    .map((tab) => ({
      label: tab.label,
      path: tab.path,
      end: tab.end,
      icon: tab.icon,
      color: tab.color,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Document Workflow</h1>
        <p className="text-sm text-slate-500">One engine to generate, sign, approve, store, and track institutional documents.</p>
      </div>

      <ColoredModuleTabsNav items={visibleTabs} />
      <Outlet />
    </div>
  )
}
