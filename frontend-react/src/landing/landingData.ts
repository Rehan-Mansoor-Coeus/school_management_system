import type { LucideIcon } from 'lucide-react'
import {
  GraduationCap,
  Users,
  Wallet,
  BookOpen,
  Clock,
  ClipboardList,
  Briefcase,
  Mail,
  BarChart3,
} from 'lucide-react'

export type ModuleCard = {
  key: string
  title: string
  description: string
  icon: LucideIcon
  color: string
  iconBg: string
  features: string[]
  featured?: boolean
}

export const moduleCards: ModuleCard[] = [
  {
    key: 'admissions',
    title: 'Admissions',
    description: 'Students apply online, track applications, and receive admission updates.',
    icon: GraduationCap,
    color: 'from-blue-600 to-indigo-700',
    iconBg: 'bg-blue-100 text-blue-600',
    features: ['Online applications', 'Status tracking', 'Document uploads', 'Fee payment'],
    featured: true,
  },
  {
    key: 'students',
    title: 'Student Management',
    description: 'Manage students, attendance, academic records, and communication.',
    icon: Users,
    color: 'from-emerald-600 to-teal-700',
    iconBg: 'bg-emerald-100 text-emerald-600',
    features: ['Student profiles', 'Attendance', 'Academic records', 'Messaging'],
    featured: true,
  },
  {
    key: 'finance',
    title: 'Finance',
    description: 'Fees, invoices, payments, and financial reports in one place.',
    icon: Wallet,
    color: 'from-amber-500 to-orange-600',
    iconBg: 'bg-orange-100 text-orange-600',
    features: ['Fee management', 'Invoices', 'Mobile money', 'Reports'],
    featured: true,
  },
  {
    key: 'library',
    title: 'Library',
    description: 'Book registration, borrow requests, QR issue, due reminders, and ratings.',
    icon: BookOpen,
    color: 'from-violet-600 to-purple-700',
    iconBg: 'bg-teal-100 text-teal-600',
    features: ['Book catalog', 'Borrow workflow', 'QR codes', 'Fines & reminders'],
    featured: true,
  },
  {
    key: 'timesheets',
    title: 'Timesheets',
    description: 'Employee activities, working hours, and overtime tracking.',
    icon: Clock,
    color: 'from-cyan-600 to-blue-700',
    iconBg: 'bg-cyan-100 text-cyan-600',
    features: ['Activities', 'Fill timesheet', 'Working week', 'Overtime reports'],
  },
  {
    key: 'tasks',
    title: 'Task Management',
    description: 'Assign tasks, track completion, and manage department workflows.',
    icon: ClipboardList,
    color: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-100 text-rose-600',
    features: ['Task assignment', 'Deadlines', 'Department queues', 'Progress tracking'],
  },
  {
    key: 'hr',
    title: 'Human Resources',
    description: 'Staff management, leave requests, and payroll support.',
    icon: Briefcase,
    color: 'from-slate-600 to-slate-800',
    iconBg: 'bg-purple-100 text-purple-600',
    features: ['Staff records', 'Leave requests', 'Roles', 'Payroll support'],
    featured: true,
  },
  {
    key: 'letters',
    title: 'Letters & Announcements',
    description: 'Generate letters, approval workflows, digital signatures, and WhatsApp delivery.',
    icon: Mail,
    color: 'from-indigo-600 to-blue-800',
    iconBg: 'bg-indigo-100 text-indigo-600',
    features: ['Letter templates', 'Approvals', 'E-signatures', 'WhatsApp alerts'],
  },
  {
    key: 'reports',
    title: 'Reports',
    description: 'Institution reports, performance tracking, and decision support.',
    icon: BarChart3,
    color: 'from-teal-600 to-emerald-700',
    iconBg: 'bg-pink-100 text-pink-600',
    features: ['Dashboards', 'Exports', 'Analytics', 'KPI tracking'],
    featured: true,
  },
]

export const whyChooseItems = [
  { title: 'Multi Institution', desc: 'One platform serving many schools and universities.' },
  { title: 'WhatsApp Communication', desc: 'OTP, alerts, and announcements via WhatsApp.' },
  { title: 'Library Management', desc: 'Full borrowing lifecycle with QR and fines.' },
  { title: 'Finance', desc: 'Fees, invoices, and payment tracking.' },
  { title: 'Student Portal', desc: 'Students apply, pay, and track progress online.' },
  { title: 'Staff Portal', desc: 'Teachers and staff manage daily operations.' },
  { title: 'Reports', desc: 'Data-driven insights for leadership.' },
  { title: 'AI Assistant', desc: 'Mbole helps students and institutions 24/7.' },
  { title: 'Cloud Ready', desc: 'Secure, scalable, and always available.' },
  { title: 'Mobile Friendly', desc: 'Works beautifully on phones and tablets.' },
]

export const testimonials = [
  {
    quote: 'ASSMS streamlined our admissions from paper forms to a fully digital pipeline. Students now track every step.',
    name: 'Dr. Amina N.',
    role: 'Registrar, Leading University',
  },
  {
    quote: 'The library module with QR borrowing transformed how our students access resources on campus.',
    name: 'James O.',
    role: 'Librarian',
  },
  {
    quote: 'Finance teams finally have one view of fees, payments, and reports across departments.',
    name: 'Grace M.',
    role: 'Finance Officer',
  },
]
