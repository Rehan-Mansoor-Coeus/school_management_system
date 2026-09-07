import { useEffect, useState } from 'react'
import { Loader2, Plus, Save } from 'lucide-react'
import { fetchAiAnalytics, fetchAiKnowledge, saveAiArticle, setAiArticleStatus } from '../../api/ai'
import { formatApiError } from '../../utils/apiError'

const CATEGORIES = [
  'getting_started', 'pricing', 'licensing', 'subscriptions', 'students', 'teachers',
  'finance', 'admissions', 'results', 'timetable', 'library', 'hr', 'payroll',
  'security', 'passwords', 'troubleshooting', 'institution_management', 'faq',
]

type Article = {
  id: number
  title: string
  slug: string
  category: string
  audience: string
  content: string
  keywords?: string | null
  is_public: boolean
  is_active: boolean
  source_type?: string
  source_reference?: string | null
}

const emptyForm = {
  title: '',
  slug: '',
  category: 'faq',
  audience: 'public',
  content: '',
  keywords: '',
  source_reference: '',
  is_public: true,
  is_active: true,
}

export default function AiKnowledgeManagerPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [analytics, setAnalytics] = useState<Record<string, number>>({})
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Article | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [list, stats] = await Promise.all([
        fetchAiKnowledge({ q: q || undefined, category: category || undefined }),
        fetchAiAnalytics(),
      ])
      setArticles(list.data?.data || list.data || [])
      setAnalytics(stats || {})
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startCreate() {
    setCreating(true)
    setEditing(null)
    setForm(emptyForm)
  }

  function startEdit(article: Article) {
    setCreating(false)
    setEditing(article)
    setForm({
      title: article.title,
      slug: article.slug,
      category: article.category,
      audience: article.audience,
      content: article.content,
      keywords: article.keywords || '',
      source_reference: article.source_reference || '',
      is_public: article.is_public,
      is_active: article.is_active,
    })
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      await saveAiArticle(form, editing?.id)
      setCreating(false)
      setEditing(null)
      await load()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">AI Knowledge Manager</h1>
          <p className="text-sm text-slate-600">Publish and edit the official Okusoma AI knowledge base. Changes are live without a redeploy.</p>
        </div>
        <button type="button" onClick={startCreate} className="inline-flex items-center gap-2 rounded-full bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" /> New article
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Articles', analytics.articles],
          ['Published', analytics.published],
          ['Conversations', analytics.conversations],
          ['Thumbs up', analytics.feedback_up],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1e3a5f]">{value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="">All categories</option>
          {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button type="button" onClick={load} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">Search</button>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}
      {loading && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}

      {(creating || editing) && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-3">
            <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <select className="rounded-xl border px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="rounded-xl border px-3 py-2 text-sm" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
              <option value="public">public</option>
              <option value="student">student</option>
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Keywords" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
          <textarea className="w-full rounded-xl border px-3 py-2 text-sm" rows={8} placeholder="Article content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} /> Public
          </label>
          <button type="button" disabled={saving} onClick={save} className="inline-flex items-center gap-2 rounded-full bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save article'}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#1e3a5f] text-white">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">{article.title}</td>
                <td className="px-3 py-2 text-slate-500">{article.category}</td>
                <td className="px-3 py-2">{article.is_active ? 'Published' : 'Disabled'}</td>
                <td className="px-3 py-2">
                  <button type="button" className="mr-3 text-[#1a56db]" onClick={() => startEdit(article)}>Edit</button>
                  <button
                    type="button"
                    className="text-slate-600"
                    onClick={async () => {
                      await setAiArticleStatus(article.id, !article.is_active)
                      load()
                    }}
                  >
                    {article.is_active ? 'Disable' : 'Publish'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
