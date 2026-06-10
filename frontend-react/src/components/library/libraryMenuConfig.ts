import type { ComponentType } from 'react'
import {
  LayoutDashboard,
  Tags,
  BookPlus,
  Copy,
  BookMarked,
  Inbox,
  BookOpenCheck,
  CalendarClock,
  AlarmClock,
  CircleDollarSign,
  Flame,
  History,
  Settings,
} from 'lucide-react'
import type { TabColor } from '../ui/ColoredModuleTabsNav'

export type LibraryMenuItem = {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
  color: TabColor
  /** Any one of these permissions grants visibility. */
  perms: string[]
}

export const libraryMenuItems: LibraryMenuItem[] = [
  { label: 'Library Dashboard', path: '/library', icon: LayoutDashboard, color: 'blue', perms: ['view_library_reports', 'view_library_menu', 'approve_borrow_requests'] },
  { label: 'Borrow Requests', path: '/library/requests', icon: Inbox, color: 'amber', perms: ['approve_borrow_requests', 'view_own_borrow_requests'] },
  { label: 'Book Categories', path: '/library/categories', icon: Tags, color: 'violet', perms: ['manage_book_categories'] },
  { label: 'Register Book', path: '/library/books', icon: BookPlus, color: 'emerald', perms: ['register_books', 'view_books'] },
  { label: 'Book Copies', path: '/library/copies', icon: Copy, color: 'cyan', perms: ['manage_book_copies'] },
  { label: 'Borrow a Book', path: '/library/borrow', icon: BookMarked, color: 'indigo', perms: ['borrow_books'] },
  { label: 'Borrowed Books', path: '/library/borrowed', icon: BookOpenCheck, color: 'teal', perms: ['view_borrowed_books', 'approve_borrow_requests'] },
  { label: 'Due for Return', path: '/library/due', icon: CalendarClock, color: 'orange', perms: ['view_due_for_return', 'send_library_reminders'] },
  { label: 'Overdue Books', path: '/library/overdue', icon: AlarmClock, color: 'rose', perms: ['view_overdue_books', 'manage_library_fines'] },
  { label: 'Fines Management', path: '/library/fines', icon: CircleDollarSign, color: 'pink', perms: ['manage_library_fines'] },
  { label: 'Frequently Signed', path: '/library/frequently-signed', icon: Flame, color: 'purple', perms: ['view_frequently_signed_books', 'view_library_reports'] },
  { label: 'Borrowing History', path: '/library/history', icon: History, color: 'slate', perms: ['view_own_borrow_requests', 'view_library_reports'] },
  { label: 'Library Settings', path: '/library/settings', icon: Settings, color: 'slate', perms: ['manage_library_settings'] },
]
