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

export type LettersMenuItem = {
  labelKey: string
  path: string
  icon: ComponentType<{ className?: string }>
  countKey?: string
}

export const announcementMenuItems: LettersMenuItem[] = [
  { labelKey: 'createAnnouncement', path: '/letters/announcements/create', icon: Plus },
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
