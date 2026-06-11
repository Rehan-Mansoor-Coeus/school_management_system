import { useEffect, useState } from 'react'
import { BookPlus, Plus, Pencil, Trash2, Search, Eye } from 'lucide-react'
import {
  fetchLibraryBooks,
  createLibraryBook,
  updateLibraryBook,
  deleteLibraryBook,
  fetchLibraryCategories,
  fetchLibrarySettings,
  fetchLibraryBook,
  type LibraryBook,
  type LibraryCategory,
  type LibrarySettings,
} from '../../api/library'
import {
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Spinner,
  Stars,
  StatusBadge,
  TableWrap,
  inputClass,
  tdClass,
  thClass,
} from '../../components/library/LibraryUi'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../components/ui/ToastProvider'

const emptyForm = {
  title: '',
  category_id: '',
  isbn: '',
  author: '',
  publisher: '',
  publication_year: '',
  edition: '',
  language: '',
  shelf_location: '',
  description: '',
  status: 'active',
  number_of_copies: '1',
  accession_prefix: '',
}

export default function RegisterBook() {
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<LibraryBook[]>([])
  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [settings, setSettings] = useState<LibrarySettings | null>(null)
  const [q, setQ] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LibraryBook | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [cover, setCover] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const [detail, setDetail] = useState<any | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetchLibraryBooks({ q: q || undefined, category_id: categoryId || undefined })
      setBooks(res.data)
    } catch {
      pushToast('Failed to load books', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLibraryCategories().then((r) => setCategories(r.data)).catch(() => {})
    fetchLibrarySettings().then((r) => setSettings(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [q, categoryId])

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm })
    setCover(null)
    setOpen(true)
  }

  function openEdit(book: LibraryBook) {
    setEditing(book)
    setForm({
      title: book.title || '',
      category_id: book.category_id ? String(book.category_id) : '',
      isbn: book.isbn || '',
      author: book.author || '',
      publisher: book.publisher || '',
      publication_year: book.publication_year || '',
      edition: book.edition || '',
      language: book.language || '',
      shelf_location: book.shelf_location || '',
      description: book.description || '',
      status: book.status || 'active',
    })
    setCover(null)
    setOpen(true)
  }

  async function submit() {
    if (!form.title.trim()) {
      pushToast('Title is required', 'error')
      return
    }
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) fd.append(k, String(v))
      })
      if (cover) fd.append('cover_image', cover)
      if (editing) {
        await updateLibraryBook(editing.id, fd)
        pushToast('Book updated', 'success')
      } else {
        const res = await createLibraryBook(fd)
        const copiesCreated = res.data?.copies_created ?? 0
        pushToast(
          copiesCreated > 0
            ? `Book registered with ${copiesCreated} physical copy/copies`
            : 'Book registered',
          'success',
        )
      }
      setOpen(false)
      load()
    } catch (e: any) {
      const data = e?.response?.data
      const msg =
        data?.message ||
        data?.errors?.isbn?.[0] ||
        data?.errors?.title?.[0] ||
        'Failed to save book'
      pushToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove(book: LibraryBook) {
    if (!window.confirm(`Delete "${book.title}"?`)) return
    try {
      await deleteLibraryBook(book.id)
      pushToast('Book deleted', 'success')
      load()
    } catch {
      pushToast('Failed to delete book', 'error')
    }
  }

  async function viewDetail(book: LibraryBook) {
    try {
      const res = await fetchLibraryBook(book.id)
      setDetail(res.data)
    } catch {
      pushToast('Failed to load book', 'error')
    }
  }

  const req = (field: keyof LibrarySettings) => Boolean(settings && (settings as any)[field])

  return (
    <div>
      <PageHeader
        title="Register Book"
        subtitle="Catalogue and manage your books"
        icon={BookPlus}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Register Book
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className={`${inputClass} pl-9`} placeholder="Search by title, author, ISBN…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className={`${inputClass} sm:w-56`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : books.length === 0 ? (
        <EmptyState message="No books found." />
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={thClass}>Title</th>
              <th className={thClass}>Author</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Shelf</th>
              <th className={thClass}>Copies</th>
              <th className={thClass}>Rating</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {books.map((book) => (
              <tr key={book.id} className="hover:bg-slate-50">
                <td className={`${tdClass} font-medium text-slate-800`}>
                  <div className="flex items-center gap-3">
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt="" className="h-10 w-8 rounded object-cover" />
                    ) : null}
                    <span>{book.title}</span>
                  </div>
                </td>
                <td className={tdClass}>{book.author || '—'}</td>
                <td className={tdClass}>{book.category?.name || '—'}</td>
                <td className={tdClass}>{book.shelf_location || '—'}</td>
                <td className={tdClass}>
                  <span className="text-emerald-600">{book.availability?.available_copies ?? 0}</span>
                  <span className="text-slate-400"> / {book.availability?.total_copies ?? 0}</span>
                </td>
                <td className={tdClass}><Stars value={book.average_rating} /></td>
                <td className={tdClass}><StatusBadge status={book.status} /></td>
                <td className={tdClass}>
                  <div className="flex gap-1">
                    <Button variant="ghost" onClick={() => viewDetail(book)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" onClick={() => openEdit(book)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" className="text-rose-600" onClick={() => remove(book)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal
        title={editing ? 'Edit Book' : 'Register Book'}
        open={open}
        onClose={() => setOpen(false)}
        wide
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Register'}</Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required>
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="ISBN" required={req('isbn_mandatory')}>
            <input className={inputClass} value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
          </Field>
          <Field label="Author" required={req('author_mandatory')}>
            <input className={inputClass} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </Field>
          <Field label="Publisher" required={req('publisher_mandatory')}>
            <input className={inputClass} value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
          </Field>
          <Field label="Publication Year" required={req('publication_year_mandatory')}>
            <input className={inputClass} value={form.publication_year} onChange={(e) => setForm({ ...form, publication_year: e.target.value })} />
          </Field>
          <Field label="Edition">
            <input className={inputClass} value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} />
          </Field>
          <Field label="Language">
            <input className={inputClass} value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
          </Field>
          <Field label="Shelf Location" required={req('shelf_location_mandatory')}>
            <input className={inputClass} placeholder="e.g. Shelf A22" value={form.shelf_location} onChange={(e) => setForm({ ...form, shelf_location: e.target.value })} />
          </Field>
          {!editing ? (
            <>
              <Field label="Number of Copies">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputClass}
                  value={form.number_of_copies}
                  onChange={(e) => setForm({ ...form, number_of_copies: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-500">
                  How many physical copies to add now. Each gets a unique accession number (e.g. ACC-2-001).
                </p>
              </Field>
              <Field label="Accession Prefix (optional)">
                <input
                  className={inputClass}
                  placeholder="e.g. TSING (generates TSING-001, TSING-002…)"
                  value={form.accession_prefix}
                  onChange={(e) => setForm({ ...form, accession_prefix: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Accession number = unique ID stamped on each physical copy for tracking and shelf lookup.
                </p>
              </Field>
            </>
          ) : null}
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Cover Image (optional)">
              <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} className="text-sm text-slate-600" />
            </Field>
          </div>
        </div>
      </Modal>

      <Modal title={detail?.title || 'Book'} open={Boolean(detail)} onClose={() => setDetail(null)} wide>
        {detail ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <div><span className="text-slate-400">Author:</span> {detail.author || '—'}</div>
              <div><span className="text-slate-400">ISBN:</span> {detail.isbn || '—'}</div>
              <div><span className="text-slate-400">Shelf:</span> {detail.shelf_location || '—'}</div>
              <div><span className="text-slate-400">Borrows:</span> {detail.borrow_count ?? 0}</div>
              <div><Stars value={detail.average_rating} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <div className="text-lg font-bold text-slate-800">{detail.availability?.total_copies ?? 0}</div>
                <div className="text-xs text-slate-500">Total copies</div>
              </div>
              <div className="rounded-xl bg-emerald-50 p-3 text-center">
                <div className="text-lg font-bold text-emerald-700">{detail.availability?.available_copies ?? 0}</div>
                <div className="text-xs text-slate-500">Available</div>
              </div>
              <div className="rounded-xl bg-violet-50 p-3 text-center">
                <div className="text-lg font-bold text-violet-700">{detail.availability?.borrowed_copies ?? 0}</div>
                <div className="text-xs text-slate-500">Borrowed</div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Reviews</h3>
              {(detail.reviews || []).length === 0 ? (
                <p className="text-sm text-slate-400">No reviews yet.</p>
              ) : (
                <ul className="space-y-2">
                  {detail.reviews.map((r: any) => (
                    <li key={r.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{r.user_name || 'User'}</span>
                        <Stars value={r.rating} />
                      </div>
                      {r.comment ? <p className="mt-1 text-sm text-slate-600">{r.comment}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
