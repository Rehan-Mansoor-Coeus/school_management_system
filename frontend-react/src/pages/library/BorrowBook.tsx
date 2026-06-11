import { useEffect, useState } from 'react'
import { BookMarked, Search } from 'lucide-react'
import { searchLibraryBooks, createBorrowRequest, type LibraryBook } from '../../api/library'
import { Button, Card, EmptyState, Field, PageHeader, Spinner, Stars, inputClass } from '../../components/library/LibraryUi'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../components/ui/ToastProvider'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function BorrowBook() {
  const { pushToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [books, setBooks] = useState<LibraryBook[]>([])
  const [selected, setSelected] = useState<LibraryBook | null>(null)
  const [from, setFrom] = useState(today())
  const [returnDate, setReturnDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function search() {
    setLoading(true)
    try {
      const res = await searchLibraryBooks({ q: q || undefined, status: 'active' })
      setBooks(res.data)
    } catch {
      pushToast('Search failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(search, 350)
    return () => clearTimeout(t)
  }, [q])

  function openBorrow(book: LibraryBook) {
    setSelected(book)
    setFrom(today())
    setReturnDate('')
  }

  async function submit() {
    if (!selected) return
    setSubmitting(true)
    try {
      await createBorrowRequest({
        book_id: selected.id,
        requested_from_datetime: from,
        expected_return_date: returnDate || undefined,
      })
      pushToast('Borrow request submitted and awaiting approval', 'success')
      setSelected(null)
      search()
    } catch (e: any) {
      const data = e?.response?.data
      let msg = data?.message || 'Failed to submit request'
      if (data?.next_available_date) msg += ` Next available: ${data.next_available_date}.`
      pushToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader title="Borrow a Book" subtitle="Search the catalogue and request a book" icon={BookMarked} />

      <Card className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className={`${inputClass} pl-9`} placeholder="Search by title, author, ISBN, keyword…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : books.length === 0 ? (
        <EmptyState message="No books match your search." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => {
            const av = book.availability
            const available = av?.is_available
            return (
              <Card key={book.id}>
                <div className="flex gap-3">
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt="" className="h-24 w-16 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-300">
                      <BookMarked className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-800">{book.title}</h3>
                    <p className="truncate text-sm text-slate-500">{book.author || 'Unknown author'}</p>
                    <div className="mt-1"><Stars value={book.average_rating} /></div>
                    <p className="mt-1 text-xs text-slate-500">
                      {book.category?.name || 'Uncategorised'} · Shelf {book.shelf_location || '—'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {available ? (
                    <span className="text-sm font-medium text-emerald-600">{av?.available_copies} available</span>
                  ) : (
                    <span className="text-sm text-rose-500">
                      Unavailable{av?.next_available_date ? ` · back ${av.next_available_date}` : ''}
                    </span>
                  )}
                  <Button onClick={() => openBorrow(book)}>Request</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        title={`Borrow: ${selected?.title || ''}`}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Request'}</Button>
          </div>
        }
      >
        {selected ? (
          <div className="space-y-4">
            {!selected.availability?.is_available && (
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
                No copies are currently available
                {selected.availability?.next_available_date ? `. Expected back on ${selected.availability.next_available_date}.` : '.'} You may
                request a future period (reservation).
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Borrow from">
                <input type="date" className={inputClass} value={from} min={today()} onChange={(e) => setFrom(e.target.value)} />
              </Field>
              <Field label="Expected return date">
                <input type="date" className={inputClass} value={returnDate} min={from} onChange={(e) => setReturnDate(e.target.value)} />
              </Field>
            </div>
            <p className="text-xs text-slate-500">Leave the return date blank to use the maximum allowed borrowing duration.</p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
