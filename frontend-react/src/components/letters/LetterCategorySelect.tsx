type Props = {
  categories: Array<{ id: number; name: string; color_tag?: string }>
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function LetterCategorySelect({ categories, value, onChange, disabled }: Props) {
  if (!categories.length) {
    return <p className="text-sm text-slate-500">No categories configured yet.</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(cat => {
        const color = cat.color_tag || '#3b82f6'
        const selected = value === String(cat.id)
        return (
          <button
            key={cat.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(String(cat.id))}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              selected ? 'ring-2 ring-offset-1 shadow-sm' : 'opacity-90 hover:opacity-100'
            } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            style={{
              backgroundColor: `${color}18`,
              borderColor: selected ? color : `${color}55`,
              color,
              ...(selected ? { ringColor: color } : {}),
            }}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
