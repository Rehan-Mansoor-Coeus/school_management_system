import { useEffect, useState } from 'react'
import { Tags, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  fetchLibraryCategories,
  createLibraryCategory,
  updateLibraryCategory,
  deleteLibraryCategory,
  type LibraryCategory,
} from '../../api/library'
import { Button, EmptyState, Field, PageHeader, Spinner, StatusBadge, TableWrap, inputClass, tdClass, thClass } from '../../components/library/LibraryUi'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../components/ui/ToastProvider'

export default function BookCategories() {
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<LibraryCategory[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<LibraryCategory | null>(null)
  const [form, setForm] = useState({ name: '', description: '', status: 'active' })

  async function load() {
    setLoading(true)
    try {
      const res = await fetchLibraryCategories()
      setItems(res.data)
    } catch {
      pushToast('Failed to load categories', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', description: '', status: 'active' })
    setOpen(true)
  }

  function openEdit(cat: LibraryCategory) {
    setEditing(cat)
    setForm({ name: cat.name, description: cat.description || '', status: cat.status })
    setOpen(true)
  }

  async function submit() {
    if (!form.name.trim()) {
      pushToast('Name is required', 'error')
      return
    }
    try {
      if (editing) {
        await updateLibraryCategory(editing.id, form)
        pushToast('Category updated', 'success')
      } else {
        await createLibraryCategory(form)
        pushToast('Category created', 'success')
      }
      setOpen(false)
      load()
    } catch {
      pushToast('Failed to save category', 'error')
    }
  }

  async function remove(cat: LibraryCategory) {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return
    try {
      await deleteLibraryCategory(cat.id)
      pushToast('Category deleted', 'success')
      load()
    } catch {
      pushToast('Failed to delete category', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Book Categories"
        subtitle="Organise books into categories"
        icon={Tags}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Category
          </Button>
        }
      />

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState message="No categories yet. Create your first one." />
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={thClass}>Name</th>
              <th className={thClass}>Description</th>
              <th className={thClass}>Books</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50">
                <td className={`${tdClass} font-medium text-slate-800`}>{cat.name}</td>
                <td className={`${tdClass} max-w-xs truncate text-slate-500`}>{cat.description || '—'}</td>
                <td className={tdClass}>{cat.books_count ?? 0}</td>
                <td className={tdClass}><StatusBadge status={cat.status} /></td>
                <td className={tdClass}>
                  <div className="flex gap-1">
                    <Button variant="ghost" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" className="text-rose-600" onClick={() => remove(cat)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal
        title={editing ? 'Edit Category' : 'New Category'}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Name" required>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Description">
            <textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  )
}
