type MboleReply = { text: string; escalate?: boolean }

const knowledge: Array<{ keys: string[]; reply: string }> = [
  {
    keys: ['admission', 'apply', 'application', 'register as student'],
    reply: 'Students apply through Admissions: select your institution, complete the application, pay the registration fee, and await approval. Start at Register as Student on our homepage.',
  },
  {
    keys: ['registration fee', 'fee', 'cost', 'price', 'pay', 'payment'],
    reply: 'Registration fees are set by each institution and shown when you select an institution. Platform pricing is also listed in our Pricing section.',
  },
  {
    keys: ['program', 'programme', 'course', 'subject'],
    reply: 'Available programmes and courses are listed on each institution profile. Go to Register as Student and search for your institution.',
  },
  {
    keys: ['library', 'book', 'borrow', 'qr'],
    reply: 'Our Library module supports book registration, borrow requests, QR issue/return, due reminders, fines, and book reviews.',
  },
  {
    keys: ['demo', 'demonstration', 'trial'],
    reply: 'Book a demo using the Book Demo button on the homepage, or contact us at info@alpha-bridge.net or +250794006160.',
  },
  {
    keys: ['institution', 'school', 'university', 'college', 'onboard'],
    reply: 'Institutions can request registration via Request Institution Registration. Our team reviews every request manually.',
  },
  {
    keys: ['support', 'help', 'contact', 'phone', 'email'],
    reply: 'Reach Alpha Bridge at info@alpha-bridge.net or +250794006160. You can also use WhatsApp from the floating button.',
  },
  {
    keys: ['login', 'sign in', 'admin', 'portal'],
    reply: 'Staff and students sign in via the Admin Portal at /admin after their account is approved.',
  },
]

export function mboleReply(message: string): MboleReply {
  const q = message.toLowerCase().trim()
  if (!q) {
    return { text: 'Hello! I am Mbole, your ASSMS assistant. Ask me about admissions, fees, programmes, library, or demos.' }
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
