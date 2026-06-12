type MboleReply = { text: string; escalate?: boolean }

const knowledge: Array<{ keys: string[]; reply: string }> = [
  {
    keys: ['sign up', 'signup', 'create account', 'register account', 'new student', 'student account'],
    reply:
      'To sign up as a student: go to Sign in → Create an account (or /signup). Select your institution, enter your WhatsApp number, verify the OTP sent to WhatsApp, then complete your profile. After signup you can sign in and apply for admission.',
  },
  {
    keys: ['sign in', 'login', 'log in', 'admin portal', 'portal'],
    reply:
      'Sign in at /admin using your email, username, or WhatsApp phone number and password. Staff accounts are created by administrators. Students can create their own account via Sign up with WhatsApp OTP verification.',
  },
  {
    keys: ['whatsapp', 'otp', 'verification code', 'verify phone'],
    reply:
      'Student signup and password reset use WhatsApp OTP. Enter the code sent to your registered WhatsApp number. If you do not receive it, check the number format (include country code, e.g. +256…) and try again.',
  },
  {
    keys: ['admission', 'apply', 'application', 'register as student', 'how to apply'],
    reply:
      'Admissions flow: 1) Sign up or sign in. 2) Go to Admissions → Apply. 3) Select programme (e.g. BSc Nursing). 4) Upload required documents set by that programme. 5) Pay registration fee. 6) Track status through registry, department, finance, and registrar review.',
  },
  {
    keys: ['registration fee', 'application fee', 'apply fee'],
    reply:
      'Each programme may have a registration (application) fee shown when you apply. Fees are set by the institution. Payment is required before your application is fully submitted.',
  },
  {
    keys: ['tuition', 'tuition fee', 'school fees', 'semester fee'],
    reply:
      'Tuition fees are configured per programme and institution. After admission you may need to pay tuition before course registration. Finance staff verify payments in the Admissions module.',
  },
  {
    keys: ['course registration', 'register courses', 'register subject', 'my courses'],
    reply:
      'After you are enrolled (finance verified), go to Admissions → Course Registration. You will see subjects assigned to your programme (e.g. English, Maths for Year 1). Required courses may be pre-selected. HOD approves your registration.',
  },
  {
    keys: ['program', 'programme', 'bsc', 'degree', 'diploma'],
    reply:
      'Programmes belong to departments (e.g. BSc Nursing under Nursing department). Institutions configure programmes under Academics. Browse programmes on the institution profile or during application.',
  },
  {
    keys: ['subject', 'course', 'english', 'math'],
    reply:
      'Subjects (courses) are shared across programmes where needed — e.g. English Language can be assigned to multiple programmes in Year 1. Admins assign subjects to programmes under Academics → Organization.',
  },
  {
    keys: ['document', 'upload', 'birth certificate', 'passport', 'required document'],
    reply:
      'Each programme lists required application documents (birth certificate, passport, etc.). Upload them when applying. Mandatory documents must be provided before submission.',
  },
  {
    keys: ['library', 'book', 'borrow', 'qr'],
    reply:
      'Library: register books, borrow/return, due reminders, fines, and reviews. Access from the Library menu after sign-in if your institution enabled it.',
  },
  {
    keys: ['hostel', 'accommodation', 'canteen', 'meal'],
    reply:
      'Hostel and Canteen modules manage accommodation, meal plans, and wallets when enabled for your institution.',
  },
  {
    keys: ['character certificate', 'certificate', 'clearance'],
    reply:
      'Character certificates and other clearance documents are under the Certificates menu after sign-in.',
  },
  {
    keys: ['fee', 'cost', 'price', 'pay', 'payment', 'finance'],
    reply:
      'Fees include registration/application fees, tuition, and optional hostel/canteen charges. Amounts and currency are set per institution. Payments are verified by finance staff in Admissions.',
  },
  {
    keys: ['demo', 'demonstration', 'trial'],
    reply:
      'Book a demo from the homepage or contact Alpha Bridge at info@alpha-bridge.net or +250794006160.',
  },
  {
    keys: ['institution', 'school', 'university', 'college', 'onboard'],
    reply:
      'Institutions request onboarding via Request Institution Registration on the homepage. Our team reviews and configures modules (Academics, Admissions, Library, etc.).',
  },
  {
    keys: ['academic', 'department', 'semester', 'faculty'],
    reply:
      'Academic structure: Institution → Academic Unit (faculty/school) → Department → Programme → Semesters → Subjects. Configured under Academics in the admin portal.',
  },
  {
    keys: ['support', 'help', 'contact', 'phone', 'email'],
    reply:
      'Alpha Bridge support: info@alpha-bridge.net, +250794006160, or WhatsApp via the floating button. For account issues, contact your institution administrator.',
  },
  {
    keys: ['password', 'forgot', 'reset password'],
    reply:
      'Use Forgot password on the sign-in page. An OTP is sent to your registered WhatsApp number to reset your password.',
  },
  {
    keys: ['assms', 'okusoma', 'system', 'what is'],
    reply:
      'ASSMS (African Students School Management System) is an all-in-one platform for admissions, academics, fees, library, hostel, canteen, letters, and more — configured per institution.',
  },
]

export function mboleReply(message: string): MboleReply {
  const q = message.toLowerCase().trim()
  if (!q) {
    return {
      text: 'Hello! I am Mbole, your ASSMS assistant. Ask about student signup, sign-in, admissions, fees, programmes, course registration, library, or institution onboarding.',
    }
  }

  for (const item of knowledge) {
    if (item.keys.some((key) => q.includes(key))) {
      return { text: item.reply }
    }
  }

  return {
    text: "I'm not fully sure about that. Would you like me to forward your question to Alpha Bridge support?",
    escalate: true,
  }
}
