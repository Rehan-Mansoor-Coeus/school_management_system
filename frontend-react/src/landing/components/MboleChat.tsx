import { useState } from 'react'
import { Send, X } from 'lucide-react'
import { mboleReply } from '../mboleBrain'
import { submitSupportTicket } from '../../api/landing'

type Message = { role: 'user' | 'mbole'; text: string }

const MBole_IMAGE = '/mbole-ai.png'

export default function MboleChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'mbole', text: "Hello! How can I help you today?" },
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
      <div className="fixed bottom-5 right-5 z-40 w-[min(92vw,240px)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <button type="button" onClick={() => setOpen(true)} className="block w-full bg-white p-2">
            <img src={MBole_IMAGE} alt="Assistant" className="mx-auto h-44 w-full object-contain" />
          </button>
          <div className="border-t border-slate-100 p-4 pt-2">
            <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
              Hello! How can I help you today?
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
    <div className="fixed bottom-5 right-5 z-50 flex h-[min(70vh,540px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-3 py-2">
        <img src={MBole_IMAGE} alt="" className="h-14 object-contain" />
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close chat">
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
            placeholder="Type your question…"
            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1a56db]"
          />
          <button type="button" onClick={send} className="rounded-xl bg-[#1a56db] px-3 text-white" aria-label="Send message">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
