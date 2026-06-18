import { useEffect, useState } from 'react'
import { Copy as CopyIcon, Plus, Pencil, Trash2, Search, Layers } from 'lucide-react'
import {
  fetchBookCopies,
  createBookCopy,
  createBookCopiesBulk,
  suggestAccessionNumber,
  updateBookCopy,
  deleteBookCopy,
  type LibraryBookCopy,
} from '../../api/library'
import BookSearchSelect from '../../components/library/BookSearchSelect'
import { Button, Card, EmptyState, Field, PageHeader, Spinner, StatusBadge, TableWrap, inputClass, tdClass, thClass } from '../../components/library/LibraryUi'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../components/ui/ToastProvider'

const emptySingle = {
  book_id: '',
  copy_code: '',
  barcode: '',
  shelf_location: '',
  condition: 'good',
  status: 'available',
  accession_prefix: '',
}

const emptyBulk = {
  book_id: '',
  quantity: '1',
  accession_prefix: '',
  shelf_location: '',
  condition: 'good',
  status: 'available',
}

export default function BookCopies() {
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [copies, setCopies] = useState<LibraryBookCopy[]>([])
  const [q, setQ] = useState('')
  const [bookFilter, setBookFilter] = useState('')
  const [singleOpen, setSingleOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editing, setEditing] = useState<LibraryBookCopy | null>(null)
  const [singleForm, setSingleForm] = useState({ ...emptySingle })
  const [bulkForm, setBulkForm] = useState({ ...emptyBulk })
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetchBookCopies({ q: q || undefined, book_id: bookFilter || undefined })
      setCopies(res.data)
    } catch {
      pushToast('Failed to load copies', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [q, bookFilter])

  function openSingleCreate() {
    setEditing(null)
    setSingleForm({ ...emptySingle, book_id: bookFilter || '' })
    setSingleOpen(true)
  }

  function openBulkCreate() {
    setBulkForm({ ...emptyBulk, book_id: bookFilter || '' })
    setBulkOpen(true)
  }

  function openEdit(copy: LibraryBookCopy) {
    setEditing(copy)
    setSingleForm({
      book_id: String(copy.book_id),
      copy_code: copy.copy_code,
      barcode: copy.barcode || '',
      shelf_location: copy.shelf_location || '',
      condition: copy.condition,
      status: copy.status,
      accession_prefix: '',
    })
    setSingleOpen(true)
  }

  async function suggestCode() {
    if (!singleForm.book_id) {
      pushToast('Select a book first', 'error')
      return
    }
    try {
      const res = await suggestAccessionNumber(
        Number(singleForm.book_id),
        singleForm.accession_prefix || undefined,
      )
      setSingleForm((f) => ({ ...f, copy_code: res.data.suggested_copy_code }))
    } catch {
      pushToast('Could not suggest accession number', 'error')
    }
  }

  async function submitSingle() {
    if (!singleForm.book_id) {
      pushToast('Select a book', 'error')
      return
    }
    if (editing && !singleForm.copy_code.trim()) {
      pushToast('Accession number is required when editing', 'error')
      return
    }
    setBusy(true)
    try {
      if (editing) {
        await updateBookCopy(editing.id, {
          copy_code: singleForm.copy_code,
          barcode: singleForm.barcode,
          shelf_location: singleForm.shelf_location,
          condition: singleForm.condition,
          status: singleForm.status,
        })
        pushToast('Copy updated', 'success')
      } else {
        await createBookCopy({
          book_id: Number(singleForm.book_id),
          copy_code: singleForm.copy_code.trim() || undefined,
          barcode: singleForm.barcode || undefined,
          shelf_location: singleForm.shelf_location || undefined,
          condition: singleForm.condition,
          status: singleForm.status,
          accession_prefix: singleForm.accession_prefix || undefined,
        })
        pushToast('Copy added', 'success')
      }
      setSingleOpen(false)
      load()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to save copy', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function submitBulk() {
    if (!bulkForm.book_id) {
      pushToast('Select a book', 'error')
      return
    }
    const qty = parseInt(bulkForm.quantity || '0', 10)
    if (qty < 1) {
      pushToast('Quantity must be at least 1', 'error')
      return
    }
    setBusy(true)
    try {
      const res = await createBookCopiesBulk({
        book_id: Number(bulkForm.book_id),
        quantity: qty,
        accession_prefix: bulkForm.accession_prefix || undefined,
        shelf_location: bulkForm.shelf_location || undefined,
        condition: bulkForm.condition,
        status: bulkForm.status,
      })
      pushToast(res.data?.message || `${qty} copies added`, 'success')
      setBulkOpen(false)
      load()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to add copies', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove(copy: LibraryBookCopy) {
    if (!window.confirm(`Delete copy "${copy.copy_code}"?`)) return
    try {
      await deleteBookCopy(copy.id)
      pushToast('Copy deleted', 'success')
      load()
    } catch (e: any) {
      pushToast(e?.response?.data?.message || 'Failed to delete copy', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Book Copies"
        subtitle="Each physical book has its own accession number for tracking"
        icon={CopyIcon}
        actions={
          <>
            <Button variant="secondary" onClick={openBulkCreate}>
              <Layers className="h-4 w-4" /> Add Multiple Copies
            </Button>
            <Button onClick={openSingleCreate}>
              <Plus className="h-4 w-4" /> Add Copy
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input className={`${inputClass} pl-9`} placeholder="Search accession number or barcode…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="sm:w-72">
            <BookSearchSelect value={bookFilter} onChange={setBookFilter} placeholder="Filter by book…" />
          </div>
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : copies.length === 0 ? (
        <EmptyState message="No copies yet. Register a book with copies, or add copies here." />
      ) : (
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={thClass}>Accession No.</th>
              <th className={thClass}>Book</th>
              <th className={thClass}>Barcode</th>
              <th className={thClass}>Shelf</th>
              <th className={thClass}>Condition</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {copies.map((copy) => (
              <tr key={copy.id} className="hover:bg-slate-50">
                <td className={`${tdClass} font-medium text-slate-800`}>{copy.copy_code}</td>
                <td className={tdClass}>{copy.book?.title || '—'}</td>
                <td className={tdClass}>{copy.barcode || '—'}</td>
                <td className={tdClass}>{copy.shelf_location || '—'}</td>
                <td className={`${tdClass} capitalize`}>{copy.condition}</td>
                <td className={tdClass}><StatusBadge status={copy.status} /></td>
                <td className={tdClass}>
                  <div className="flex gap-1">
                    <Button variant="ghost" onClick={() => openEdit(copy)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" className="text-rose-600" onClick={() => remove(copy)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {/* Single copy */}
      <Modal
        title={editing ? 'Edit Copy' : 'Add Copy'}
        open={singleOpen}
        onClose={() => setSingleOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSingleOpen(false)}>Cancel</Button>
            <Button onClick={submitSingle} disabled={busy}>{busy ? 'Saving…' : editing ? 'Update' : 'Add'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Book" required>
            <BookSearchSelect
              value={singleForm.book_id}
              onChange={(book_id) => setSingleForm({ ...singleForm, book_id })}
              disabled={Boolean(editing)}
            />
          </Field>
          {!editing ? (
            <Field label="Accession Prefix (optional)">
              <input
                className={inputClass}
                placeholder="e.g. TSING"
                value={singleForm.accession_prefix}
                onChange={(e) => setSingleForm({ ...singleForm, accession_prefix: e.target.value })}
              />
            </Field>
          ) : null}
          <Field label="Accession Number / Copy Code">
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Leave blank to auto-generate"
                value={singleForm.copy_code}
                onChange={(e) => setSingleForm({ ...singleForm, copy_code: e.target.value })}
              />
              {!editing ? (
                <Button type="button" variant="secondary" onClick={suggestCode}>Suggest</Button>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              The accession number is the unique label on each physical copy (e.g. ACC-2-001). Used for shelf tracking and borrowing.
            </p>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Barcode / QR">
              <input className={inputClass} value={singleForm.barcode} onChange={(e) => setSingleForm({ ...singleForm, barcode: e.target.value })} />
            </Field>
            <Field label="Shelf Location">
              <input className={inputClass} value={singleForm.shelf_location} onChange={(e) => setSingleForm({ ...singleForm, shelf_location: e.target.value })} />
            </Field>
            <Field label="Condition">
              <select className={inputClass} value={singleForm.condition} onChange={(e) => setSingleForm({ ...singleForm, condition: e.target.value })}>
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="damaged">Damaged</option>
                <option value="lost">Lost</option>
              </select>
            </Field>
            <Field label="Status">
              <select className={inputClass} value={singleForm.status} onChange={(e) => setSingleForm({ ...singleForm, status: e.target.value })}>
                {['available', 'requested', 'borrowed', 'reserved', 'overdue', 'lost', 'damaged'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Modal>

      {/* Bulk copies */}
      <Modal
        title="Add Multiple Copies"
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={submitBulk} disabled={busy}>{busy ? 'Adding…' : 'Add Copies'}</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Search & Select Book" required>
            <BookSearchSelect value={bulkForm.book_id} onChange={(book_id) => setBulkForm({ ...bulkForm, book_id })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Number of Copies" required>
              <input
                type="number"
                min={1}
                max={100}
                className={inputClass}
                value={bulkForm.quantity}
                onChange={(e) => setBulkForm({ ...bulkForm, quantity: e.target.value })}
              />
            </Field>
            <Field label="Accession Prefix (optional)">
              <input
                className={inputClass}
                placeholder="e.g. TSING → TSING-001, TSING-002…"
                value={bulkForm.accession_prefix}
                onChange={(e) => setBulkForm({ ...bulkForm, accession_prefix: e.target.value })}
              />
            </Field>
            <Field label="Shelf Location">
              <input className={inputClass} value={bulkForm.shelf_location} onChange={(e) => setBulkForm({ ...bulkForm, shelf_location: e.target.value })} />
            </Field>
            <Field label="Condition">
              <select className={inputClass} value={bulkForm.condition} onChange={(e) => setBulkForm({ ...bulkForm, condition: e.target.value })}>
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="damaged">Damaged</option>
                <option value="lost">Lost</option>
              </select>
            </Field>
          </div>
          <p className="text-xs text-slate-500">
            Accession numbers will be generated automatically for each copy. Example: with prefix &quot;TSING&quot; and quantity 3 → TSING-001, TSING-002, TSING-003.
          </p>
        </div>
      </Modal>
    </div>
  )
}
