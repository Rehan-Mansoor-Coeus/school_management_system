import api from './client'

export type AiSource = {
  title?: string
  label?: string
  href?: string | null
  category?: string
}

export type AiAction = {
  label: string
  href: string
}

export type AiChatResponse = {
  conversation_id: number
  message_id?: number
  reply: string
  sources?: AiSource[]
  actions?: AiAction[]
  escalate?: boolean
  status_label?: string | null
  suggestions?: string[]
  authenticated?: boolean
  role?: string
}

export type AiChatMessage = {
  id?: number
  role: 'user' | 'assistant' | 'mbole'
  content: string
  sources?: AiSource[]
  actions?: AiAction[]
  created_at?: string | null
  pending?: boolean
}

function visitorToken(): string {
  const key = 'okusoma_ai_visitor'
  let token = localStorage.getItem(key)
  if (!token) {
    token = Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(key, token)
  }
  return token
}

export async function sendAiChat(message: string, conversationId?: number | null, locale = 'en') {
  const { data } = await api.post<AiChatResponse>('/ai/chat', {
    message,
    conversation_id: conversationId || undefined,
    locale,
    visitor_token: visitorToken(),
  })
  return data
}

export async function fetchAiConversation(id: number) {
  const { data } = await api.get(`/ai/conversations/${id}`, { params: { visitor_token: visitorToken() } })
  return data
}

export async function clearAiConversation(id: number) {
  const { data } = await api.post(`/ai/conversations/${id}/clear`, { visitor_token: visitorToken() })
  return data
}

export async function sendAiFeedback(messageId: number, rating: 'up' | 'down') {
  const { data } = await api.post(`/ai/messages/${messageId}/feedback`, {
    rating,
    visitor_token: visitorToken(),
  })
  return data
}

export async function fetchAiSuggestions(locale = 'en') {
  const { data } = await api.get('/ai/suggestions', { params: { locale } })
  return data as { suggestions: string[]; authenticated: boolean; role: string }
}

export async function fetchAiKnowledge(params: Record<string, string | number | boolean | undefined> = {}) {
  const { data } = await api.get('/ai/knowledge', { params })
  return data
}

export async function saveAiArticle(payload: Record<string, unknown>, id?: number) {
  if (id) {
    const { data } = await api.put(`/ai/knowledge/${id}`, payload)
    return data
  }
  const { data } = await api.post('/ai/knowledge', payload)
  return data
}

export async function setAiArticleStatus(id: number, isActive: boolean) {
  const { data } = await api.put(`/ai/knowledge/${id}/status`, { is_active: isActive })
  return data
}

export async function fetchAiAnalytics() {
  const { data } = await api.get('/ai/knowledge/analytics')
  return data
}
