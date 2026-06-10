import {
  type MatrixRow,
  type MatrixSection,
  type PermissionAction,
  permissionMatrixSections,
  rowPermissionNames,
  sectionPermissionNames,
} from '../../config/permissionMatrixConfig'

type PermissionRecord = { id: number; name: string }

function cellNames(row: MatrixRow, action: PermissionAction): string[] {
  return row[action] ?? []
}

function resolveIds(names: string[], byName: Map<string, number>): number[] {
  return names.map((n) => byName.get(n)).filter((id): id is number => typeof id === 'number')
}

function cellState(names: string[], selected: Set<number>, byName: Map<string, number>) {
  const ids = resolveIds(names, byName)
  if (ids.length === 0) return { disabled: true, checked: false, indeterminate: false, ids: [] as number[] }
  const checkedCount = ids.filter((id) => selected.has(id)).length
  return {
    disabled: false,
    checked: checkedCount === ids.length,
    indeterminate: checkedCount > 0 && checkedCount < ids.length,
    ids,
  }
}

function sectionState(section: MatrixSection, selected: Set<number>, byName: Map<string, number>) {
  const ids = resolveIds(sectionPermissionNames(section), byName)
  if (ids.length === 0) return { disabled: true, checked: false, indeterminate: false, ids: [] as number[] }
  const checkedCount = ids.filter((id) => selected.has(id)).length
  return {
    disabled: false,
    checked: checkedCount === ids.length,
    indeterminate: checkedCount > 0 && checkedCount < ids.length,
    ids,
  }
}

function rowState(row: MatrixRow, selected: Set<number>, byName: Map<string, number>) {
  const ids = resolveIds(rowPermissionNames(row), byName)
  if (ids.length === 0) return { disabled: true, checked: false, indeterminate: false, ids: [] as number[] }
  const checkedCount = ids.filter((id) => selected.has(id)).length
  return {
    disabled: false,
    checked: checkedCount === ids.length,
    indeterminate: checkedCount > 0 && checkedCount < ids.length,
    ids,
  }
}

function toggleIds(ids: number[], selected: Set<number>, checked: boolean): Set<number> {
  const next = new Set(selected)
  if (checked) ids.forEach((id) => next.add(id))
  else ids.forEach((id) => next.delete(id))
  return next
}

function Checkbox({
  checked,
  indeterminate,
  disabled,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
  label?: string
}) {
  return (
    <label className={`inline-flex items-center justify-center gap-2 ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300"
        checked={checked}
        disabled={disabled}
        ref={(el) => {
          if (el) el.indeterminate = Boolean(indeterminate)
        }}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label ? <span className="sr-only">{label}</span> : null}
    </label>
  )
}

export default function PermissionMatrix({
  permissions,
  selectedIds,
  onChange,
}: {
  permissions: PermissionRecord[]
  selectedIds: number[]
  onChange: (ids: number[]) => void
}) {
  const byName = new Map(permissions.map((p) => [p.name, p.id]))
  const selected = new Set(selectedIds)

  const setSelected = (next: Set<number>) => onChange([...next])

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="grid grid-cols-[minmax(180px,1.4fr)_repeat(3,72px)] items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span>Menu / Sub-menu</span>
          <span className="text-center">View</span>
          <span className="text-center">Edit</span>
          <span className="text-center">Delete</span>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
        {permissionMatrixSections.map((section) => {
          const header = sectionState(section, selected, byName)
          return (
            <div key={section.id} className="border-b border-slate-100 last:border-b-0">
              <div className="grid grid-cols-[minmax(180px,1.4fr)_repeat(3,72px)] items-center gap-2 bg-slate-100/80 px-4 py-2.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Checkbox
                    checked={header.checked}
                    indeterminate={header.indeterminate}
                    disabled={header.disabled}
                    onChange={(checked) => setSelected(toggleIds(header.ids, selected, checked))}
                    label={`Select all ${section.label}`}
                  />
                  {section.label}
                </label>
                {(['view', 'edit', 'delete'] as PermissionAction[]).map((action) => {
                  const names = section.rows.flatMap((r) => cellNames(r, action))
                  const cell = cellState(names, selected, byName)
                  return (
                    <div key={action} className="flex justify-center">
                      <Checkbox
                        checked={cell.checked}
                        indeterminate={cell.indeterminate}
                        disabled={cell.disabled}
                        onChange={(checked) => setSelected(toggleIds(cell.ids, selected, checked))}
                        label={`${section.label} ${action}`}
                      />
                    </div>
                  )
                })}
              </div>

              {section.rows.map((row) => {
                const line = rowState(row, selected, byName)
                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[minmax(180px,1.4fr)_repeat(3,72px)] items-center gap-2 border-t border-slate-50 px-4 py-2 pl-8"
                  >
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <Checkbox
                        checked={line.checked}
                        indeterminate={line.indeterminate}
                        disabled={line.disabled}
                        onChange={(checked) => setSelected(toggleIds(line.ids, selected, checked))}
                        label={`Select all ${row.label}`}
                      />
                      {row.label}
                    </label>
                    {(['view', 'edit', 'delete'] as PermissionAction[]).map((action) => {
                      const names = cellNames(row, action)
                      const cell = cellState(names, selected, byName)
                      return (
                        <div key={action} className="flex justify-center">
                          <Checkbox
                            checked={cell.checked}
                            indeterminate={cell.indeterminate}
                            disabled={cell.disabled}
                            onChange={(checked) => setSelected(toggleIds(cell.ids, selected, checked))}
                            label={`${row.label} ${action}`}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function unmappedPermissions(permissions: PermissionRecord[]): PermissionRecord[] {
  const mapped = new Set(
    permissionMatrixSections.flatMap((s) => s.rows.flatMap((r) => rowPermissionNames(r)))
  )
  return permissions.filter((p) => !mapped.has(p.name)).sort((a, b) => a.name.localeCompare(b.name))
}
