import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Check, Copy, Minimize2, RotateCcw, Send, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { submitSupportTicket } from '../../api/landing'
import {
  clearAiConversation,
  fetchAiSuggestions,
  sendAiChat,
  sendAiFeedback,
  type AiAction,
  type AiChatMessage,
  type AiSource,
} from '../../api/ai'

const MBole_IMAGE = '/mbole-ai.png'

function MboleAvatar({ className = 'h-10 w-10' }: { className?: string }) {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return (
      <div className={`flex items-center justify-center rounded-full bg-[#1a56db]/10 text-[#1a56db] ${className}`}>
        <Bot className="h-5 w-5" />
      </div>
    )
  }
  return (
    <img
      src={MBole_IMAGE}
      alt="Okusoma AI"
      className={`object-contain ${className}`}
      onError={() => setBroken(true)}
    />
  )
}

function formatTime(value?: string | null) {
  if (!value) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MboleChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AiChatMessage[]>([
    { role: 'assistant', content: 'Hello! How can I help you today?' },
  ])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([
    'What is Okusoma?',
    'How much does Okusoma cost?',
    'How do I register my school?',
    'What modules are available?',
    'How do subscriptions work?',
    'How do I reset my password?',
  ])
  const [sending, setSending] = useState(false)
  const [statusLabel, setStatusLabel] = useState<string | null>(null)
  const [escalating, setEscalating] = useState(false)
  const [ticketForm, setTicketForm] = useState({ name: '', email: '', phone: '', institution: '', question: '' })
  const [submitting, setSubmitting] = useState(false)
  const [lastUserMessage, setLastUserMessage] = useState('')
  const [copiedId, setCopiedId] = useState<number | string | null>(null)
  const scroller = useRef<HTMLDivElement | null>(null)

  const locale = useMemo(() => (localStorage.getItem('locale') === 'fr' ? 'fr' : 'en'), [])

  useEffect(() => {
    fetchAiSuggestions(locale)
      .then((data) => {
        if (data.suggestions?.length) setSuggestions(data.suggestions)
      })
      .catch(() => undefined)
  }, [locale])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, escalating])

  async function ask(text: string) {
    const message = text.trim()
    if (!message || sending) return
    setLastUserMessage(message)
    setInput('')
    setEscalating(false)
    setSending(true)
    setStatusLabel('Searching Okusoma help…')
    setMessages((current) => [...current, { role: 'user', content: message, created_at: new Date().toISOString() }])
    try {
      const result = await sendAiChat(message, conversationId, locale)
      setConversationId(result.conversation_id)
      if (result.suggestions?.length) setSuggestions(result.suggestions)
      setStatusLabel(result.status_label || null)
      setMessages((current) => [
        ...current,
        {
          id: result.message_id,
          role: 'assistant',
          content: result.reply,
          sources: result.sources,
          actions: result.actions,
          created_at: new Date().toISOString(),
        },
      ])
      if (result.escalate) {
        setEscalating(true)
        setTicketForm((form) => ({ ...form, question: message }))
      }
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'I could not reach Okusoma AI right now. Please try again or email info@alpha-bridge.net.' },
      ])
    } finally {
      setSending(false)
      setStatusLabel(null)
    }
  }

  async function clearChat() {
    if (conversationId) {
      try {
        await clearAiConversation(conversationId)
      } catch {
        // Keep local clear even if the API is unavailable.
      }
    }
    setConversationId(null)
    setMessages([{ role: 'assistant', content: 'Hello! How can I help you today?' }])
    setEscalating(false)
  }

  async function copyReply(message: AiChatMessage, key: number | string) {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopiedId(key)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // Ignore clipboard errors.
    }
  }

  async function submitTicket(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await submitSupportTicket({ ...ticketForm, source: 'mbole' })
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Your question has been forwarded to Alpha Bridge support. We will contact you soon.' },
      ])
      setEscalating(false)
      setTicketForm({ name: '', email: '', phone: '', institution: '', question: '' })
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Unable to submit right now. Please email info@alpha-bridge.net directly.' },
      ])
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <div className="fixed bottom-4 right-4 z-40 w-[min(88vw,160px)]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <button type="button" onClick={() => setOpen(true)} className="block w-full bg-white p-2">
            <MboleAvatar className="mx-auto h-20 w-full" />
          </button>
          <div className="border-t border-slate-100 p-3">
            <p className="rounded-lg bg-slate-50 px-2 py-2 text-xs leading-relaxed text-slate-700">
              Hello! How can I help?
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-2 w-full rounded-full bg-[#1a56db] py-2 text-xs font-semibold text-white transition hover:bg-[#1e40af]"
            >
              Let&apos;s Chat
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex h-[min(78vh,560px)] w-[min(94vw,380px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <MboleAvatar className="h-9 w-9" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Okusoma AI</p>
            <p className="text-[10px] text-slate-500">Official help assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={clearChat} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Clear conversation">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Minimize chat">
            <Minimize2 className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close chat">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((msg, index) => {
          const key = msg.id || `${msg.role}-${index}`
          return (
            <div key={key} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user' ? 'bg-[#1a56db] text-white' : 'bg-slate-100 text-slate-800'}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`mt-1 text-[10px] ${msg.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}>{formatTime(msg.created_at)}</p>
                {msg.role !== 'user' && (
                  <MessageMeta
                    message={msg}
                    copied={copiedId === key}
                    onCopy={() => copyReply(msg, key)}
                    onRetry={() => lastUserMessage && ask(lastUserMessage)}
                  />
                )}
              </div>
            </div>
          )
        })}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#1a56db]" />
                {statusLabel || 'Checking your Okusoma account…'}
              </span>
            </div>
          </div>
        )}

        {!sending && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {suggestions.slice(0, 6).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => ask(item)}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 hover:border-[#1a56db] hover:text-[#1a56db]"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {escalating && (
          <form onSubmit={submitTicket} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <p className="font-semibold text-slate-800">Forward to support</p>
            <input required placeholder="Name" className="w-full rounded-lg border px-2 py-1.5" value={ticketForm.name} onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })} />
            <input required type="email" placeholder="Email" className="w-full rounded-lg border px-2 py-1.5" value={ticketForm.email} onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })} />
            <input placeholder="Phone" className="w-full rounded-lg border px-2 py-1.5" value={ticketForm.phone} onChange={(e) => setTicketForm({ ...ticketForm, phone: e.target.value })} />
            <input placeholder="Institution" className="w-full rounded-lg border px-2 py-1.5" value={ticketForm.institution} onChange={(e) => setTicketForm({ ...ticketForm, institution: e.target.value })} />
            <textarea required placeholder="Your question" rows={2} className="w-full rounded-lg border px-2 py-1.5" value={ticketForm.question} onChange={(e) => setTicketForm({ ...ticketForm, question: e.target.value })} />
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#1a56db] py-2 font-semibold text-white disabled:opacity-60">
              {submitting ? 'Sending…' : 'Send to Alpha Bridge'}
            </button>
          </form>
        )}
      </div>

      <div className="border-t border-slate-200 p-2">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask(input)}
            placeholder="Ask about Okusoma, pricing, admissions…"
            className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#1a56db]"
          />
          <button type="button" onClick={() => ask(input)} className="rounded-lg bg-[#1a56db] px-2.5 text-white" aria-label="Send message">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageMeta({
  message,
  copied,
  onCopy,
  onRetry,
}: {
  message: AiChatMessage
  copied: boolean
  onCopy: () => void
  onRetry: () => void
}) {
  const sources = message.sources || []
  const actions = message.actions || []

  return (
    <div className="mt-2 space-y-1.5">
      {sources.map((source: AiSource) => (
        <p key={`${source.label}-${source.title}`} className="text-[10px] text-slate-500">
          Source: {source.label || source.title}
          {source.href ? (
            <Link to={source.href} className="ml-2 font-semibold text-[#1a56db]">
              Read Guide
            </Link>
          ) : null}
        </p>
      ))}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {actions.map((action: AiAction) =>
            action.href.startsWith('http') ? (
              <a key={action.href} href={action.href} className="rounded-full bg-[#1a56db] px-2.5 py-1 text-[10px] font-semibold text-white">
                {action.label}
              </a>
            ) : (
              <Link key={action.href} to={action.href} className="rounded-full bg-[#1a56db] px-2.5 py-1 text-[10px] font-semibold text-white">
                {action.label}
              </Link>
            ),
          )}
        </div>
      )}
      <div className="flex items-center gap-1 text-slate-400">
        <button type="button" onClick={onCopy} className="rounded p-0.5 hover:bg-white" aria-label="Copy response">
          {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
        </button>
        <button type="button" onClick={onRetry} className="rounded p-0.5 hover:bg-white" aria-label="Retry response">
          <RotateCcw className="h-3 w-3" />
        </button>
        {message.id ? (
          <>
            <button type="button" onClick={() => sendAiFeedback(message.id as number, 'up')} className="rounded p-0.5 hover:bg-white" aria-label="Helpful">
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button type="button" onClick={() => sendAiFeedback(message.id as number, 'down')} className="rounded p-0.5 hover:bg-white" aria-label="Not helpful">
              <ThumbsDown className="h-3 w-3" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
