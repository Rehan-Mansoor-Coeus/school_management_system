import { useState } from 'react'
import { Send, X } from 'lucide-react'
import { mboleReply } from '../mboleBrain'
import { submitSupportTicket } from '../../api/landing'

type Message = { role: 'user' | 'mbole'; text: string }

const MBole_AVATAR = '/mbole-avatar.png'

export default function MboleChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'mbole', text: "Hello! I'm Mbole. How can I help you today?" },
  ])
  const [escalating, setEscalating] = useState(false)
  const [ticketForm, setTicketForm] = useState({ name: '', email: '', phone: '', institution: '', question: '' })
  const [submitting, setSubmitting] = useState(false)

  function send() {
    const text = input.trim()
    if (!text) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    const reply = mboleReply(text)
    setTimeout(() => {
      setMessages((m) => [...m, { role: 'mbole', text: reply.text }])
      if (reply.escalate) {
        setEscalating(true)
        setTicketForm((f) => ({ ...f, question: text }))
      }
    }, 400)
  }

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitSupportTicket({ ...ticketForm, source: 'mbole' })
      setMessages((m) => [...m, { role: 'mbole', text: 'Your question has been forwarded to Alpha Bridge support. We will contact you soon.' }])
      setEscalating(false)
      setTicketForm({ name: '', email: '', phone: '', institution: '', question: '' })
    } catch {
      setMessages((m) => [...m, { role: 'mbole', text: 'Unable to submit right now. Please email info@alpha-bridge.net directly.' }])
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <div className="fixed bottom-5 right-5 z-40 w-[min(92vw,260px)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex flex-col items-center bg-[#0f2744] px-4 pb-4 pt-5">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white">
              <img src={MBole_AVATAR} alt="" className="h-[4.5rem] w-[4.5rem] object-contain" />
              <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
            </div>
            <p className="mt-3 text-base font-bold text-white">Mbole</p>
            <p className="text-sm text-white/80">AI Secretary</p>
          </div>
          <div className="p-4">
            <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
              Hello! I&apos;m Mbole. How can I help you today?
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-3 w-full rounded-full bg-[#1a56db] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e40af]"
            >
              Let&apos;s Chat
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50 flex h-[min(70vh,540px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#0f2744] px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <img src={MBole_AVATAR} alt="" className="h-9 w-9 object-contain" />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-[#0f2744] bg-emerald-400" />
            </div>
            <div>
              <p className="font-semibold">Mbole</p>
              <p className="text-xs text-white/75">AI Secretary</p>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-white/10" aria-label="Close chat">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-[#1a56db] text-white' : 'bg-slate-100 text-slate-800'}`}>
                {msg.text}
              </div>
            </div>
          ))}

          {escalating && (
            <form onSubmit={submitTicket} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-800">Forward to support</p>
              <input required placeholder="Name" className="w-full rounded-lg border px-2 py-1.5" value={ticketForm.name} onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })} />
              <input required type="email" placeholder="Email" className="w-full rounded-lg border px-2 py-1.5" value={ticketForm.email} onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })} />
              <input placeholder="Phone" className="w-full rounded-lg border px-2 py-1.5" value={ticketForm.phone} onChange={(e) => setTicketForm({ ...ticketForm, phone: e.target.value })} />
              <input placeholder="Institution" className="w-full rounded-lg border px-2 py-1.5" value={ticketForm.institution} onChange={(e) => setTicketForm({ ...ticketForm, institution: e.target.value })} />
              <textarea required placeholder="Your question" rows={3} className="w-full rounded-lg border px-2 py-1.5" value={ticketForm.question} onChange={(e) => setTicketForm({ ...ticketForm, question: e.target.value })} />
              <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#1a56db] py-2 font-semibold text-white disabled:opacity-60">
                {submitting ? 'Sending…' : 'Send to Alpha Bridge'}
              </button>
            </form>
          )}
        </div>

        <div className="border-t border-slate-200 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask Mbole…"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
            />
            <button type="button" onClick={send} className="rounded-xl bg-[#1a56db] px-3 text-white" aria-label="Send message">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
