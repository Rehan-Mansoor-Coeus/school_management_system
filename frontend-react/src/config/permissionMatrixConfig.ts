export type PermissionAction = 'view' | 'edit' | 'delete'

/** Permission names that grant a cell when assigned to a role. */
export type PermissionCell = string[]

export type MatrixRow = {
  id: string
  label: string
  view?: PermissionCell
  edit?: PermissionCell
  delete?: PermissionCell
}

export type MatrixSection = {
  id: string
  label: string
  rows: MatrixRow[]
}

function row(id: string, label: string, view?: PermissionCell, edit?: PermissionCell, del?: PermissionCell): MatrixRow {
  return { id, label, view, edit, delete: del }
}

export const permissionMatrixSections: MatrixSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    rows: [row('dashboard', 'Dashboard', ['users.view'])],
  },
  {
    id: 'access_control',
    label: 'Access Control',
    rows: [
      row('users', 'Users', ['users.view', 'view_users'], ['users.create', 'users.edit', 'create_users', 'edit_users', 'manage_users'], ['users.delete', 'delete_users']),
      row('roles_permissions', 'Roles & Permissions', ['roles.view', 'view_roles', 'permissions.view', 'view_permissions'], ['roles.create', 'roles.edit', 'roles.manage', 'create_roles', 'edit_roles', 'manage_roles', 'permissions.create', 'permissions.edit', 'assign_permissions'], ['roles.delete', 'delete_roles', 'permissions.delete']),
      row('modules', 'Module Settings', ['modules.view'], ['modules.manage'], []),
    ],
  },
  {
    id: 'operations_employee',
    label: 'Operations — Time Sheet Employee',
    rows: [
      row('ts_create_activity', 'Create Activity', ['view_timesheet_menu', 'timesheets.view_own'], ['create_timesheet_activity', 'timesheets.create_entry']),
      row('ts_fill', 'Fill Time Sheet', ['fill_timesheet', 'timesheets.view_own'], ['fill_timesheet', 'timesheets.create_entry', 'edit_own_timesheet']),
      row('ts_working_week', 'Working Week', ['manage_own_working_week'], ['manage_own_working_week', 'timesheets.manage']),
    ],
  },
  {
    id: 'operations_admin',
    label: 'Operations — Time Sheet Admin',
    rows: [
      row('ts_report', 'Time Sheet Report', ['view_timesheet_reports', 'timesheets.report', 'timesheets.view_timesheet_reports'], ['export_timesheet_reports']),
      row('ts_overtime', 'Overtime Report', ['view_overtime_reports', 'view_timesheet_reports'], []),
      row('ts_manage_all', 'Manage All', ['view_all_timesheets', 'timesheets.manage', 'timesheets.review'], ['approve_timesheets', 'reject_timesheets', 'timesheets.approve_timesheets', 'timesheets.reject_timesheets']),
      row('ts_categories', 'Categories', ['manage_timesheet_categories', 'timesheets.manage'], ['manage_timesheet_categories']),
    ],
  },
  {
    id: 'announcements',
    label: 'Announcements',
    rows: [
      row('ann_create', 'Create Announcement', ['view_announcements'], ['create_announcements']),
      row('ann_templates', 'Announcement Templates', ['view_announcements'], ['create_announcements', 'send_announcements']),
      row('ann_list', 'Announcement List', ['view_announcements'], ['send_announcements', 'schedule_announcements', 'manage_announcement_recipients']),
      row('ann_scheduled', 'Scheduled Announcements', ['view_announcements'], ['schedule_announcements']),
      row('ann_message_logs', 'Message Logs', ['view_announcements', 'view_letters_menu'], []),
      row('ann_whatsapp', 'WhatsApp Settings', ['view_announcements'], ['send_whatsapp_announcements', 'manage_letter_settings']),
    ],
  },
  {
    id: 'letters',
    label: 'Letters & Messaging',
    rows: [
      row('ltr_settings', 'Letter Settings', ['view_letters_menu'], ['manage_letter_settings']),
      row('ltr_categories', 'Letter Categories', ['view_letters_menu'], ['manage_letter_categories']),
      row('ltr_listing', 'Letter Listing', ['view_letters_menu'], ['create_letters', 'edit_letters']),
      row('ltr_create', 'Create Letter', ['view_letters_menu'], ['create_letters']),
      row('ltr_pending', 'Pending Letters', ['view_letters_menu', 'view_awaiting_editing', 'view_awaiting_approval', 'view_awaiting_signature'], ['edit_awaiting_letters', 'approve_letters', 'reject_letters']),
      row('ltr_workflow', 'Awaiting Editing / Approval / Signature', ['view_awaiting_editing', 'view_awaiting_approval', 'view_awaiting_signature'], ['edit_awaiting_letters', 'forward_letter_to_approver', 'forward_letter_to_signer', 'approve_letters', 'sign_letters']),
      row('ltr_send', 'Ready to Send / Sent', ['view_ready_to_send_letters', 'view_sent_letters'], ['send_letters', 'bulk_send_letters']),
      row('ltr_print', 'Print / Download', ['print_letters', 'download_letters'], []),
      row('ltr_templates', 'Letter Templates', ['view_letters_menu'], ['manage_letter_templates']),
    ],
  },
  {
    id: 'library',
    label: 'Library',
    rows: [
      row('lib_dashboard', 'Library Dashboard', ['view_library_reports', 'view_library_menu'], []),
      row('lib_categories', 'Book Categories', ['view_library_menu'], ['manage_book_categories']),
      row('lib_register', 'Register Book', ['view_books', 'view_library_menu'], ['register_books']),
      row('lib_copies', 'Book Copies', ['view_books'], ['manage_book_copies']),
      row('lib_borrow', 'Borrow a Book', ['borrow_books'], []),
      row('lib_requests', 'Borrow Requests', ['view_own_borrow_requests', 'approve_borrow_requests'], ['approve_borrow_requests', 'reject_borrow_requests', 'issue_books']),
      row('lib_borrowed', 'Borrowed Books', ['view_borrowed_books'], ['return_books']),
      row('lib_due', 'Due for Return', ['view_due_for_return'], ['send_library_reminders']),
      row('lib_overdue', 'Overdue Books', ['view_overdue_books'], ['manage_library_fines']),
      row('lib_fines', 'Fines Management', ['manage_library_fines'], ['manage_library_fines']),
      row('lib_frequent', 'Frequently Signed', ['view_frequently_signed_books'], []),
      row('lib_history', 'Borrowing History', ['view_own_borrow_requests', 'view_library_reports'], []),
      row('lib_settings', 'Library Settings', ['view_library_menu'], ['manage_library_settings']),
    ],
  },
  {
    id: 'academics',
    label: 'Academics',
    rows: [
      row('ac_institutions', 'Institutions', ['institutions.view'], ['institutions.create', 'institutions.edit', 'institutions.settings'], ['institutions.delete']),
      row('ac_departments', 'Departments', ['academics.view'], ['academics.manage']),
      row('ac_programmes', 'Programmes', ['academics.view'], ['academics.manage']),
      row('ac_subjects', 'Subjects', ['academics.view'], ['academics.manage']),
      row('ac_admissions', 'Admissions', ['admissions.view', 'admissions.apply'], ['admissions.manage', 'admissions.registry.review', 'admissions.department.review', 'admissions.registrar.admit', 'admissions.finance.verify', 'admissions.courses.register', 'admissions.hod.approve']),
      row('ac_certificates', 'Character Certificates', ['character_certificates.view'], ['character_certificates.manage', 'character_certificates.issue', 'character_certificates.finance_clear', 'character_certificates.library_clear']),
    ],
  },
  {
    id: 'modules',
    label: 'Modules',
    rows: [
      row('mod_attendance', 'Attendance', ['attendance.view'], ['attendance.manage']),
      row('mod_results', 'Results', ['results.view'], ['results.manage']),
      row('mod_fees', 'Fees & Payments', ['fees.view'], ['fees.manage']),
      row('mod_hr', 'HR & Payroll', ['hr.view'], ['hr.manage']),
      row('mod_hostel', 'Hostel', ['hostel.view'], ['hostel.manage', 'hostel.allocate', 'hostel.payments']),
      row('mod_canteen', 'Canteen', ['canteen.view'], ['canteen.manage', 'canteen.verify']),
    ],
  },
]

export function allMatrixPermissionNames(): string[] {
  const names = new Set<string>()
  for (const section of permissionMatrixSections) {
    for (const r of section.rows) {
      for (const action of ['view', 'edit', 'delete'] as PermissionAction[]) {
        r[action]?.forEach((n) => names.add(n))
      }
    }
  }
  return [...names]
}

export function sectionPermissionNames(section: MatrixSection): string[] {
  const names = new Set<string>()
  for (const r of section.rows) {
    for (const action of ['view', 'edit', 'delete'] as PermissionAction[]) {
      r[action]?.forEach((n) => names.add(n))
    }
  }
  return [...names]
}

export function rowPermissionNames(r: MatrixRow): string[] {
  const names = new Set<string>()
  for (const action of ['view', 'edit', 'delete'] as PermissionAction[]) {
    r[action]?.forEach((n) => names.add(n))
  }
  return [...names]
}
