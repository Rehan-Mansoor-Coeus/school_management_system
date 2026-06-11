import { useEffect, useMemo, useState } from 'react'
import { searchLibraryBooks, type LibraryBook } from '../../api/library'
import SearchableSelect from '../ui/SearchableSelect'

type BookSearchSelectProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

function bookLabel(book: LibraryBook): string {
  const parts = [book.title]
  if (book.author) parts.push(`by ${book.author}`)
  if (book.isbn) parts.push(`ISBN ${book.isbn}`)
  return parts.join(' · ')
}

export default function BookSearchSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Search book by title, author, ISBN…',
}: BookSearchSelectProps) {
  const [books, setBooks] = useState<LibraryBook[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    searchLibraryBooks({ status: 'active' })
      .then((res) => {
        if (active) setBooks(res.data || [])
      })
      .catch(() => {
        if (active) setBooks([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const options = useMemo(
    () =>
      books.map((book) => ({
        value: String(book.id),
        label: bookLabel(book),
      })),
    [books],
  )

  if (disabled) {
    const selected = books.find((b) => String(b.id) === value)
    return (
      <input
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-500 shadow-sm"
        value={selected ? bookLabel(selected) : value ? `Book #${value}` : ''}
        disabled
        readOnly
      />
    )
  }

  return (
    <div>
      <SearchableSelect
        value={value}
        onChange={onChange}
        options={options}
        placeholder={loading ? 'Loading books…' : placeholder}
        emptyLabel="No books found — register the book first"
      />
      {loading ? <p className="mt-1 text-xs text-slate-400">Loading catalogue…</p> : null}
    </div>
  )
}
