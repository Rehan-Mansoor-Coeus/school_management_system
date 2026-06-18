import type { ComponentType } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FilePlus2,
  FileText,
  FolderOpen,
  List,
  Megaphone,
  PenLine,
  Pencil,
  Plus,
  Printer,
  Send,
  Settings,
  XCircle,
  MessageSquare,
  Settings2,
} from 'lucide-react'
import type { TabColor } from '../ui/ColoredModuleTabsNav'

export type ModuleTabItem = {
  labelKey: string
  path: string
  end?: boolean
  countKey?: string
  icon?: ComponentType<{ className?: string }>
  color?: TabColor
}

export type LettersMenuItem = {
  labelKey: string
  path: string
  icon: ComponentType<{ className?: string }>
  countKey?: string
}

export const announcementTabItems: ModuleTabItem[] = [
  { labelKey: 'createAnnouncement', path: '/letters/announcements/create', icon: Plus, color: 'emerald' },
  { labelKey: 'announcementTemplates', path: '/letters/announcements/templates', icon: FileText, color: 'violet' },
  { labelKey: 'announcementList', path: '/letters/announcements', end: true, icon: Megaphone, color: 'blue' },
  { labelKey: 'scheduledAnnouncements', path: '/letters/announcements/scheduled', icon: CalendarClock, color: 'amber' },
  { labelKey: 'messageLogs', path: '/letters/message-logs', icon: MessageSquare, color: 'slate' },
  { labelKey: 'whatsappSettings', path: '/letters/whatsapp-settings', icon: Settings2, color: 'teal' },
]

export const letterTabItems: ModuleTabItem[] = [
  { labelKey: 'letterSettings', path: '/letters/settings', icon: Settings, color: 'slate' },
  { labelKey: 'letterCategories', path: '/letters/categories', icon: FolderOpen, color: 'violet' },
  { labelKey: 'letterListing', path: '/letters/listing', end: true, countKey: 'all', icon: List, color: 'blue' },
  { labelKey: 'createLetter', path: '/letters/create', icon: FilePlus2, color: 'emerald' },
  { labelKey: 'pendingLetters', path: '/letters/pending', countKey: 'pending', icon: Clock3, color: 'amber' },
  { labelKey: 'rejectedLetters', path: '/letters/rejected', countKey: 'rejected', icon: XCircle, color: 'rose' },
  { labelKey: 'awaitingEditing', path: '/letters/awaiting-editing', countKey: 'awaiting_editing', icon: Pencil, color: 'orange' },
  { labelKey: 'awaitingApproval', path: '/letters/awaiting-approval', countKey: 'awaiting_approval', icon: ClipboardCheck, color: 'indigo' },
  { labelKey: 'awaitingSignature', path: '/letters/awaiting-signature', countKey: 'awaiting_signature', icon: PenLine, color: 'purple' },
  { labelKey: 'readyToSend', path: '/letters/ready-to-send', countKey: 'ready_to_send', icon: Send, color: 'cyan' },
  { labelKey: 'sentLetters', path: '/letters/sent', countKey: 'sent', icon: CheckCircle2, color: 'teal' },
  { labelKey: 'printLetters', path: '/letters/print', countKey: 'printable', icon: Printer, color: 'pink' },
  { labelKey: 'downloadLetters', path: '/letters/download', countKey: 'printable', icon: Download, color: 'pink' },
  { labelKey: 'letterTemplates', path: '/letters/templates', icon: FileText, color: 'violet' },
]

export function shouldHideAnnouncementTabs(pathname: string) {
  return pathname.includes('/create') || pathname.includes('/templates')
}

export function shouldHideLetterTabs(pathname: string) {
  return pathname.includes('/create') || pathname.includes('/edit/') || pathname.includes('/print-view/')
}

export function countBadgeTone(countKey?: string): 'teal' | 'pink' | 'purple' {
  if (countKey === 'rejected') return 'pink'
  if (countKey === 'all') return 'teal'
  return 'purple'
}

export const announcementMenuItems: LettersMenuItem[] = [
  { labelKey: 'createAnnouncement', path: '/letters/announcements/create', icon: Plus },
  { labelKey: 'announcementTemplates', path: '/letters/announcements/templates', icon: FileText },
  { labelKey: 'announcementList', path: '/letters/announcements', icon: Megaphone },
  { labelKey: 'scheduledAnnouncements', path: '/letters/announcements/scheduled', icon: CalendarClock },
  { labelKey: 'messageLogs', path: '/letters/message-logs', icon: MessageSquare },
  { labelKey: 'whatsappSettings', path: '/letters/whatsapp-settings', icon: Settings2 },
]

export const letterMenuItems: LettersMenuItem[] = [
  { labelKey: 'letterSettings', path: '/letters/settings', icon: Settings },
  { labelKey: 'letterCategories', path: '/letters/categories', icon: FolderOpen },
  { labelKey: 'letterListing', path: '/letters/listing', icon: List, countKey: 'all' },
  { labelKey: 'createLetter', path: '/letters/create', icon: FilePlus2 },
  { labelKey: 'pendingLetters', path: '/letters/pending', icon: Clock3, countKey: 'pending' },
  { labelKey: 'rejectedLetters', path: '/letters/rejected', icon: XCircle, countKey: 'rejected' },
  { labelKey: 'awaitingEditing', path: '/letters/awaiting-editing', icon: Pencil, countKey: 'awaiting_editing' },
  { labelKey: 'awaitingApproval', path: '/letters/awaiting-approval', icon: ClipboardCheck, countKey: 'awaiting_approval' },
  { labelKey: 'awaitingSignature', path: '/letters/awaiting-signature', icon: PenLine, countKey: 'awaiting_signature' },
  { labelKey: 'readyToSend', path: '/letters/ready-to-send', icon: Send, countKey: 'ready_to_send' },
  { labelKey: 'sentLetters', path: '/letters/sent', icon: CheckCircle2, countKey: 'sent' },
  { labelKey: 'printLetters', path: '/letters/print', icon: Printer, countKey: 'printable' },
  { labelKey: 'downloadLetters', path: '/letters/download', icon: Download, countKey: 'printable' },
  { labelKey: 'letterTemplates', path: '/letters/templates', icon: FileText },
]
